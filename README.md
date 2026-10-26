# Self-Healing Cloud Infrastructure Using Multi-Agent AI for Autonomous Remediation

[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB.svg)](https://reactjs.org/)
[![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn-F7931E.svg)](https://scikit-learn.org/)
[![Multi-Cloud](https://img.shields.io/badge/Cloud-AWS%20%7C%20Azure%20%7C%20GCP-orange.svg)](#)
[![Safety Mode](https://img.shields.io/badge/Remediation-Simulation%20Default-green.svg)](#)

---

## 1. Project Introduction

Modern enterprise services operate across heterogeneous multi-cloud environments (Amazon Web Services, Microsoft Azure, Google Cloud Platform). Infrastructure failures, resource saturations, and cyber-attacks (e.g., Denial of Service, brute-force intrusions, SQL injection, privilege escalation) can lead to service downtime and data breaches. 

This project implements an end-to-end **Self-Healing Cloud Infrastructure** driven by **Multi-Agent Artificial Intelligence**, **Supervised Machine Learning (Random Forest)**, and **Retrieval-Augmented Generation (RAG)**. The platform detects anomalies, classifies attacks against verified public benchmark datasets (CIC-IDS2017 & ADFA-LD), performs root-cause investigation, retrieves safe operational playbooks, executes governed remediation (with Simulation, Human Approval, and Authorized Execution modes), and verifies infrastructure recovery.

---

## 2. Problem Statement

Traditional cloud infrastructure management relies heavily on static threshold alerts and human Site Reliability Engineers (SREs):
- **Alert Fatigue & Slow MTTR**: Operations teams receive thousands of disconnected alerts across AWS CloudWatch, Azure Monitor, and GCP Cloud Monitoring. Mean Time to Resolution (MTTR) is high due to manual correlation.
- **Conflation of Anomalies and Attacks**: Basic thresholds (e.g., high CPU) cannot distinguish between a legitimate spike, a crypto-miner, a DDoS flood, or a brute-force attack.
- **Risk of Blind Automation**: Naive auto-remediation scripts risk breaking production workloads by taking destructive actions without safe simulation, policy guardrails, or recovery verification.

---

## 3. Project Objectives

1. **Multi-Cloud Monitoring**: Collect unified infrastructure metrics and operational events across AWS, Azure, and GCP through standard adapter interfaces.
2. **ML Attack Classification**: Train a robust Random Forest classifier using verified public datasets (CIC-IDS2017 network flows and ADFA-LD host traces) to accurately distinguish normal behavior from attacks.
3. **Multi-Agent Collaborative Reasoning**: Coordinate specialized AI agents (Monitoring, Detection, Coordinator, Root Cause, RAG, Remediation, and Verification) to handle the complete incident lifecycle.
4. **Governed Safe Remediation**: Enforce strict safety guardrails with **Simulation** mode enabled by default, human **Approval Required** workflows, and least-privilege **Authorized Execution**.
5. **Post-Action Verification**: Validate whether infrastructure metrics have actually stabilized after remediation before declaring an incident resolved.

---

## 4. Existing System vs. Proposed System

| Dimension | Existing Cloud Monitoring Systems | Proposed Multi-Agent Self-Healing System |
|---|---|---|
| **Monitoring Scope** | Siloed per provider (CloudWatch, Azure Monitor, GCP Operations) | Unified Multi-Cloud Adapter with standardized telemetry schemas |
| **Detection Logic** | Static thresholds or unverified heuristics | Hybrid: Scikit-learn Random Forest classifier + Resource anomaly policies |
| **Root Cause Analysis** | Manual human log inspection and correlation | AI Root Cause Agent + Knowledge Retrieval (RAG) using verified runbooks |
| **Remediation Execution** | Rigid scripts, manual intervention, or unchecked scripts | Tri-mode governed execution (Simulation by default, Approval, Authorized) |
| **Post-Remediation** | Assumes action success without health re-check | Verification Agent with fresh telemetry polling and retry limits |
| **Cloud Independence** | Vendor lock-in | Abstract base adapter architecture extensible to any cloud provider |

---

## 5. Proposed System Architecture

```mermaid
flowchart TD
    subgraph Multi_Cloud ["Multi-Cloud Telemetry"]
        AWS[AWS CloudWatch / EC2]
        AZURE[Azure Monitor / VMs]
        GCP[GCP Operations / Compute]
    end

    subgraph Data_Pipeline ["Data Pipeline & ML Engine"]
        CIC[CIC-IDS2017 Dataset]
        ADFA[ADFA-LD Dataset]
        PREP[Feature Preprocessing]
        RF[Random Forest Classifier]
        CIC --> PREP
        ADFA --> PREP
        PREP --> RF
    end

    subgraph Multi_Agent_Core ["Multi-Agent AI Core"]
        MON[Monitoring Agent]
        DET[Detection Agent]
        COORD[Coordinator Agent]
        RCA[Root Cause Agent]
        RAG[RAG Agent & Vector KB]
        REM[Remediation Agent]
        VER[Verification Agent]
    end

    subgraph Governance ["Safety & Remediation Modes"]
        SIM[Mode 1: SIMULATION (Default)]
        APPR[Mode 2: APPROVAL_REQUIRED]
        AUTH[Mode 3: AUTHORIZED_EXECUTION]
    end

    subgraph Presentation ["Application & Dashboard"]
        API[FastAPI REST API & SQLite DB]
        UI[React / Vite Cloud Operations Dashboard]
    end

    AWS & AZURE & GCP --> MON
    MON --> DET
    RF -.-> DET
    DET --> COORD
    COORD --> RCA
    COORD --> RAG
    RCA & RAG --> REM
    REM --> SIM & APPR & AUTH
    SIM & APPR & AUTH --> VER
    VER --> COORD
    Multi_Agent_Core <--> API
    API <--> UI
```

---

## 6. Technologies Used

- **Programming Language**: Python 3.12
- **Machine Learning**: Scikit-learn (Random Forest), Pandas, NumPy, Joblib, Matplotlib, Seaborn
- **Backend**: FastAPI, Uvicorn, Pydantic v2, SQLAlchemy, SQLite
- **AI & RAG**: Sentence Transformers, Vector Similarity Search, Optional OpenAI API integration with rule-based fallback
- **Cloud SDKs**: Boto3 (AWS), Azure SDK for Python (`azure-mgmt-compute`, `azure-mgmt-monitor`), Google Cloud Monitoring & Logging SDKs
- **Frontend**: React, Vite, TailwindCSS / Modern CSS, Recharts, Lucide Icons
- **Testing**: Pytest, Pytest-asyncio, HTTPX

---

## 7. Dataset Sources

The classification model uses real, verified public datasets rather than synthetic or fabricated records:

1. **CIC-IDS2017 (Canadian Institute for Cybersecurity)**:
   - *URL*: [https://www.unb.ca/cic/datasets/ids-2017.html](https://www.unb.ca/cic/datasets/ids-2017.html)
   - *Description*: Realistic background network traffic mixed with modern attacks (DDoS, Brute Force, Web Attacks, Port Scan).
   - *Usage*: Network flow statistics, packet rates, byte counts, TCP flags, duration.

2. **ADFA-LD (UNSW Canberra / Australian Defence Force Academy)**:
   - *URL*: [https://research.unsw.edu.au/projects/adfa-ids-datasets](https://research.unsw.edu.au/projects/adfa-ids-datasets)
   - *Description*: Host-based Linux system-call traces recorded under normal usage and actual cyber exploits (Privilege Escalation, Adduser, Hydra, Meterpreter).
   - *Usage*: Host system-call frequency distributions, process activity anomalies.

---

## 8. Dataset Download Instructions

To download the verified public dataset subsets for training:

```powershell
# Run the automated dataset acquisition script:
.\venv\Scripts\python.exe scripts/download_datasets.py
```

If automated downloads are restricted by network policies or institutional firewalls:
1. Download the CIC-IDS2017 CSV files (`Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv`, `Tuesday-WorkingHours.pcap_ISCX.csv`) and place them under `backend/data/raw/cic-ids2017/`.
2. Download ADFA-LD archive (`ADFA-LD.zip`) and place the extracted traces under `backend/data/raw/adfa-ld/`.

---

## 9. Dataset Preparation

The preparation pipeline handles real-world dataset inconsistencies:
- Strips whitespace and normalizes column headers across different CSV releases.
- Replaces infinite values (`inf`, `-inf`) and imputes/drops missing values.
- Removes duplicate flow records to prevent train-test data leakage.
- Normalizes system-call traces from ADFA-LD into normalized system-call n-gram/frequency vectors.
- Maps source attack labels to target 5-class schema:
  - `0: NORMAL`
  - `1: DDOS`
  - `2: BRUTE_FORCE`
  - `3: SQL_INJECTION`
  - `4: PRIVILEGE_ESCALATION`

```powershell
.\venv\Scripts\python.exe backend/ml/prepare_dataset.py
```

---

## 10. Model Training

The Random Forest Classifier is trained using stratified train/test splits (80/20) with a fixed reproducible random seed:

```powershell
.\venv\Scripts\python.exe backend/ml/train_model.py
```

Artifacts generated in `backend/ml/artifacts/`:
- `random_forest_model.joblib`: Serialized model pipeline.
- `feature_schema.json`: Expected feature names and data types.
- `label_encoder.joblib`: Class index to label mapping.
- `model_metadata.json`: Training date, metrics, hyperparameter configuration.

---

## 11. Model Evaluation

Model evaluation generates comprehensive classification reports:
- Stratified 5-class Precision, Recall, F1-Score, and Support.
- High-resolution Confusion Matrix visualization (`backend/reports/confusion_matrix.png`).
- Feature importance ranking plot (`backend/reports/feature_importance.png`).

```powershell
.\venv\Scripts\python.exe backend/ml/evaluate_model.py
```

---

## 12. Installation Instructions (Windows PowerShell)

### Prerequisites
- Windows 10/11
- Python 3.12 (64-bit)
- Node.js (v18+) and npm
- Git

### Step-by-Step Setup
```powershell
# 1. Clone or navigate to the repository
cd "c:\Users\mudigonda akitha\Downloads\newmajor"

# 2. Create the Python 3.12 virtual environment
py -3.12 -m venv venv

# 3. Activate the virtual environment
.\venv\Scripts\Activate.ps1

# 4. Upgrade pip and install dependencies
.\venv\Scripts\python.exe -m pip install --upgrade pip
.\venv\Scripts\pip install -r backend/requirements.txt

# 5. Verify system setup
.\venv\Scripts\python.exe scripts/health_check.py
```

---

## 13. Environment Configuration

Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```
Configure your `.env` parameters:
- `REMEDIATION_MODE=SIMULATION` (Default: safe simulation)
- Cloud credentials (AWS, Azure, GCP) if live monitoring is desired. If omitted, the system operates seamlessly with simulated telemetry and demo modes.

---

## 14. Database Setup

Initialize the SQLite database with all required relational tables:
```powershell
.\venv\Scripts\python.exe scripts/initialize_database.py
```

---

## 15. Backend Startup

Start the FastAPI application with Uvicorn:
```powershell
.\venv\Scripts\uvicorn.exe backend.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive API documentation will be available at:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

---

## 16. Frontend Startup

```powershell
cd frontend
npm install
npm run dev
```
Access the Cloud Operations Dashboard at: `http://localhost:5173`

---

## 17. Cloud Provider Configuration

- **AWS**: Configure IAM user with least-privilege read permissions (`cloudwatch:GetMetricData`, `ec2:DescribeInstances`, `cloudtrail:LookupEvents`).
- **Azure**: Configure Service Principal credentials (`AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`) with Reader role on the target Resource Group.
- **GCP**: Configure Service Account key JSON (`GOOGLE_APPLICATION_CREDENTIALS`) with Monitoring Viewer role.

*Note: When credentials are not provided, the cloud adapter explicitly marks the provider as `NOT CONFIGURED` rather than fabricating live data.*

---

## 18. Demo Mode Instructions

The platform provides a standalone Demo Mode for testing and presentations without cloud accounts:
1. Navigate to the **Incident Management** or **Overview** page on the frontend dashboard.
2. Click **"Run Full Demo Scenario"**.
3. Observe the sequential multi-agent execution pipeline in real-time.
4. Review generated audit trails and verification outcomes.

---

## 19. Remediation Modes

1. **SIMULATION (Default)**:
   - Proposes remediation actions, records execution logic and parameters, but never alters cloud infrastructure. Returns `SIMULATED_SUCCESS`.
2. **APPROVAL_REQUIRED**:
   - Holds the proposed remediation in queue. Displays impact assessment to human operators. Requires explicit approval or rejection before execution.
3. **AUTHORIZED_EXECUTION**:
   - Executes strictly allowlisted, idempotent operations against verified cloud resources with timeout and rollback policies.

---

## 20. Testing Instructions

Execute the comprehensive automated test suite with mocked cloud APIs:
```powershell
.\venv\Scripts\pytest backend/tests -v
```

---

## 21. Troubleshooting

| Issue | Likely Cause | Solution |
|---|---|---|
| `ModuleNotFoundError` | Virtualenv not active or dependencies not installed | Run `.\venv\Scripts\pip install -r backend/requirements.txt` |
| Cloud shows `NOT CONFIGURED` | Missing `.env` credentials | Expected when credentials are unset; system operates safely in demo/simulated mode |
| CORS errors in browser | Port mismatch | Ensure frontend runs on `http://localhost:5173` and matches `CORS_ORIGINS` in `.env` |
| Python wheel compilation errors | Python 3.14 used instead of Python 3.12 | Use `py -3.12 -m venv venv` |

---

## 22. Security Limitations

- The system explicitly disallows arbitrary shell command execution.
- LLM outputs are never piped directly into execution shells or raw cloud APIs.
- Automatic resource termination is permanently disabled.
- Simulation mode is hard-coded as the default fail-safe state.

---

## 23. Future Enhancements

- Kubernetes / OpenShift cluster operator integration.
- Distributed streaming telemetry via Apache Kafka / AWS Kinesis.
- Multi-region disaster recovery orchestration.
- Fine-tuned local domain LLM for air-gapped deployments.
