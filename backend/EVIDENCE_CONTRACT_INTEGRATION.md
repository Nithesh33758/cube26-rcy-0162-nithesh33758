# Evidence Contract Integration

The Recovery Manager contract client is a tenant-scoped read boundary for `GET /v1/records`. It returns contract records as-is; it does not write to the evidence tables or change charge matching. The existing CSV evidence import remains available as the current data path.

## Configuration

Set these environment variables only after the organizers provide the real values:

| Environment variable | Purpose |
|---|---|
| `EVIDENCE_SERVICE_BASE_URL` | Evidence service base URL |
| `EVIDENCE_SERVICE_AUTH_TYPE` | `bearer` or `header` |
| `EVIDENCE_SERVICE_AUTH_TOKEN` | Secret token for the configured auth type |
| `EVIDENCE_SERVICE_AUTH_HEADER_NAME` | Header name when auth type is `header` |
| `EVIDENCE_ORG_DEMO_ALPHA_UUID` | Contract organization UUID for `org_demo_alpha` |
| `EVIDENCE_ORG_DEMO_BRAVO_UUID` | Contract organization UUID for `org_demo_bravo` |
| `EVIDENCE_SERVICE_CURSOR_PARAMETER` | Request query parameter for `next_cursor`; intentionally unset until confirmed |

Blank or incomplete settings prevent a client request. No service URL, token, or organization UUID is supplied by this project.

## Unresolved Evidence Mappings

These must be agreed before connecting fetched records to charge analysis:

1. **Contract `subject` to Recovery `unitId`:** `subject` has no `unit_id`. The contract does not define how its subject fields map to Recovery charge identifiers.
2. **Agent `check_key` to Recovery requirement/check:** the contract leaves check keys to each agent and does not provide Recovery's key-to-requirement mapping.
3. **Pagination cursor request parameter:** pages return `next_cursor`, but the request parameter name is not specified. Configure `EVIDENCE_SERVICE_CURSOR_PARAMETER` only after it is confirmed.

The client sends no organization UUID query parameter. It requires a configured tenant-to-UUID mapping and rejects records whose `organization_id` does not match the requested local tenant. It does not permit fetching another tenant's records.