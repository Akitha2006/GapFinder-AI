# Technical Architecture & Project Documentation

## Self-Healing Cloud Infrastructure Using Multi-Agent AI for Autonomous Remediation

---

## 1. Executive Summary

This document specifies the technical architecture, data flow, agent interaction protocols, cloud adapter abstraction, machine learning pipelines, and safety governance model for the **Self-Healing Cloud Infrastructure** platform.

The system is designed to provide autonomous detection, root-cause investigation, and controlled remediation across multi-cloud environments (AWS, Azure, Google Cloud Platform) with rigorous verification and human-in-the-loop governance.

---

## 2. Multi-Agent System Architecture

The core of the system is built upon a decentralized, specialized **Multi-Agent Architecture**:

```mermaid
sequenceDiagram
    autonumber
    participant Cloud as Multi-Cloud Adapters (AWS/Azure/GCP)
    participant Mon as Monitoring Agent
    participant Det as Detection Agent
    participant ML as ML Classifier (Random Forest)
    participant Coord as Coordinator Agent
    participant RCA as Root Cause Agent
    participant RAG as RAG Agent / Knowledge Base
    participant Rem as Remediation Agent
    participant Ver as Verification Agent
    participant DB as SQLite / Audit Log

    Cloud->>Mon: Raw Telemetry (Metrics, Status, Logs)
    Mon->>DB: Store Metric Records
    Mon->>Det: Forward Normalized Telemetry Event
    Det->>ML: Evaluate Compatible Features
    ML-->>Det: Predicted Attack Class & Confidence
    Det->>Det: Check Resource Anomaly Thresholds
    alt Anomaly or Attack Detected
        Det->>DB: Create Incident Record
        Det->>Coord: Dispatch Incident Alert
        Coord->>RCA: Request Root Cause Investigation
        Coord->>RAG: Request Relevant Playbooks & Historical Runbooks
        RAG-->>Coord: Retrieved Context & Mitigation Steps
        RCA-->>Coord: Root Cause Hypothesis & Confidence
        Coord->>Rem: Formulate Remediation Plan
        Rem->>Rem: Validate Safety Rules & Remediation Mode
        alt Mode == SIMULATION
            Rem->>DB: Record Simulated Remediation
            Rem->>Ver: Request Verification (Simulated)
        else Mode == APPROVAL_REQUIRED
            Rem->>DB: Create Approval Request (Pending Operator)
        else Mode == AUTHORIZED_EXECUTION
            Rem->>Cloud: Execute Allowlisted Cloud API Action
            Rem->>Ver: Request Fresh Telemetry Verification
        end
        Ver->>Cloud: Poll Post-Remediation Health Metrics
        Ver-->>Coord: Health Status (RECOVERED / NOT_RECOVERED)
        Coord->>DB: Final Incident & Verification Status
    end
```

### Agent Roles & Specifications

| Agent | Primary Responsibility | Input Schema | Output Schema | Fallback Strategy |
|---|---|---|---|---|
| **Monitoring Agent** | Collects metrics & health across clouds at configured intervals | Cloud Provider ID, Resource IDs | `NormalizedTelemetryEvent` | Marks provider `UNAVAILABLE` or `NOT CONFIGURED`; does not fabricate values |
| **Detection Agent** | Identifies anomalies via ML classifier and configurable thresholds | `NormalizedTelemetryEvent` | `DetectionResult` (Class, Confidence, Severity) | If features incompatible with ML model, returns `UNKNOWN` or applies deterministic threshold logic |
| **Coordinator Agent** | Orchestrates incident lifecycle and dispatches tasks to agents | `IncidentAlert` | `IncidentResolutionWorkflow` | Enforces max retries (3); halts on repeated failures |
| **Root Cause Agent** | Analyzes telemetry, logs, and historical context | Evidence Bundle (telemetry + detection) | `RootCauseAnalysis` | Deterministic rule-based causal analysis if LLM API is unset |
| **RAG Agent** | Searches troubleshooting runbooks & past incident resolutions | Query / Incident Symptom | `RetrievedPlaybook[]` | TF-IDF / keyword similarity fallback if embeddings unavailable |
| **Remediation Agent** | Formulates recovery plan and enforces execution guardrails | Incident + RCA + Playbook | `RemediationActionPlan` | Default to `SIMULATION`; strictly reject non-allowlisted actions |
| **Verification Agent** | Polls fresh telemetry post-remediation to confirm recovery | Incident ID, Action ID, Target Resource | `VerificationOutcome` | Marks `VERIFICATION_FAILED` if metrics do not normalize after grace period |

---

## 3. Machine Learning Pipeline & Dataset Mapping

### Public Datasets Employed

1. **CIC-IDS2017**:
   - Source: Canadian Institute for Cybersecurity, University of New Brunswick.
   - Attack categories extracted: DDoS, Brute Force (SSH/FTP), Web Attacks (SQLi where verified labels exist), Normal flows.
   - Raw format: 80+ network flow features (Flow Duration, Total Fwd Packets, Packet Length Mean, Flow Bytes/s, Flag counts).

2. **ADFA-LD**:
   - Source: University of New South Wales, Canberra.
   - Attack categories extracted: Adduser (Privilege Escalation), Normal host system-call traces.
   - Feature engineering: System-call frequency histograms and n-gram transitional frequencies.

### Target Classification Schema (5 Classes)
- **Class 0: `NORMAL`**
- **Class 1: `DDOS`**
- **Class 2: `BRUTE_FORCE`**
- **Class 3: `SQL_INJECTION`**
- **Class 4: `PRIVILEGE_ESCALATION`**

### Preprocessing & Defense Against Data Leakage
- Column names sanitized: stripped whitespace, lowercased, special characters replaced with underscores.
- Duplicate flow records removed to prevent identical flows appearing in both train and test partitions.
- Infinite values (`np.inf`, `-np.inf`) converted to NaN and imputed using median statistics from training splits.
- Stratified 80/20 train/test split preserving class distribution.
- Preprocessing scaler (`StandardScaler` or `RobustScaler`) fitted **only** on the training split.

---

## 4. Multi-Cloud Adapter Architecture

All cloud provider integrations inherit from a unified abstract base class:

```mermaid
classDiagram
    class BaseCloudAdapter {
        <<abstract>>
        +connect() bool
        +is_configured() bool
        +get_resource_status(resource_id) ResourceStatus
        +get_metrics(resource_id, metric_names, timespan) Dict
        +get_logs(resource_id, query, limit) List
        +validate_action(action_type, target_resource) ValidationResult
        +execute_action(action_type, target_resource, params) ActionResult
        +verify_resource_health(target_resource) HealthVerification
    }

    class AWSAdapter {
        -boto3_session
        -cloudwatch_client
        -ec2_client
        +connect() bool
        +get_metrics()
        +execute_action()
    }

    class AzureAdapter {
        -credential
        -compute_client
        -monitor_client
        +connect() bool
        +get_metrics()
        +execute_action()
    }

    class GCPAdapter {
        -monitoring_client
        -logging_client
        +connect() bool
        +get_metrics()
        +execute_action()
    }

    BaseCloudAdapter <|-- AWSAdapter
    BaseCloudAdapter <|-- AzureAdapter
    BaseCloudAdapter <|-- GCPAdapter
```

### Supported Remediation Operations Allowlist

| Action Identifier | AWS API Equivalent | Azure API Equivalent | GCP API Equivalent | Risk Level |
|---|---|---|---|---|
| `RESTART_SERVICE` | SSM RunCommand (`systemctl restart`) | Azure RunCommand | Compute OS Config | Low |
| `SCALE_UP` | AutoScaling UpdateDesiredCapacity | VM ScaleSet ManualScale | Managed Instance Group Resize | Medium |
| `RATE_LIMIT_IP` | AWS WAF IPSet Update | Azure Front Door / WAF Rule | Cloud Armor Security Policy | Medium |
| `QUARANTINE_INSTANCE` | Security Group Isolation | NSG Lockdown Rule | VPC Firewall Deny Rule | High (Requires Approval) |

*Destructive operations such as instance termination (`TerminateInstances`, `DeleteVirtualMachine`) are strictly disabled and rejected by policy.*

---

## 5. Governance & Remediation Modes

```mermaid
stateDiagram-v2
    [*] --> IncidentDetected
    IncidentDetected --> RemediationProposed
    
    state RemediationProposed {
        [*] --> CheckMode
        CheckMode --> SimulationMode : Mode == SIMULATION
        CheckMode --> ApprovalMode : Mode == APPROVAL_REQUIRED
        CheckMode --> AuthorizedMode : Mode == AUTHORIZED_EXECUTION
        
        SimulationMode --> RecordSimulatedSuccess : Log params & expected effect
        
        ApprovalMode --> PendingHumanReview : Dispatch to Dashboard
        PendingHumanReview --> Approved : Human clicks Approve
        PendingHumanReview --> Rejected : Human clicks Reject
        
        Approved --> AuthorizedMode
        Rejected --> EscalatedToManual : Log Operator Rationale
        
        AuthorizedMode --> ValidateSafetyGuardrails
        ValidateSafetyGuardrails --> ExecuteAllowlistedAPI : Checks Pass
        ValidateSafetyGuardrails --> ExecutionBlocked : Policy Violation
    }

    RecordSimulatedSuccess --> Verification
    ExecuteAllowlistedAPI --> Verification
    Verification --> Resolved : RECOVERED
    Verification --> RetryOrEscalate : NOT_RECOVERED
```

---

## 6. Database Relational Schema

The underlying database uses SQLite (via SQLAlchemy) for portability and zero-configuration execution:

```mermaid
erDiagram
    INCIDENTS ||--o{ REMEDIATION_ACTIONS : triggers
    REMEDIATION_ACTIONS ||--o{ VERIFICATION_RESULTS : evaluated_by
    INCIDENTS ||--o{ VERIFICATION_RESULTS : verified_for
    REMEDIATION_ACTIONS ||--o{ AUDIT_LOGS : audited_in

    INCIDENTS {
        string id PK
        datetime created_at
        string cloud_provider
        string resource_id
        string incident_type
        string severity
        string detection_method
        float confidence
        json evidence_summary
        json root_cause_analysis
        string status
    }

    REMEDIATION_ACTIONS {
        string id PK
        string incident_id FK
        string action_type
        string execution_mode
        string approval_status
        string execution_result
        json parameters
        datetime timestamp
        string error_details
    }

    VERIFICATION_RESULTS {
        string id PK
        string incident_id FK
        string action_id FK
        string previous_status
        string current_status
        string outcome
        datetime timestamp
        json fresh_metrics
    }

    AUDIT_LOGS {
        string id PK
        string action_id FK
        string actor
        string event_type
        string target_resource
        string details
        datetime timestamp
    }
```
