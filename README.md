# ThreatGraph – Explainable Cyber Threat Detection & Multi-Tenant Behavior Platform

> **Enterprise Cybersecurity Monitoring System** | Centralized multi-tenant platform analyzing employee authentication telemetry across organizations with deterministic rule-based threat detection, explainable risk scoring, and ThreatGraph relationship visualization.

---

## ⚡ Key Capabilities

1. **Multi-Tenant Organization Management**:
   - Centralized Super Admin oversees client organizations (ABC Technologies, XYZ Solutions, Global IT Services, Future Tech Pvt Ltd).
   - Strict tenant-level data isolation: Organization Managers manage credentials and monitor logins **only** for their assigned organization.
2. **Automatic Login Telemetry Collection**:
   - Backend automatically captures every employee login attempt (IP address, timestamp, device/browser, approximate location, failed attempt counter, success/failure).
   - Ingested events are automatically evaluated through the deterministic threat detection engine.
3. **Deterministic Explainable Threat Engine**:
   - Evaluates 5 core rules against per-employee historical profile baselines:
     - `MULTIPLE_FAILED_ATTEMPTS` (+30 pts)
     - `UNUSUAL_LOGIN_TIME` (+15 pts)
     - `UNKNOWN_IP` (+20 pts)
     - `UNUSUAL_LOCATION` (+20 pts)
     - `SHARED_SUSPICIOUS_IP` (+15 pts)
   - 0–100 risk score strictly capped at 100 with plain-English reasons and non-blocking recommended actions for administrator review.
4. **Interactive ThreatGraph Relationship Canvas**:
   - Visual node-link correlation connecting `Organizations → Employees → Login Events → Origin IPs → Threat Alerts`.
5. **What-If Attack Simulator**:
   - Super Admin can simulate hypothetical login parameters to audit score shifts with zero real traffic.

---

## 🔑 Seeded Demo Accounts (3 Roles)

| Role | Username | Password | Organization | Permissions & Scope |
| :--- | :--- | :--- | :--- | :--- |
| **SUPER_ADMIN** | `superadmin` | `Admin@123` | *Centralized* | All organizations, ThreatGraph, alerts investigation, simulator, rules & audit logs |
| **ORGANIZATION_MANAGER** | `manager_abc` | `Manager@123` | **ABC Technologies** | Manage ABC employees, issue temporary credentials, view ABC login history (Isolated) |
| **ORGANIZATION_MANAGER** | `manager_xyz` | `Manager@123` | **XYZ Solutions** | Manage XYZ employees, issue temporary credentials, view XYZ login history (Isolated) |
| **EMPLOYEE** | `emp_rahul` | `Employee@123` | **ABC Technologies** | Personal profile, personal login history, report unfamiliar login |
| **EMPLOYEE** | `emp_priya` | `Employee@123` | **XYZ Solutions** | Personal profile, personal login history, report unfamiliar login |

---

## 🚀 Running on Your Laptop

### Quick Run:
```powershell
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Start the dev server
npm run dev
```

Open **`http://localhost:3000`** in your browser. Use the **1-Click Demo Buttons** to switch between Super Admin, Organization Manager, and Employee!

---

## ☕ Spring Boot 3 Engine (Port 8080)

```bash
cd backend
mvn spring-boot:run
```
- Database console: `http://localhost:8080/h2-console` (`jdbc:h2:mem:threatgraphdb`, user `sa`, pass `password`)
- Health check: `http://localhost:8080/actuator/health`

---

## ⚠️ Compliance Disclaimer
*ThreatGraph is an explainable early-warning and monitoring system. Rule-based detections and risk scores are deterministic aids for administrator review, not a guarantee of attack prevention. No machine learning or black-box logic is utilized.*
