# Backend AI Decision Module

The `ai` Java package calls Google's pretrained Gemini model. This project does not train or fine-tune a model.

## Configuration

Set `GEMINI_API_KEY` in the PowerShell session that starts Spring Boot. `GEMINI_MODEL` is optional and defaults to `gemini-3.8-flash`.

```powershell
$env:GEMINI_API_KEY = Read-Host "Gemini API key"
$env:GEMINI_MODEL = "gemini-3.8-flash"
```

Do not put the key in frontend `.env.local`, source files, or a committed `.env` file. The backend reads the key from its process environment and sends it in the Google API authentication header.

## Decision behavior

- The analysis service batches all charges for one unit into one model request.
- It only calls Gemini when a key, evidence records, and non-empty rule definitions are available.
- The model may return `CONTESTED`, `ACCEPTED`, or `INSUFFICIENT_EVIDENCE`. Reimbursement matching remains deterministic; claim-window decisions are not enabled without official window rules.
- The backend validates charge IDs, cited evidence IDs, cited rule IDs, rule-to-charge type, evidence status, and evidence timing. Invalid or incomplete output stays `INSUFFICIENT_EVIDENCE`.
- API errors are caught by the existing analysis flow and kept in the review path; a model failure does not stop persistence.

## Data handling and limitations

Enabling the provider sends the unit ID, charge fields, evidence summaries, and supplied rule definitions to Google's Gemini API. Use it only with data you are authorized to share; do not include secrets or unnecessary personal information.

The official organizer `evidence-contract.md` and verified Amazon policy catalog are not currently in this workspace. Until the evidence schema and authoritative rules are loaded, model output is not production-validated and should be manually reviewed. No API key means the provider remains safely unconfigured and returns `INSUFFICIENT_EVIDENCE`.