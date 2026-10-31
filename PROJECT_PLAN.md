# ThreatGraph: Project Architecture & Execution Blueprint

## 1. Executive Summary & Problem Statement
Modern Security Operations Centers (SOCs) face alert fatigue driven by opaque machine-learning and "black-box" detection systems that fail to explain **why** an authentication event or network telemetry is flagged as suspicious. Analysts waste hours investigating uncontextualized alerts, while decentralized organizations lack tenant-level data isolation.

**ThreatGraph** is a centralized, explainable cyber threat detection and login behavior monitoring platform built with:
- **Zero-AI Deterministic Explainability:** 100% mathematically auditable 0–100 risk scoring with plain-English reasons and exact point contributions.
- **Multi-Tenant Data Isolation:** Strict tenant separation across organizations (e.g. ABC Technologies, XYZ Solutions), ensuring Organization Managers can only administer their own employees.
- **Automatic Telemetry Ingestion:** Server-side capture of employee authentication events (IP, timestamp, location, device, failed attempts) with real-time detection rule evaluation.
- **ThreatGraph Relationship Canvas:** Visual node-link correlation linking Organizations, Employees, Login Telemetry, Correlated Origin IPs, and Security Alerts.
- **What-If Attack Simulator:** Safe hypothetical testing environment for Super Admins.

---

## 2. Target Audience & Stakeholders
1. **Chief Information Security Officers (CISOs) & Security Directors:** Require centralized visibility across multiple business units without cross-tenant data leakage.
2. **Organization Operations Managers:** Need autonomous employee account provisioning, credential generation, and localized login auditing.
3. **Enterprise Employees:** Require self-service security visibility into their login history and the ability to report unfamiliar sessions.

---

## 3. User Roles & Permission Matrix (Exactly 3 Roles)

| Module / Action | Super Admin | Organization Manager | Employee |
| :--- | :---: | :---: | :---: |
| **Public Website & Documentation** | ✓ | ✓ | ✓ |
| **Centralized Multi-Org SOC Dashboard** | ✓ | ✗ *(403 Forbidden)* | ✗ *(403 Forbidden)* |
| **Manage Client Organizations** | ✓ | ✗ *(403 Forbidden)* | ✗ *(403 Forbidden)* |
| **Threat Alerts Investigation & Status** | ✓ | ✗ *(403 Forbidden)* | ✗ *(403 Forbidden)* |
| **ThreatGraph Interactive Canvas** | ✓ | ✗ *(403 Forbidden)* | ✗ *(403 Forbidden)* |
| **What-If Attack Simulator** | ✓ | ✗ *(403 Forbidden)* | ✗ *(403 Forbidden)* |
| **Detection Rule Weights & Thresholds** | ✓ | ✗ *(403 Forbidden)* | ✗ *(403 Forbidden)* |
| **System-wide Audit Logs** | ✓ | ✗ *(403 Forbidden)* | ✗ *(403 Forbidden)* |
| **Manage Tenant Employees & Credentials** | ✓ | ✓ *(Own Org Only)* | ✗ *(403 Forbidden)* |
| **Reset Employee Password** | ✓ | ✓ *(Own Org Only)* | ✗ *(403 Forbidden)* |
| **Organization Login Telemetry & CSV** | ✓ | ✓ *(Own Org Only)* | ✗ *(403 Forbidden)* |
| **Personal Profile & Login History** | ✓ | ✓ | ✓ *(Self Only)* |
| **Report Unfamiliar Login Attempt** | ✗ | ✗ | ✓ |
| **Change Personal Password** | ✓ | ✓ | ✓ |

---

## 4. Deterministic Threat Detection & Risk Scoring Engine

| Rule Key | Default Points | Default Threshold | Rule Logic & Baseline Profile Comparison |
| :--- | :---: | :---: | :--- |
| `MULTIPLE_FAILED_ATTEMPTS` | **+30** | `≥ 5` attempts | Detects consecutive failed login attempts indicating brute force or credential stuffing. |
| `UNUSUAL_LOGIN_TIME` | **+15** | Outside normal | Compares login hour with employee profile `normalStartHour` & `normalEndHour` (default 09:00–18:00). |
| `UNKNOWN_IP` | **+20** | Not in whitelist | Checks if origin IP is present in employee profile `knownIps`. Cannot trigger without profile history. |
| `UNUSUAL_LOCATION` | **+20** | Not in usual | Checks if login city/country matches `usualLocations` (e.g. Pune jump to Frankfurt or Moscow). |
| `SHARED_SUSPICIOUS_IP` | **+15** | `≥ 3` accounts | Correlates source IP across 3+ distinct user accounts with failed or suspicious events. |

- **Sum Capping:** Sum of triggered points is strictly capped at `Math.min(rawScore, 100)`.
- **Alert Creation:** Any event scoring **≥ 30 points** automatically generates a `ThreatAlert`.
- **Classification:** Low [0–29], Medium [30–59], High [60–79], Critical [80–100].

---

## 5. Database Entity Relationships (PostgreSQL)

```
[organizations] 1 ──── ∞ [users (employees & managers)]
       │                          │
       │                          │ 1
       │                          │
       │                          ▼ ∞
       └────────────── ∞ [login_events] 1 ──── ∞ [detection_results]
                              │
                              │ 1
                              ▼ 0..1
                        [threat_alerts] 1 ──── ∞ [alert_history]
```

---

## 6. Verification & Test Execution Status

- **Unit Test Suite (7/7 Cases Passed):**
  1. Normal login baseline (Score 0, LOW, no alert).
  2. Single anomaly below threshold (Score 15, LOW, no alert).
  3. Alert threshold boundary trigger (Score 30, MEDIUM, alert created).
  4. High risk boundary (Score 65, HIGH).
  5. Critical risk boundary (Score 85, CRITICAL).
  6. Maximum score cap at 100 enforced.
  7. Shared suspicious IP correlation across accounts (+15 pts).
- **Tenant Isolation Validated:** Organization Manager access to foreign organizations and administrative threat endpoints blocked with HTTP 403.
- **Automatic Event Ingestion Validated:** Employee login automatically writes telemetry and computes risk score in background.
