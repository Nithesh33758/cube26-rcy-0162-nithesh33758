# Sydon Recovery Manager

**CUBE Buildathon — Commerce Context Stream**

An automated, evidence-backed claims engine for Amazon FBA sellers. Recovery Manager ingests fee charge reports, cross-references each charge against upstream warehouse evidence from four operational managers, and produces deterministic CLAIM / REJECT / UNCERTAIN decisions — enabling sellers to recover erroneous fees with full audit traceability.

**Live Demo:** [cube26-rcy-0162-nithesh33758.onrender.com](https://cube26-rcy-0162-nithesh33758.onrender.com)

---

## Table of Contents

- [Problem Understanding](#problem-understanding)
- [Solution Overview](#solution-overview)
- [Setup Instructions](#setup-instructions)
- [Usage Instructions](#usage-instructions)
- [Assumptions & Limitations](#assumptions--limitations)

---

## Problem Understanding

Amazon FBA sellers are frequently charged operational fees — inbound defect fees, lost-inbound adjustments, fulfilment weight-tier overcharges, damaged-in-warehouse deductions, and refund-issued-item-not-returned penalties. Many of these fees are erroneous: Amazon's automated systems apply charges even when the seller's upstream operational evidence proves compliance.

**The core challenge:**

1. **Volume:** A mid-size seller may receive thousands of charge line-items per month across dozens of fee categories.
2. **Evidence Fragmentation:** The evidence needed to dispute a charge is scattered across four separate operational stages — **Receiving**, **Prep**, **Pack**, and **Returns** — each managed independently.
3. **Manual Review Bottleneck:** Today, sellers (or third-party recovery services) manually cross-reference each charge against warehouse logs, labeling records, and shipment manifests. This is slow, error-prone, and doesn't scale.
4. **Duplicate Claim Risk:** Without tracking already-paid reimbursements, sellers risk filing duplicate disputes, which damages their standing with Amazon.
5. **Audit Traceability:** Amazon requires evidence-backed justifications for every claim. Decisions made without traceable reasoning are rejected or penalized.

**In short:** Sellers are leaving money on the table because the evidence exists to dispute erroneous fees, but the reconciliation process is too manual, too fragmented, and too risky to perform at scale.

---

## Solution Overview

Sydon Recovery Manager automates the end-to-end fee reconciliation pipeline through a deterministic, rule-based decision engine with full evidence traceability.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ ┌────────┐  │
│  │ Charges  │ │Dashboard │ │ Evidence │ │Reviews │ │Analtic │  │
│  │  Upload  │ │ Overview │ │ Explorer │ │ Queue  │ │  -ics  │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ └────────┘  │
└───────────────────────┬─────────────────────────────────────────┘
                        │  REST API (/api/*)
┌───────────────────────▼─────────────────────────────────────────┐
│                   Backend (Spring Boot + Java 25)                │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              7-Step Analysis Pipeline                      │  │
│  │  1. Read Charges → 2. Validate Schema → 3. Match Units    │  │
│  │  4. Retrieve Evidence → 5. Check Requirements             │  │
│  │  6. Generate Decisions → 7. Finalize Results              │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────┐  ┌────────────────────────────────┐   │
│  │ RuleBasedDecision    │  │ EvidenceImportService          │   │
│  │ Provider             │  │ (4-Manager Evidence Loader)    │   │
│  │ (Deterministic Logic)│  │ Receiving│Prep│Pack│Returns    │   │
│  └──────────────────────┘  └────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────┐  ┌────────────────────────────────┐   │
│  │ H2 / PostgreSQL DB   │  │ Tenant Isolation (org_id)      │   │
│  └──────────────────────┘  └────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────────┐
│               AI Model (Python + FastAPI) — Optional            │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐   │
│  │ model_runtime  │  │evidence_adapter│  │  amazon_rules    │   │
│  │   .py          │  │   .py          │  │   .json          │   │
│  └────────────────┘  └────────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, Vite 8, TypeScript, TailwindCSS 4 | Upload panel, charge ledger, dashboard, evidence explorer, review queue, analytics |
| **Backend** | Spring Boot, Java 25, Maven | 7-step analysis pipeline, REST API, schema validation, tenant isolation |
| **Decision Engine** | `RuleBasedDecisionProvider.java` | Deterministic charge-to-evidence matching using Amazon FBA recovery rules |
| **Evidence Store** | CSV fixtures (Receiving, Prep, Pack, Returns) | Upstream operational evidence indexed by unit ID |
| **Database** | H2 (dev/demo) / PostgreSQL (production) | Persists charges, evidence records, decisions, and reimbursement history |
| **AI Model** *(optional)* | Python, FastAPI, Transformers | Alternative LLM-based decision provider (not used by default) |

### Decision Logic

The rule-based engine evaluates each charge type against specific evidence requirements:

| Charge Type | Evidence Required | CLAIM Condition | REJECT Condition |
|---|---|---|---|
| `inbound_defect_fee` | Prep (FNSKU label, polybag, barcode) | All prep checks PASS before charge date | Any prep check FAIL |
| `lost_inbound` | Receiving (quantity match) | Shipped quantity matches received quantity | Quantity mismatch confirmed |
| `damaged_in_warehouse` | Receiving (undamaged at receipt) | Unit was undamaged on receipt | Damage existed at receipt |
| `refund_issued_item_not_returned` | Returns (completeness, identity) | Return completeness PASS | Completeness FAIL or item missing |
| `fulfilment_fee_weight_tier` | Prep + Receiving (packaging compliance) | Packaging and labeling compliance PASS | Non-compliance detected |

If evidence is **missing** or **inconclusive**, the charge is marked **UNCERTAIN** and routed to the human review queue.

---

## Setup Instructions

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| **Java JDK** | 25+ | Spring Boot backend |
| **Maven** | 3.9+ | Backend build |
| **Node.js** | 22+ | React frontend |
| **npm** | 10+ | Frontend dependency management |
| **Python** | 3.11+ | AI model service (optional) |
| **Docker** | 24+ | Container deployment (optional) |

### Option 1: Local Development

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd recovery-manager-fork-clean
```

#### 2. Start the Backend

```bash
cd backend

# Copy environment variables
cp .env.example .env

# Build and run (uses embedded H2 database by default)
mvn clean package -DskipTests
java -jar target/recovery-manager-backend-*.jar
```

The backend starts on **http://localhost:8081** with an embedded H2 database (no external DB setup needed for development).

#### 3. Start the Frontend

```bash
cd recovery-manager

# Install dependencies
npm install

# Create environment file
echo "VITE_API_BASE_URL=http://localhost:8081" > .env

# Start dev server
npm run dev
```

The frontend starts on **http://localhost:3000** and proxies API requests to the backend.

#### 4. (Optional) Start the AI Model Service

```bash
cd "AI model"

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.\.venv\Scripts\Activate.ps1
# Activate (macOS/Linux)
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the service
python app.py
```

The AI service starts on **http://localhost:8090**. The backend will automatically use it if `LOCAL_AI_URL` is configured.

### Option 2: Docker (Production)

```bash
# Build and run the full application
docker build -t sydon-recovery-manager .
docker run -p 8080:8080 \
  -e DEFAULT_ORG_ID=org_demo_alpha \
  -e FRONTEND_ORIGINS="*" \
  sydon-recovery-manager
```

The Docker image is a multi-stage build that:
1. Compiles the React frontend with Vite
2. Builds the Spring Boot backend with Maven
3. Bundles the frontend assets into the backend's static resources
4. Runs as a single self-contained JAR

Access the application at **http://localhost:8080**.

### Option 3: Render (Cloud Deployment)

The project includes a `render.yaml` for one-click deployment on Render:

```bash
# Deploy using Render CLI or connect the GitHub repo
# The render.yaml auto-configures:
#   - Docker build from Dockerfile
#   - Port: 10000
#   - Region: Oregon
#   - Free tier plan
```

### Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `PORT` / `SERVER_PORT` | `8081` | Server port |
| `DEFAULT_ORG_ID` | `org_demo_alpha` | Default tenant organization |
| `FRONTEND_ORIGINS` | `http://localhost:3000` | CORS allowed origins |
| `DB_URL` | `jdbc:h2:file:./data/recovery_db` | Database connection URL |
| `DB_USERNAME` | `sa` | Database username |
| `DB_PASSWORD` | *(empty)* | Database password |
| `LOCAL_AI_URL` | `http://127.0.0.1:8000/v1/analyze-unit` | AI model service endpoint |

---

## Usage Instructions

### Step 1: Upload a Fee Report

1. Navigate to the **Charges** tab.
2. Drag and drop a CSV file or click **Choose CSV File**.
3. The system auto-detects the schema format:
   - **Normalized charge report** — requires: `charge_id`, `charge_type`, `charge_subtype`, `charged_at`, `granularity`, `quantity`, `currency`, `amount_total`, `description`
   - **Legacy charge ledger** — requires: `line_id`, `report_type`, `unit_id`, `org_id`, `sku`, `fnsku`, `fba_shipment_id`, `order_id`, `charge_type`, `quantity`, `amount_usd`, `posted_date`
4. The validator confirms schema integrity (e.g., "12/12 Columns Valid").

**Sample data:** Use `data/fee_report_sample.csv` (60 rows across 5 fee types) to test the full workflow.

### Step 2: Import Reimbursements (Optional)

Before analysis, import your existing reimbursements CSV via the **Import Reimbursement CSV** button to suppress duplicate claim recommendations.

### Step 3: Run Analysis

1. Click **Start Analysis** to trigger the 7-step pipeline.
2. Watch the real-time progress tracker:
   - Reading charges → Validating report → Matching units → Retrieving upstream evidence → Checking requirements → Generating decisions → Finalizing results
3. The analysis completes in seconds for datasets up to 50,000 rows.

### Step 4: Review Results

- **Charges Tab** — Full charge ledger with CLAIM / REJECT / UNCERTAIN decisions, filterable by decision type and fee category.
- **Dashboard Tab** — Recovery snapshot, decision overview visualization, and human review queue.
- **Evidence Tab** — Unified Evidence Master Ledger with all telemetry logs, filterable by source manager (Receiving, Prep, Pack, Returns) and evidence status (PASS, FAIL, UNCERTAIN).
- **Reviews Tab** — Detailed review cards for uncertain charges, showing discrepancy notes, evidence gaps, and inspection links.
- **Analytics Tab** — Operational KPIs, claim precision metrics, and charge breakdown by type with claim rates.

### Step 5: Export Results

Click **Export Recovery CSV** to download the complete analysis — every charge ID, decision, evidence count, and status — ready for claim filing or operational review.

### API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/charges/upload` | `POST` | Upload a charge report CSV |
| `/api/charges/analyze` | `POST` | Start analysis pipeline |
| `/api/charges/results` | `GET` | Fetch analysis results |
| `/api/evidence` | `GET` | Query evidence records |
| `/api/reimbursements/upload` | `POST` | Import reimbursement history |
| `/v3/api-docs` | `GET` | OpenAPI specification |
| `/swagger-ui.html` | `GET` | Swagger UI documentation |

---

## Assumptions & Limitations

### Assumptions

1. **Evidence Pre-existence:** The system assumes upstream evidence from all four managers (Receiving, Prep, Pack, Returns) is pre-loaded as CSV fixtures in `data/upstream/`. In a production environment, these would be fetched via API from each operational manager.

2. **Charge Type Coverage:** The rule-based decision engine covers five Amazon FBA fee types:
   - `inbound_defect_fee`
   - `lost_inbound`
   - `damaged_in_warehouse`
   - `refund_issued_item_not_returned`
   - `fulfilment_fee_weight_tier`

   Charges outside these types receive an UNCERTAIN decision with a note for manual review.

3. **Single Currency:** The system assumes all charges are in **USD**. Multi-currency reconciliation is not supported in this version.

4. **Organization-Scoped:** Each analysis is scoped to a single `org_id`. The system enforces tenant isolation — rows with mismatched organization IDs are rejected from the analysis and surfaced as validation warnings.

5. **No Auto-Filing:** The system **does not** automatically file claims with Amazon. It produces recommendations (CLAIM / REJECT / UNCERTAIN) that a human operator reviews before taking action. This is a deliberate design choice to prevent erroneous automated filings.

6. **Deterministic Decisions:** The default `RuleBasedDecisionProvider` uses deterministic logic (no ML/LLM). Decisions are fully reproducible given the same input data and evidence.

### Limitations

1. **Evidence Fixture Mode:** In the current buildathon implementation, evidence data is loaded from static CSV files (`data/upstream/receiving_sample.csv`, `prep_sample.csv`, `pack_sample.csv`, `returns_sample.csv`). A production version would integrate with live upstream manager APIs.

2. **No Historical Trending:** Analytics are computed per-analysis session. There is no cross-session trending, historical comparison, or time-series dashboards.

3. **Review-Only Audit Trail:** The Reviews tab displays uncertain charges for inspection but does **not** persist auditor override decisions. The backend decision remains unchanged after review. This is intentional for auditability but limits the current review workflow.

4. **AI Model is Optional:** The Python-based AI model (`AI model/`) provides an alternative LLM-based decision path but is **not used by default**. The production decision engine is the Java `RuleBasedDecisionProvider`, which avoids LLM hallucination risks.

5. **Database:** The demo deployment uses an embedded **H2 database**, which is suitable for single-instance demos but not for production workloads. PostgreSQL is supported and recommended for production use (see `.env.example`).

6. **File Size Limit:** CSV uploads are capped at **25 MB** (~50,000 rows). Reports exceeding this limit must be split before upload.

7. **Browser Compatibility:** The frontend is built with React 19 and modern CSS. It requires a modern browser (Chrome 90+, Firefox 88+, Edge 90+, Safari 15+).

---

## Tech Stack Summary

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript 7, Vite 8, TailwindCSS 4, Lucide Icons, Motion |
| **Backend** | Java 25, Spring Boot, Maven, JPA/Hibernate, H2/PostgreSQL |
| **AI Model** | Python, FastAPI, Uvicorn, Transformers, Accelerate |
| **Deployment** | Docker (multi-stage), Render (cloud) |
| **Data** | CSV ingestion, structured evidence fixtures, OpenAPI 3.0 |

---

## Project Structure

```
recovery-manager-fork-clean/
├── backend/                    # Spring Boot backend (Java 25)
│   ├── src/main/java/          # Application source code
│   │   └── .../backend/
│   │       ├── ai/             # Decision engine (RuleBasedDecisionProvider)
│   │       ├── controller/     # REST API controllers
│   │       ├── model/          # JPA entities
│   │       ├── repository/     # Data access layer
│   │       └── service/        # Business logic & analysis pipeline
│   └── src/main/resources/     # Configuration & static assets
├── recovery-manager/           # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/         # UI components (ChargeTable, Dashboard, etc.)
│   │   ├── services/           # API client services
│   │   └── App.tsx             # Root application component
│   └── package.json
├── AI model/                   # Python AI service (optional)
│   ├── model_runtime.py        # Inference engine
│   ├── evidence_adapter.py     # Evidence parsing & matching
│   ├── schemas.py              # Data contracts
│   └── amazon_rules.json       # Amazon FBA recovery rule definitions
├── data/                       # Sample data & evidence fixtures
│   ├── upstream/               # Evidence CSVs (receiving, prep, pack, returns)
│   └── fee_report_sample.csv   # Sample charge report for testing
├── Dockerfile                  # Multi-stage production build
├── render.yaml                 # Render cloud deployment config
└── README.md                   # This file
```

---

## License

Built for the CUBE Buildathon — Commerce Context Stream.

**Team Sydon**
