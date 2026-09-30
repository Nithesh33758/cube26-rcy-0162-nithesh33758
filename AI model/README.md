# Local Recovery Decision Model

This folder contains the Python inference service and validation code for the Recovery Manager. It uses the pretrained open-source [Qwen2.5-1.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct) model under its Apache-2.0 license. It does not train or fine-tune model weights and does not use Gemini.

## Install on this machine

The current machine has an RTX 4060 Laptop GPU with 8 GB VRAM and Python 3.14. In PowerShell:

```powershell
Set-Location "E:\sydon rcm pro\recovery-manager-fork-clean\AI model"
Set-ExecutionPolicy -Scope Process Bypass
.\install.ps1
```

The script creates an isolated `.venv`, installs the CUDA 13.0 PyTorch wheel plus service dependencies, and verifies GPU access. The model weights are downloaded from Hugging Face on the first inference and cached in the user profile, not in this repository. Expect several GB of download/cache space.

## Run the local service

```powershell
Set-Location "E:\sydon rcm pro\recovery-manager-fork-clean\AI model"
.\.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8090
```

Health check: `http://127.0.0.1:8090/health`.

Start Spring Boot separately with `LOCAL_AI_URL=http://127.0.0.1:8090/v1/analyze-unit`. The backend sends one unit and its charges, evidence summaries, and supplied rules per request. The Python service removes the organization ID and evidence metadata before model inference. Do not add personal data or secrets to findings/rules; this is local inference but application logs or model caches should still be treated as project data.

## Decision safeguards and limitations

The Python service and Java bridge only accept `CONTESTED`, `ACCEPTED`, and `INSUFFICIENT_EVIDENCE`. They verify referenced charge/evidence/rule IDs, matching charge types, PASS/FAIL states, and evidence dates. Shipment/order-level cases remain insufficient until granularity-aware matching is implemented. Reimbursement and claim-window outcomes stay deterministic. Missing rules/evidence, invalid model JSON, or service errors fail open to review.

The official organizer evidence contract and verified Amazon policies are still required before this model can produce meaningful claim decisions. Included synthetic samples are for software workflow checks only, not ground truth or proof of model accuracy.

## Run the supplied-data sample adapter

The repository includes synthetic fee rows and four upstream CSVs. The adapter joins them by `unit_id`, normalizes pod-specific values into the model evidence shape, attaches the charge-to-evidence mappings from `recovery-data-contract.md`, and sends one unit per request:

```powershell
Set-Location "E:\sydon rcm pro\recovery-manager-fork-clean\AI model"
& ".\.venv\Scripts\python.exe" run_sample_analysis.py
```

The adapter loads `amazon_rules.json`, which records official Amazon source URLs and the retrieval date. Detailed Seller Central pages currently require authentication, so the catalog entries are `verified: false`; the model refuses claim-supporting verdicts until the policy text is verified and the entry is updated with the marketplace, effective date, and evidence requirements. The generated `sample_analysis_results.json` is local output and should not be committed.

The catalog also contains Amazon-aligned **working assumptions** for lost inbound, warehouse damage, and customer returns. These assumptions are useful for traceable review and test scenarios and are enabled by default for local demo work while the project is still being refined. Conflicting windows, especially lost-inbound timing, still remain conservative and may be insufficient unless the evidence clearly supports the charge.

## Synthetic demo mode

For a hackathon demo using the supplied synthetic fixtures, the working assumptions are enabled by default. You can explicitly disable them in stricter runs:

```powershell
$env:LOCAL_AI_ALLOW_UNVERIFIED_RULES = "false"
```

This is not production mode and must not be used to file real claims. Verified Amazon policy text must replace the working assumptions before relying on claim-supporting decisions.

The supplied eight-row run currently returns `insufficient_evidence` for every row. That is expected: the fixtures contain incomplete or contradictory evidence, several fee types have no contract mapping, and no verified Amazon policy catalog has been supplied. This output proves the adapter and model path run; it is not an accuracy result.