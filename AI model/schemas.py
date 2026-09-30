import json
import re
from datetime import date, datetime
from typing import Any


ALLOWED_VERDICTS = {"contested", "accepted", "insufficient_evidence"}
FALLBACK_REASON = "Evidence or an applicable authoritative rule is missing; manual review is required."


def _extract_json(raw_text: str) -> Any:
    cleaned = raw_text.strip()
    if "```" in cleaned:
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
        if match:
            cleaned = match.group(1).strip()
    first_brace = cleaned.find("{")
    last_brace = cleaned.rfind("}")
    if first_brace != -1 and last_brace != -1:
        cleaned = cleaned[first_brace:last_brace + 1]
    return json.loads(cleaned)


def fallback_decisions(context: dict[str, Any], reason: str = FALLBACK_REASON) -> list[dict[str, Any]]:
    return [
        {
            "chargeId": charge.get("lineId", ""),
            "verdict": "insufficient_evidence",
            "reason": reason,
            "evidenceRecordIds": [],
            "requirementIds": [],
        }
        for charge in context.get("charges", [])
    ]


def _parse_date(value: Any) -> date | None:
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        return datetime.fromisoformat(value.strip().replace("Z", "+00:00")).date()
    except ValueError:
        try:
            return date.fromisoformat(value.strip())
        except ValueError:
            return None


def normalize_model_output(raw_text: str, context: dict[str, Any]) -> list[dict[str, Any]]:
    """Validate model JSON against known charges, evidence, rules, and timing."""
    decisions = {item["chargeId"]: item for item in fallback_decisions(context)}
    try:
        parsed = _extract_json(raw_text)
    except Exception:
        return list(decisions.values())

    candidates = parsed.get("decisions") if isinstance(parsed, dict) else None
    if not isinstance(candidates, list):
        return list(decisions.values())

    charges = {str(item.get("lineId")): item for item in context.get("charges", []) if item.get("lineId")}
    evidence = {
        str(item.get("recordId")): item
        for item in context.get("evidence", [])
        if item.get("recordId")
    }
    requirements = {
        str(item.get("id")): item
        for item in context.get("requirements", [])
        if item.get("id") is not None
    }
    seen: set[str] = set()
    duplicates: set[str] = set()

    for candidate in candidates:
        if not isinstance(candidate, dict):
            continue
        charge_id = candidate.get("chargeId")
        if not isinstance(charge_id, str) or charge_id not in charges:
            continue
        if charge_id in seen:
            duplicates.add(charge_id)
            decisions[charge_id] = fallback_decisions({"charges": [charges[charge_id]]})[0]
            continue
        seen.add(charge_id)

        verdict = candidate.get("verdict")
        reason = candidate.get("reason")
        evidence_ids = candidate.get("evidenceRecordIds")
        requirement_ids = candidate.get("requirementIds")
        if (
            verdict not in ALLOWED_VERDICTS
            or not isinstance(reason, str)
            or not reason.strip()
            or not isinstance(evidence_ids, list)
            or not isinstance(requirement_ids, list)
            or any(not isinstance(item, str) for item in evidence_ids)
            or any(not isinstance(item, (str, int)) for item in requirement_ids)
            or not set(evidence_ids).issubset(evidence)
            or not {str(item) for item in requirement_ids}.issubset(requirements)
        ):
            continue

        if verdict == "insufficient_evidence":
            decisions[charge_id] = {
                "chargeId": charge_id,
                "verdict": verdict,
                "reason": reason.strip()[:1500],
                "evidenceRecordIds": evidence_ids,
                "requirementIds": requirement_ids,
            }
            continue

        charge = charges[charge_id]
        charge_type = charge.get("chargeType")
        granularity = (charge.get("granularity") or "unit").lower()
        charged_on = _parse_date(charge.get("chargedAt") or charge.get("postedDate"))
        cited_requirements = [requirements[str(item)] for item in requirement_ids]
        cited_evidence = [evidence[item] for item in evidence_ids]

        if verdict == "contested":
            supporting = [item for item in cited_evidence if str(item.get("status", "")).upper() == "PASS"]
            if supporting:
                cited_evidence = supporting
                evidence_ids = [str(item.get("recordId")) for item in supporting]
        elif verdict == "accepted":
            supporting = [item for item in cited_evidence if str(item.get("status", "")).upper() == "FAIL"]
            if supporting:
                cited_evidence = supporting
                evidence_ids = [str(item.get("recordId")) for item in supporting]

        allow_unverified_rules = context.get("allowUnverifiedRules", True)
        rules_apply = bool(cited_requirements) and all(
            (item.get("verified") is True or bool(allow_unverified_rules))
            and
            isinstance(item.get("rule"), str)
            and item["rule"].strip()
            and item.get("chargeType")
            and charge_type
            and item["chargeType"].lower() == charge_type.lower()
            for item in cited_requirements
        )
        evidence_predates_charge = charged_on is not None and bool(cited_evidence) and all(
            _parse_date(item.get("timestamp")) is not None
            and _parse_date(item.get("timestamp")) <= charged_on
            for item in cited_evidence
        )
        evidence_supports_verdict = (
            verdict == "contested"
            and bool(cited_evidence)
            and all(str(item.get("status", "")).upper() == "PASS" for item in cited_evidence)
        ) or (
            verdict == "accepted"
            and any(str(item.get("status", "")).upper() == "FAIL" for item in cited_evidence)
        )

        if granularity != "unit" or not rules_apply or not evidence_predates_charge or not evidence_supports_verdict:
            continue

        decisions[charge_id] = {
            "chargeId": charge_id,
            "verdict": verdict,
            "reason": reason.strip()[:1200],
            "evidenceRecordIds": evidence_ids,
            "requirementIds": requirement_ids,
        }

    for duplicate_id in duplicates:
        decisions[duplicate_id] = fallback_decisions({"charges": [charges[duplicate_id]]})[0]
        decisions[duplicate_id]["reason"] = "Model returned duplicate decisions; manual review is required."

    return list(decisions.values())