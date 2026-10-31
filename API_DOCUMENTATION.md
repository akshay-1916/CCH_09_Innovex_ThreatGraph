# ThreatGraph REST API Specification

All protected endpoints require an `Authorization: Bearer <JWT_TOKEN>` header.

---

## 1. Authentication
- `POST /api/auth/login`
  - Body: `{ username, password }`
  - Returns: `{ token, tokenType, id, username, name, email, role, organizationId, organizationName }`
  - *Side Effect:* Automatically captures client telemetry and evaluates threat rules for employees.
- `POST /api/auth/logout`
  - Header: Bearer token
  - Records user logout in immutable audit log.
- `GET /api/auth/me`
  - Returns current authenticated session details and profile baselines.

---

## 2. Multi-Organization Management (SUPER_ADMIN Only)
- `GET /api/organizations`
  - Returns array of all registered organizations with employee count.
- `POST /api/organizations`
  - Body: `{ name, code, email, address, contactNumber }`
  - Registers a new tenant organization.
- `PATCH /api/organizations/:id/status`
  - Body: `{ status: 'ACTIVE' | 'INACTIVE' }`
  - Toggles tenant access state.

---

## 3. Organization Managers (SUPER_ADMIN Only)
- `GET /api/managers`
  - Returns list of all Organization Managers.
- `POST /api/managers`
  - Body: `{ username, name, email, password, organizationId }`
  - Assigns an Organization Manager to a specific tenant.

---

## 4. Employees Management (SUPER_ADMIN & ORGANIZATION_MANAGER)
- `GET /api/employees`
  - Returns employee roster.
  - *Tenant Isolated:* Organization Managers only receive employees belonging to their organization.
- `POST /api/employees`
  - Body: `{ username, name, email, department, designation, organizationId }`
  - Provisions a new employee account and automatically generates temporary credentials.
- `PATCH /api/employees/:id/status`
  - Body: `{ active: boolean }`
  - Activates or suspends an employee account.
- `POST /api/employees/:id/reset-password`
  - Resets employee password and returns a new temporary password.

---

## 5. Login Telemetry & History
- `GET /api/events`
  - Query: `search`, `organizationId`, `suspicious`, `loginSuccess`, `riskLevel`
  - *Tenant Isolated:* Organization Managers can only query events for their organization.
- `GET /api/events/my-history`
  - Returns personal session history for the logged-in employee.
- `POST /api/employee/change-password`
  - Body: `{ currentPassword, newPassword }`
- `POST /api/employee/report-unfamiliar`
  - Body: `{ eventId, comments }`
  - Logs an incident alert to the Super Admin audit queue.

---

## 6. Dashboards
- `GET /api/dashboard/admin` (SUPER_ADMIN)
  - Returns centralized KPIs, risk distribution, organization breakdowns, and top correlated IPs.
- `GET /api/dashboard/organization` (ORGANIZATION_MANAGER)
  - Returns tenant KPIs (active/inactive counts, login successes/failures, recent org events).
- `GET /api/dashboard/employee` (EMPLOYEE)
  - Returns personal security summary, last login timestamp, baseline working hours.

---

## 7. Threat Alerts Investigation (SUPER_ADMIN Only)
- `GET /api/alerts`
  - Returns all generated security alerts (Score ≥ 30) across tenants.
- `GET /api/alerts/:id`
  - Returns alert details, explainable reasons, recommendations, and status transition history.
- `PATCH /api/alerts/:id/status`
  - Body: `{ status: 'NEW' | 'UNDER_REVIEW' | 'RESOLVED' | 'FALSE_POSITIVE', note }`
  - Updates investigation status and logs audit entry.

---

## 8. ThreatGraph Relationship Canvas (SUPER_ADMIN Only)
- `GET /api/threat-graph`
  - Dynamically computes graph nodes and edges:
    - Nodes: Organizations, Employees, Login Events, Correlated IPs, Alerts.
    - Edges: `Org → Employee`, `Employee → Event`, `Event → IP`, `Event → Alert`.

---

## 9. What-If Attack Simulator (SUPER_ADMIN Only)
- `POST /api/simulator/analyze`
  - Body: `{ userId, failedAttempts, ipAddress, isUnknownIp, loginHour, location, isUnusualLocation, isSharedIp }`
  - Returns calculated score, category, triggered rule breakdown, and recommendations without generating real traffic.

---

## 10. Audit Logs & Reports
- `GET /api/audit-logs` (SUPER_ADMIN)
  - Returns system-wide immutable activity logs.
- `GET /api/reports/login` (SUPER_ADMIN & ORGANIZATION_MANAGER)
  - Streams downloadable CSV of login telemetry records.
