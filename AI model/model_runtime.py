import json
import os
import threading
from typing import Any

from evidence_adapter import RULES
from schemas import FALLBACK_REASON, fallback_decisions, normalize_model_output


MODEL_ID = os.getenv("LOCAL_MODEL_ID", "Qwen/Qwen2.5-1.5B-Instruct")
# Use the current working-assumption catalog by default for demo/testing, while still allowing explicit
# strict mode via LOCAL_AI_ALLOW_UNVERIFIED_RULES=false when the policy catalog is later replaced with
# fully verified Amazon rules.
ALLOW_UNVERIFIED_RULES = os.getenv("LOCAL_AI_ALLOW_UNVERIFIED_RULES", "true").lower() == "true"
SYSTEM_PROMPT = """You are an automated Amazon recovery-charge review assistant.
For each charge, assess the relevant evidence against Amazon policy requirements.
Output JSON only:
{"decisions": [{"chargeId": "...", "verdict": "contested" | "accepted" | "insufficient_evidence", "reason": "...", "evidenceRecordIds": ["..."], "requirementIds": [1001]}]}

DECISION RULES:
1. "contested" (dispute an incorrect charge / claim reimbursement):
   - inbound_defect_fee: Prep evidence shows packaging/labeling complied before charge date (e.g. fnsku_label_flat, polybag, barcode covered have status PASS). Cite the PASS prep records.
   - lost_inbound: Receiving evidence shows quantity_matches_po is PASS. Cite the PASS quantity record.
   - damaged_in_warehouse: Receiving evidence shows unit_undamaged is PASS at receipt. Cite the PASS record.
   - fulfilment_fee_weight_tier: Prep/labeling checks have status PASS. Cite the PASS records.
   ALWAYS cite only records with status "PASS" for contested.

2. "accepted" (Amazon fee or adjustment is legitimate because a defect/shortage occurred):
   - lost_inbound: Receiving evidence shows quantity_matches_po is FAIL (received quantity was short). Cite the FAIL record.
   - refund_issued_item_not_returned: Returns evidence shows completeness_verified is FAIL (parts missing) or customer damaged. Cite the FAIL record.
   - inbound_defect_fee: Prep evidence shows failure/defect. Cite the FAIL record.
   ALWAYS cite only records with status "FAIL" for accepted.

3. "insufficient_evidence": Evidence is completely missing, all relevant checks are UNCERTAIN, or conflicting.

EXAMPLES:
Example 1:
Input: Charge "inbound_defect_fee" posted 2026-07-20. Evidence has PRP-0001:fnsku_label_flat (PASS), PRP-0001:fnsku_label_placement_valid (PASS), PRP-0001:manufacturer_barcode_covered (PASS) from 2026-06-08.
Output: {"decisions":[{"chargeId":"...","verdict":"contested","reason":"Prep evidence confirms FNSKU label placement was valid and barcode was covered prior to charge date.","evidenceRecordIds":["PRP-0001:fnsku_label_flat","PRP-0001:fnsku_label_placement_valid","PRP-0001:manufacturer_barcode_covered"],"requirementIds":[1001]}]}

Example 2:
Input: Charge "lost_inbound" posted 2026-06-19. Evidence has RCV-0002:quantity_matches_po (FAIL, 44 received vs 48 ordered).
Output: {"decisions":[{"chargeId":"...","verdict":"accepted","reason":"Receiving inspection confirms shipment quantity received was short by 4 units, validating the lost inbound adjustment.","evidenceRecordIds":["RCV-0002:quantity_matches_po"],"requirementIds":[1002]}]}

Return JSON only."""


class LocalModelRuntime:
    def __init__(self, model_id: str = MODEL_ID) -> None:
        self.model_id = model_id
        self._model: Any = None
        self._tokenizer: Any = None
        self._torch: Any = None
        self._load_lock = threading.Lock()
        self._generation_lock = threading.Lock()

    @property
    def loaded(self) -> bool:
        return self._model is not None

    @property
    def device(self) -> str:
        if not self.loaded:
            return "not_loaded"
        return str(self._model.device)

    def analyze_unit(self, context: dict[str, Any]) -> list[dict[str, Any]]:
        charges = context.get("charges")
        if not isinstance(charges, list) or not charges:
            raise ValueError("A unit request must include at least one charge")

        evidence = context.get("evidence") or []
        requirements = context.get("requirements") or []
        applicable_rules = [
            requirement
            for requirement in requirements
            if isinstance(requirement, dict)
            and (requirement.get("verified") is True or ALLOW_UNVERIFIED_RULES)
            and isinstance(requirement.get("rule"), str)
            and requirement["rule"].strip()
        ]
        if not evidence or not applicable_rules:
            return fallback_decisions(context, FALLBACK_REASON)

        charge_types = {str(c.get("chargeType", "")).lower() for c in charges if c.get("chargeType")}
        relevant_check_keys = set()
        for ct in charge_types:
            relevant_check_keys.update(RULES.get(ct, {}).get("checks", {}).keys())

        cleaned_evidence = []
        for item in evidence:
            if not isinstance(item, dict):
                continue
            status = item.get("status")
            finding = str(item.get("finding", "")).lower()
            if "not_required" in finding and status == "UNCERTAIN":
                status = "PASS"
            cleaned_evidence.append({
                "recordId": item.get("recordId"),
                "sourceType": item.get("sourceType"),
                "requirement": item.get("requirement"),
                "status": status,
                "finding": item.get("finding"),
                "timestamp": item.get("timestamp"),
            })

        if relevant_check_keys:
            relevant = [e for e in cleaned_evidence if e.get("requirement") in relevant_check_keys]
            sorted_evidence = relevant if relevant else cleaned_evidence
        else:
            sorted_evidence = cleaned_evidence

        safe_context = {
            "unitId": context.get("unitId"),
            "charges": charges,
            "evidence": sorted_evidence,
            "requirements": requirements,
            "allowUnverifiedRules": ALLOW_UNVERIFIED_RULES,
        }

        try:
            self._ensure_loaded()
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(safe_context, ensure_ascii=False, default=str)},
            ]
            with self._generation_lock:
                model_inputs = self._tokenizer.apply_chat_template(
                    messages,
                    tokenize=True,
                    add_generation_prompt=True,
                    return_tensors="pt",
                    return_dict=True,
                )
                model_inputs = model_inputs.to(self._model.device)
                with self._torch.inference_mode():
                    generated = self._model.generate(
                        **model_inputs,
                        max_new_tokens=384,
                        do_sample=False,
                        pad_token_id=self._tokenizer.eos_token_id,
                    )
                prompt_length = model_inputs["input_ids"].shape[-1]
                output = self._tokenizer.decode(generated[0][prompt_length:], skip_special_tokens=True)
            return normalize_model_output(output, safe_context)
        except Exception as error:
            raise RuntimeError("Local model inference failed") from error

    def _ensure_loaded(self) -> None:
        if self.loaded:
            return
        with self._load_lock:
            if self.loaded:
                return
            try:
                import torch
                from transformers import AutoModelForCausalLM, AutoTokenizer
            except ImportError as error:
                raise RuntimeError("Install requirements from AI model/requirements.txt first") from error

            self._torch = torch
            self._tokenizer = AutoTokenizer.from_pretrained(self.model_id)
            self._model = AutoModelForCausalLM.from_pretrained(
                self.model_id,
                torch_dtype="auto",
                device_map="auto",
                low_cpu_mem_usage=True,
            )
            self._model.eval()