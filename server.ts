import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- TYPES (Exact 3 Roles: SUPER_ADMIN, ORGANIZATION_MANAGER, EMPLOYEE) ---
export type Role = 'SUPER_ADMIN' | 'ORGANIZATION_MANAGER' | 'EMPLOYEE';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'NEW' | 'UNDER_REVIEW' | 'RESOLVED' | 'FALSE_POSITIVE';
export type AccountStatus = 'ACTIVE' | 'INACTIVE';

export interface Organization {
  id: string;
  name: string;
  code: string;
  email: string;
  address: string;
  contactNumber: string;
  managerId?: string;
  managerName?: string;
  managerEmail?: string;
  status: AccountStatus;
  createdAt: string;
  employeeCount: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  organizationId?: string;
  organizationName?: string;
  department?: string;
  designation?: string;
  active: boolean;
  createdAt: string;
}

export interface UserProfile {
  userId: string;
  normalStartHour: number;
  normalEndHour: number;
  knownIps: string[];
  usualLocations: string[];
  knownDevices: string[];
}

export interface DetectionRule {
  id: string;
  ruleKey: string;
  name: string;
  description: string;
  points: number;
  threshold: number;
  enabled: boolean;
}

export interface LoginEvent {
  id: string;
  userId: string;
  employeeName: string;
  organizationId: string;
  organizationName: string;
  ipAddress: string;
  timestamp: string;
  loginSuccess: boolean;
  failedAttempts: number;
  location: string;
  deviceId: string;
  userAgent: string;
  riskScore: number;
  riskLevel: RiskLevel;
  suspicious: boolean;
  detectionReasons?: string[];
}

export interface ThreatAlert {
  id: string;
  alertCode: string;
  eventId: string;
  userId: string;
  employeeName: string;
  organizationId: string;
  organizationName: string;
  ipAddress: string;
  timestamp: string;
  riskScore: number;
  riskLevel: RiskLevel;
  reasons: string[];
  recommendations: string[];
  status: AlertStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AlertHistory {
  id: string;
  alertId: string;
  oldStatus: AlertStatus;
  newStatus: AlertStatus;
  note: string;
  changedBy: string;
  changedAt: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  targetRecord?: string;
  details: string;
  createdAt: string;
}

// In-Memory Database Stores (PostgreSQL Mirror)
const db = {
  organizations: new Map<string, Organization>(),
  users: new Map<string, User>(),
  profiles: new Map<string, UserProfile>(),
  rules: new Map<string, DetectionRule>(),
  events: new Map<string, LoginEvent>(),
  alerts: new Map<string, ThreatAlert>(),
  alertHistory: [] as AlertHistory[],
  auditLogs: [] as AuditLog[],
  failedAttemptCounter: new Map<string, number>(), // tracks consecutive failures per username
};

// --- JWT AUTHENTICATION UTILITIES ---
function createToken(payload: { sub: string; role: Role; username: string; organizationId?: string }) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 86400; // 24 hours
  const claims = Buffer.from(JSON.stringify({ ...payload, exp, iat: Math.floor(Date.now() / 1000) })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${claims}`).digest('base64url');
  return `${header}.${claims}.${signature}`;
}

function verifyToken(token: string): { sub: string; role: Role; username: string; organizationId?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, claims, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${claims}`).digest('base64url');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(claims, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }
  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
  (req as any).user = payload;
  next();
}

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: `Forbidden: Access requires role [${allowedRoles.join(', ')}]. Current role: ${user?.role || 'NONE'}`,
      });
    }
    next();
  };
}

// --- DETERMINISTIC THREAT DETECTION & RISK SCORING ENGINE ---
export interface DetectionResult {
  ruleKey: string;
  ruleName: string;
  points: number;
  reason: string;
  recommendation: string;
}

export function evaluateTelemetryEvent(event: {
  userId: string;
  ipAddress: string;
  timestamp: string;
  loginSuccess: boolean;
  failedAttempts: number;
  location: string;
  deviceId?: string;
}): DetectionResult[] {
  const triggered: DetectionResult[] = [];
  const profile = db.profiles.get(event.userId);

  // Rule 1: MULTIPLE_FAILED_ATTEMPTS (Default: 30 pts, threshold 5)
  const failedRule = db.rules.get('MULTIPLE_FAILED_ATTEMPTS');
  const failedThresh = failedRule?.threshold ?? 5;
  const failedPts = failedRule?.points ?? 30;
  if (failedRule?.enabled && event.failedAttempts >= failedThresh) {
    triggered.push({
      ruleKey: 'MULTIPLE_FAILED_ATTEMPTS',
      ruleName: 'Multiple Failed Login Attempts',
      points: failedPts,
      reason: `Observed ${event.failedAttempts} consecutive failed login attempts (exceeds threshold of ${failedThresh})`,
      recommendation: 'Review authentication logs for potential credential brute-forcing; notify account owner.',
    });
  }

  // Profile-based rules
  if (profile) {
    const eventDate = new Date(event.timestamp);
    const eventHour = isNaN(eventDate.getHours()) ? 12 : eventDate.getHours();

    // Rule 2: UNUSUAL_LOGIN_TIME (Default: 15 pts)
    const timeRule = db.rules.get('UNUSUAL_LOGIN_TIME');
    const timePts = timeRule?.points ?? 15;
    if (timeRule?.enabled) {
      if (eventHour < profile.normalStartHour || eventHour >= profile.normalEndHour) {
        triggered.push({
          ruleKey: 'UNUSUAL_LOGIN_TIME',
          ruleName: 'Unusual Login Hours',
          points: timePts,
          reason: `Login at ${eventHour.toString().padStart(2, '0')}:00 is outside employee's normal working hours (${profile.normalStartHour.toString().padStart(2, '0')}:00 - ${profile.normalEndHour.toString().padStart(2, '0')}:00)`,
          recommendation: 'Verify with employee whether after-hours access or scheduled task was intended.',
        });
      }
    }

    // Rule 3: UNKNOWN_IP (Default: 20 pts)
    const ipRule = db.rules.get('UNKNOWN_IP');
    const ipPts = ipRule?.points ?? 20;
    if (ipRule?.enabled && profile.knownIps && profile.knownIps.length > 0) {
      const isKnown = profile.knownIps.some((k) => k.trim() === event.ipAddress.trim());
      if (!isKnown) {
        triggered.push({
          ruleKey: 'UNKNOWN_IP',
          ruleName: 'Unrecognized IP Address',
          points: ipPts,
          reason: `Origin IP '${event.ipAddress}' is not in employee's historical safe whitelist (${profile.knownIps.join(', ')})`,
          recommendation: 'Check origin ISP/ASN reputation and prompt employee for out-of-band verification.',
        });
      }
    }

    // Rule 4: UNUSUAL_LOCATION (Default: 20 pts)
    const locRule = db.rules.get('UNUSUAL_LOCATION');
    const locPts = locRule?.points ?? 20;
    if (locRule?.enabled && profile.usualLocations && profile.usualLocations.length > 0 && event.location) {
      const isUsual = profile.usualLocations.some(
        (loc) => loc.toLowerCase().trim() === event.location.toLowerCase().trim()
      );
      if (!isUsual) {
        triggered.push({
          ruleKey: 'UNUSUAL_LOCATION',
          ruleName: 'Anomalous Geographic Location',
          points: locPts,
          reason: `Login location '${event.location}' differs from usual employee locations (${profile.usualLocations.join(', ')})`,
          recommendation: 'Check if employee is traveling or accessing through an unauthorized foreign VPN gateway.',
        });
      }
    }
  }

  // Rule 5: SHARED_SUSPICIOUS_IP (Default: 15 pts, threshold 3 accounts)
  const sharedRule = db.rules.get('SHARED_SUSPICIOUS_IP');
  const sharedThresh = sharedRule?.threshold ?? 3;
  const sharedPts = sharedRule?.points ?? 15;
  if (sharedRule?.enabled) {
    const distinctAccounts = new Set<string>();
    for (const evt of db.events.values()) {
      if (evt.ipAddress.trim() === event.ipAddress.trim() && (!evt.loginSuccess || evt.suspicious || evt.failedAttempts > 0)) {
        distinctAccounts.add(evt.userId);
      }
    }
    if (!event.loginSuccess || event.failedAttempts > 0) {
      distinctAccounts.add(event.userId);
    }
    if (distinctAccounts.size >= sharedThresh) {
      triggered.push({
        ruleKey: 'SHARED_SUSPICIOUS_IP',
        ruleName: 'Shared Suspicious IP Correlated Across Accounts',
        points: sharedPts,
        reason: `IP '${event.ipAddress}' correlates across ${distinctAccounts.size} accounts with failed/suspicious events (threshold: ${sharedThresh})`,
        recommendation: 'Correlate affected user accounts on ThreatGraph; correlation suggests automated distributed scan.',
      });
    }
  }

  return triggered;
}

export function calculateRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 30) return 'MEDIUM';
  return 'LOW';
}

export function scoreAndProcessEvent(event: LoginEvent) {
  const triggered = evaluateTelemetryEvent(event);

  let rawScore = 0;
  const counted = new Set<string>();
  const reasons: string[] = [];
  const recommendations: string[] = [];

  for (const r of triggered) {
    if (!counted.has(r.ruleKey)) {
      rawScore += r.points;
      counted.add(r.ruleKey);
    }
    reasons.push(`${r.ruleName} (+${r.points} pts): ${r.reason}`);
    if (!recommendations.includes(r.recommendation)) {
      recommendations.push(r.recommendation);
    }
  }

  // Cap at 100
  const finalScore = Math.min(rawScore, 100);
  const riskLevel = calculateRiskLevel(finalScore);
  const suspicious = finalScore >= 30;

  event.riskScore = finalScore;
  event.riskLevel = riskLevel;
  event.suspicious = suspicious;
  event.detectionReasons = reasons;

  let alert: ThreatAlert | undefined;
  if (suspicious) {
    for (const a of db.alerts.values()) {
      if (a.eventId === event.id) {
        alert = a;
        break;
      }
    }
    if (alert) {
      alert.riskScore = finalScore;
      alert.riskLevel = riskLevel;
      alert.reasons = reasons;
      alert.recommendations = recommendations;
      alert.updatedAt = new Date().toISOString();
    } else {
      const alertCode = `TG-${1000 + db.alerts.size + 1}`;
      alert = {
        id: `ALT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        alertCode,
        eventId: event.id,
        userId: event.userId,
        employeeName: event.employeeName,
        organizationId: event.organizationId,
        organizationName: event.organizationName,
        ipAddress: event.ipAddress,
        timestamp: event.timestamp || new Date().toISOString(),
        riskScore: finalScore,
        riskLevel,
        reasons,
        recommendations,
        status: 'NEW',
        createdAt: event.timestamp || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.alerts.set(alert.id, alert);
    }
  }

  return { finalScore, riskLevel, suspicious, triggered, reasons, recommendations, alert };
}

// --- DATABASE SEEDER (Organizations, Managers, Employees, Telemetry) ---
function seedDatabase() {
  db.organizations.clear();
  db.users.clear();
  db.profiles.clear();
  db.rules.clear();
  db.events.clear();
  db.alerts.clear();
  db.alertHistory = [];
  db.auditLogs = [];

  // 1. Detection Rules
  const defaultRules: DetectionRule[] = [
    {
      id: 'RULE-1',
      ruleKey: 'MULTIPLE_FAILED_ATTEMPTS',
      name: 'Multiple Failed Login Attempts',
      description: 'Flags repeated failed authentication attempts exceeding the safety threshold (default: 5).',
      points: 30,
      threshold: 5,
      enabled: true,
    },
    {
      id: 'RULE-2',
      ruleKey: 'UNUSUAL_LOGIN_TIME',
      name: 'Unusual Login Hours',
      description: "Detects logins outside the employee's normal business hours profile (default: 09:00 - 18:00).",
      points: 15,
      threshold: 0,
      enabled: true,
    },
    {
      id: 'RULE-3',
      ruleKey: 'UNKNOWN_IP',
      name: 'Unrecognized IP Address',
      description: "Identifies access attempts from IP addresses not present in the employee's historical whitelist.",
      points: 20,
      threshold: 0,
      enabled: true,
    },
    {
      id: 'RULE-4',
      ruleKey: 'UNUSUAL_LOCATION',
      name: 'Anomalous Geographic Location',
      description: 'Detects logins originating from regions or cities unfamiliar to the employee profile.',
      points: 20,
      threshold: 0,
      enabled: true,
    },
    {
      id: 'RULE-5',
      ruleKey: 'SHARED_SUSPICIOUS_IP',
      name: 'Shared Suspicious IP Correlated Across Accounts',
      description: 'Identifies an IP observed targeting 3 or more distinct user accounts with failed/suspicious events.',
      points: 15,
      threshold: 3,
      enabled: true,
    },
  ];
  for (const r of defaultRules) db.rules.set(r.ruleKey, r);

  // 2. Organizations
  const orgs: Organization[] = [
    {
      id: 'ORG-001',
      name: 'ABC Technologies',
      code: 'ABC',
      email: 'contact@abctech.com',
      address: 'Cyber City, Phase 2, Pune, Maharashtra',
      contactNumber: '+91 20 4455 6677',
      managerId: 'MGR-001',
      managerName: 'Rajesh Sharma',
      managerEmail: 'manager.abc@abctech.com',
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      employeeCount: 4,
    },
    {
      id: 'ORG-002',
      name: 'XYZ Solutions',
      code: 'XYZ',
      email: 'security@xyzsolutions.io',
      address: 'Electronic City, Bengaluru, Karnataka',
      contactNumber: '+91 80 6677 8899',
      managerId: 'MGR-002',
      managerName: 'Anita Desai',
      managerEmail: 'manager.xyz@xyzsolutions.io',
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 75 * 86400000).toISOString(),
      employeeCount: 4,
    },
    {
      id: 'ORG-003',
      name: 'Global IT Services',
      code: 'GITS',
      email: 'admin@globalitservices.com',
      address: 'Bandra-Kurla Complex, Mumbai, Maharashtra',
      contactNumber: '+91 22 8899 0011',
      managerId: 'MGR-003',
      managerName: 'Sanjay Verma',
      managerEmail: 'manager.global@globalitservices.com',
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      employeeCount: 3,
    },
    {
      id: 'ORG-004',
      name: 'Future Tech Pvt Ltd',
      code: 'FTPL',
      email: 'info@futuretech.co.in',
      address: 'HITEC City, Hyderabad, Telangana',
      contactNumber: '+91 40 1122 3344',
      managerId: 'MGR-004',
      managerName: 'Pooja Iyer',
      managerEmail: 'manager.future@futuretech.co.in',
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
      employeeCount: 3,
    },
  ];
  for (const o of orgs) db.organizations.set(o.id, o);

  // 3. Super Admin Account
  const superAdmin: User = {
    id: 'USR-ADMIN',
    username: 'superadmin',
    email: 'admin@threatgraph.io',
    name: 'Chief Security Officer',
    passwordHash: 'Admin@123',
    role: 'SUPER_ADMIN',
    active: true,
    createdAt: new Date(Date.now() - 100 * 86400000).toISOString(),
  };
  db.users.set(superAdmin.id, superAdmin);

  // 4. Organization Managers (Exactly role ORGANIZATION_MANAGER)
  const managers: User[] = [
    {
      id: 'MGR-001',
      username: 'manager_abc',
      email: 'manager.abc@abctech.com',
      name: 'Rajesh Sharma',
      passwordHash: 'Manager@123',
      role: 'ORGANIZATION_MANAGER',
      organizationId: 'ORG-001',
      organizationName: 'ABC Technologies',
      department: 'Management',
      designation: 'Operations Director',
      active: true,
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    },
    {
      id: 'MGR-002',
      username: 'manager_xyz',
      email: 'manager.xyz@xyzsolutions.io',
      name: 'Anita Desai',
      passwordHash: 'Manager@123',
      role: 'ORGANIZATION_MANAGER',
      organizationId: 'ORG-002',
      organizationName: 'XYZ Solutions',
      department: 'IT Infrastructure',
      designation: 'VP Engineering',
      active: true,
      createdAt: new Date(Date.now() - 75 * 86400000).toISOString(),
    },
    {
      id: 'MGR-003',
      username: 'manager_global',
      email: 'manager.global@globalitservices.com',
      name: 'Sanjay Verma',
      passwordHash: 'Manager@123',
      role: 'ORGANIZATION_MANAGER',
      organizationId: 'ORG-003',
      organizationName: 'Global IT Services',
      department: 'Enterprise Security',
      designation: 'Security Lead',
      active: true,
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    },
    {
      id: 'MGR-004',
      username: 'manager_future',
      email: 'manager.future@futuretech.co.in',
      name: 'Pooja Iyer',
      passwordHash: 'Manager@123',
      role: 'ORGANIZATION_MANAGER',
      organizationId: 'ORG-004',
      organizationName: 'Future Tech Pvt Ltd',
      department: 'Cloud Services',
      designation: 'General Manager',
      active: true,
      createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    },
  ];
  for (const m of managers) db.users.set(m.id, m);

  // 5. Employees across organizations (Role EMPLOYEE)
  const employeeData = [
    // ABC Technologies (ORG-001)
    { id: 'EMP-101', username: 'emp_rahul', name: 'Rahul Joshi', email: 'rahul.j@abctech.com', orgId: 'ORG-001', dept: 'Software Engineering', desig: 'Senior Developer', ip: '192.168.1.50', loc: 'Pune, India' },
    { id: 'EMP-102', username: 'emp_sneha', name: 'Sneha Kulkarni', email: 'sneha.k@abctech.com', orgId: 'ORG-001', dept: 'Quality Assurance', desig: 'QA Lead', ip: '192.168.1.51', loc: 'Pune, India' },
    { id: 'EMP-103', username: 'emp_vikram', name: 'Vikram Mehta', email: 'vikram.m@abctech.com', orgId: 'ORG-001', dept: 'DevOps', desig: 'Cloud Architect', ip: '192.168.1.52', loc: 'Pune, India' },
    { id: 'EMP-104', username: 'emp_tanvi', name: 'Tanvi Shinde', email: 'tanvi.s@abctech.com', orgId: 'ORG-001', dept: 'Product Design', desig: 'UI/UX Specialist', ip: '192.168.1.53', loc: 'Pune, India' },

    // XYZ Solutions (ORG-002)
    { id: 'EMP-201', username: 'emp_priya', name: 'Priya Nair', email: 'priya.n@xyzsolutions.io', orgId: 'ORG-002', dept: 'Data Platform', desig: 'Data Scientist', ip: '172.16.10.20', loc: 'Bengaluru, India' },
    { id: 'EMP-202', username: 'emp_arjun', name: 'Arjun Rao', email: 'arjun.r@xyzsolutions.io', orgId: 'ORG-002', dept: 'Full Stack', desig: 'Backend Engineer', ip: '172.16.10.21', loc: 'Bengaluru, India' },
    { id: 'EMP-203', username: 'emp_neha', name: 'Neha Gupta', email: 'neha.g@xyzsolutions.io', orgId: 'ORG-002', dept: 'Security Audit', desig: 'Compliance Officer', ip: '172.16.10.22', loc: 'Bengaluru, India' },
    { id: 'EMP-204', username: 'emp_karan', name: 'Karan Malhotra', email: 'karan.m@xyzsolutions.io', orgId: 'ORG-002', dept: 'Product Delivery', desig: 'Project Manager', ip: '172.16.10.23', loc: 'Bengaluru, India' },

    // Global IT Services (ORG-003)
    { id: 'EMP-301', username: 'emp_amit', name: 'Amitabh Sen', email: 'amit.s@globalitservices.com', orgId: 'ORG-003', dept: 'Network Ops', desig: 'Network Administrator', ip: '10.200.4.15', loc: 'Mumbai, India' },
    { id: 'EMP-302', username: 'emp_divya', name: 'Divya Bhat', email: 'divya.b@globalitservices.com', orgId: 'ORG-003', dept: 'Database Ops', desig: 'Database Architect', ip: '10.200.4.16', loc: 'Mumbai, India' },
    { id: 'EMP-303', username: 'emp_rohan', name: 'Rohan Nambiar', email: 'rohan.n@globalitservices.com', orgId: 'ORG-003', dept: 'IT Helpdesk', desig: 'Support Specialist', ip: '10.200.4.17', loc: 'Mumbai, India' },

    // Future Tech Pvt Ltd (ORG-004)
    { id: 'EMP-401', username: 'emp_aditya', name: 'Aditya Reddy', email: 'aditya.r@futuretech.co.in', orgId: 'ORG-004', dept: 'AI Research', desig: 'ML Engineer', ip: '10.150.8.30', loc: 'Hyderabad, India' },
    { id: 'EMP-402', username: 'emp_meera', name: 'Meera Chawla', email: 'meera.c@futuretech.co.in', orgId: 'ORG-004', dept: 'Full Stack', desig: 'Frontend Engineer', ip: '10.150.8.31', loc: 'Hyderabad, India' },
    { id: 'EMP-403', username: 'emp_siddharth', name: 'Siddharth Patel', email: 'siddharth.p@futuretech.co.in', orgId: 'ORG-004', dept: 'Operations', desig: 'Scrum Master', ip: '10.150.8.32', loc: 'Hyderabad, India' },
  ];

  for (const emp of employeeData) {
    const org = db.organizations.get(emp.orgId);
    const user: User = {
      id: emp.id,
      username: emp.username,
      email: emp.email,
      name: emp.name,
      passwordHash: 'Employee@123',
      role: 'EMPLOYEE',
      organizationId: emp.orgId,
      organizationName: org?.name || 'Enterprise',
      department: emp.dept,
      designation: emp.desig,
      active: true,
      createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    };
    db.users.set(user.id, user);

    const profile: UserProfile = {
      userId: emp.id,
      normalStartHour: 9,
      normalEndHour: 18,
      knownIps: [emp.ip, '192.168.1.1', '10.0.1.10'],
      usualLocations: [emp.loc],
      knownDevices: [`Laptop-${emp.username}-Corp`, 'Workstation-Corp'],
    };
    db.profiles.set(emp.id, profile);
  }

  // 6. Generate ~150 Telemetry Login Events across all organizations
  const now = Date.now();
  let eventSeq = 1000;

  for (let day = 10; day >= 0; day--) {
    for (const emp of employeeData) {
      const org = db.organizations.get(emp.orgId);
      const isWeekend = (day % 7 === 0 || day % 7 === 6);
      if (isWeekend && Math.random() > 0.3) continue;

      const hour = 9 + ((day * 2 + emp.id.charCodeAt(5)) % 8);
      const eventDate = new Date(now - day * 86400000 + hour * 3600000);

      const id = `EVT-${eventSeq++}`;
      const evt: LoginEvent = {
        id,
        userId: emp.id,
        employeeName: emp.name,
        organizationId: emp.orgId,
        organizationName: org?.name || 'Enterprise',
        ipAddress: emp.ip,
        timestamp: eventDate.toISOString(),
        loginSuccess: true,
        failedAttempts: 0,
        location: emp.loc,
        deviceId: `Corp-${emp.username}-MacBook`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
        riskScore: 0,
        riskLevel: 'LOW',
        suspicious: false,
      };
      db.events.set(id, evt);
    }
  }

  // 7. Planted Realistic Cyber Threats for Super Admin Investigation
  const plantedAttacks: Array<Partial<LoginEvent>> = [
    // Scenario A: Brute force & Geo-Anomaly on emp_rahul (ABC Technologies)
    {
      userId: 'EMP-101',
      employeeName: 'Rahul Joshi',
      organizationId: 'ORG-001',
      organizationName: 'ABC Technologies',
      ipAddress: '45.23.11.90',
      timestamp: new Date(now - 3600000 * 3.5).toISOString(),
      loginSuccess: false,
      failedAttempts: 12,
      location: 'Frankfurt, Germany',
      deviceId: 'Unknown-Attacker-Rig',
      userAgent: 'Python/3.11 aiohttp/3.8.5',
    },
    // Scenario B: Shared Suspicious IP 45.23.11.90 probing XYZ Solutions (Sneha & Priya)
    {
      userId: 'EMP-102',
      employeeName: 'Sneha Kulkarni',
      organizationId: 'ORG-001',
      organizationName: 'ABC Technologies',
      ipAddress: '45.23.11.90',
      timestamp: new Date(now - 3600000 * 3.2).toISOString(),
      loginSuccess: false,
      failedAttempts: 7,
      location: 'Frankfurt, Germany',
      deviceId: 'Unknown-Attacker-Rig',
      userAgent: 'Python/3.11 aiohttp/3.8.5',
    },
    {
      userId: 'EMP-201',
      employeeName: 'Priya Nair',
      organizationId: 'ORG-002',
      organizationName: 'XYZ Solutions',
      ipAddress: '45.23.11.90',
      timestamp: new Date(now - 3600000 * 3.0).toISOString(),
      loginSuccess: false,
      failedAttempts: 6,
      location: 'Frankfurt, Germany',
      deviceId: 'Unknown-Attacker-Rig',
      userAgent: 'Python/3.11 aiohttp/3.8.5',
    },
    // Scenario C: Tor Exit Node Geolocation Jump on emp_amit (Global IT Services)
    {
      userId: 'EMP-301',
      employeeName: 'Amitabh Sen',
      organizationId: 'ORG-003',
      organizationName: 'Global IT Services',
      ipAddress: '185.220.101.5',
      timestamp: new Date(now - 3600000 * 14).toISOString(),
      loginSuccess: false,
      failedAttempts: 9,
      location: 'Moscow, Russia',
      deviceId: 'Tor-Browser/13.0',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0',
    },
    // Scenario D: Off-Hours High Risk Access on Future Tech (emp_aditya)
    {
      userId: 'EMP-401',
      employeeName: 'Aditya Reddy',
      organizationId: 'ORG-004',
      organizationName: 'Future Tech Pvt Ltd',
      ipAddress: '194.26.29.112',
      timestamp: new Date(now - 3600000 * 22).toISOString(),
      loginSuccess: true,
      failedAttempts: 3,
      location: 'London, UK',
      deviceId: 'Unregistered-MacBook-Air',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
  ];

  for (const p of plantedAttacks) {
    const id = `EVT-${eventSeq++}`;
    const evt: LoginEvent = {
      id,
      userId: p.userId!,
      employeeName: p.employeeName!,
      organizationId: p.organizationId!,
      organizationName: p.organizationName!,
      ipAddress: p.ipAddress!,
      timestamp: p.timestamp!,
      loginSuccess: p.loginSuccess!,
      failedAttempts: p.failedAttempts!,
      location: p.location!,
      deviceId: p.deviceId!,
      userAgent: p.userAgent || 'curl/8.1.0',
      riskScore: 0,
      riskLevel: 'LOW',
      suspicious: false,
    };
    db.events.set(id, evt);
  }

  // Evaluate risk scores on all events
  for (const evt of db.events.values()) {
    scoreAndProcessEvent(evt);
  }

  // Initial Audit Logs
  db.auditLogs.push(
    {
      id: 'AUD-001',
      actor: 'SYSTEM',
      action: 'PLATFORM_INITIALIZATION',
      targetRecord: 'CORE_DATABASE',
      details: 'ThreatGraph multi-tenant platform initialized: 4 Organizations, 18 Employees, 5 Detection Rules.',
      createdAt: new Date(now - 86400000).toISOString(),
    },
    {
      id: 'AUD-002',
      actor: 'THREAT_ENGINE',
      action: 'ALERTS_AUTOMATED',
      targetRecord: 'ALERT_QUEUE',
      details: `Explainable Risk Engine generated ${db.alerts.size} high/critical alerts across 4 organizations.`,
      createdAt: new Date(now - 3600000 * 3).toISOString(),
    }
  );
}

seedDatabase();

// --- REST API ENDPOINTS ---

// 1. AUTHENTICATION & AUTOMATIC LOGIN EVENT COLLECTION
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Find user
  let foundUser: User | undefined;
  for (const u of db.users.values()) {
    if (u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()) {
      foundUser = u;
      break;
    }
  }

  // Client network telemetry for automatic event capture
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Web Browser';
  const nowStr = new Date().toISOString();

  // Handle Failed Attempt
  if (!foundUser || foundUser.passwordHash !== password) {
    const currentFails = (db.failedAttemptCounter.get(username) || 0) + 1;
    db.failedAttemptCounter.set(username, currentFails);

    // If an employee account exists, automatically record this failed login event
    if (foundUser && foundUser.role === 'EMPLOYEE') {
      const eventId = `EVT-AUTO-${Date.now()}`;
      const failEvent: LoginEvent = {
        id: eventId,
        userId: foundUser.id,
        employeeName: foundUser.name,
        organizationId: foundUser.organizationId || 'UNKNOWN',
        organizationName: foundUser.organizationName || 'Unknown Org',
        ipAddress: clientIp,
        timestamp: nowStr,
        loginSuccess: false,
        failedAttempts: currentFails,
        location: 'Auto-Captured (Client)',
        deviceId: 'Browser Client',
        userAgent,
        riskScore: 0,
        riskLevel: 'LOW',
        suspicious: false,
      };

      // Automatically evaluate risk and raise alert if threshold crossed
      scoreAndProcessEvent(failEvent);
      db.events.set(failEvent.id, failEvent);
    }

    db.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      actor: username,
      action: 'LOGIN_FAILURE',
      targetRecord: foundUser ? foundUser.id : 'UNREGISTERED_ACCOUNT',
      details: `Authentication failed. Consecutive failed attempts: ${currentFails}. IP: ${clientIp}`,
      createdAt: nowStr,
    });

    return res.status(401).json({ error: 'Invalid username or password' });
  }

  if (!foundUser.active) {
    return res.status(403).json({ error: 'Account is deactivated. Contact your Organization Manager.' });
  }

  // Reset failed attempt counter on success
  const previousFails = db.failedAttemptCounter.get(username) || 0;
  db.failedAttemptCounter.delete(username);

  // AUTOMATIC LOGIN EVENT RECORDING FOR EMPLOYEES
  if (foundUser.role === 'EMPLOYEE') {
    const eventId = `EVT-AUTO-${Date.now()}`;
    const successEvent: LoginEvent = {
      id: eventId,
      userId: foundUser.id,
      employeeName: foundUser.name,
      organizationId: foundUser.organizationId || 'UNKNOWN',
      organizationName: foundUser.organizationName || 'Unknown Org',
      ipAddress: clientIp,
      timestamp: nowStr,
      loginSuccess: true,
      failedAttempts: previousFails,
      location: 'Pune / Bengaluru (Client IP)',
      deviceId: 'Employee Workstation',
      userAgent,
      riskScore: 0,
      riskLevel: 'LOW',
      suspicious: false,
    };

    scoreAndProcessEvent(successEvent);
    db.events.set(successEvent.id, successEvent);
  }

  // Audit successful login
  db.auditLogs.unshift({
    id: `AUD-${Date.now()}`,
    actor: foundUser.username,
    action: 'USER_LOGIN',
    targetRecord: foundUser.id,
    details: `Successful authentication. Role: ${foundUser.role}. Organization: ${foundUser.organizationName || 'Centralized'}`,
    createdAt: nowStr,
  });

  const token = createToken({
    sub: foundUser.id,
    role: foundUser.role,
    username: foundUser.username,
    organizationId: foundUser.organizationId,
  });

  return res.json({
    token,
    tokenType: 'Bearer',
    id: foundUser.id,
    username: foundUser.username,
    name: foundUser.name,
    email: foundUser.email,
    role: foundUser.role,
    organizationId: foundUser.organizationId,
    organizationName: foundUser.organizationName,
  });
});

app.post('/api/auth/logout', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  db.auditLogs.unshift({
    id: `AUD-${Date.now()}`,
    actor: user.username,
    action: 'USER_LOGOUT',
    targetRecord: user.sub,
    details: 'User logged out securely.',
    createdAt: new Date().toISOString(),
  });
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', authenticate, (req: Request, res: Response) => {
  const tokenPayload = (req as any).user;
  const user = db.users.get(tokenPayload.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const profile = db.profiles.get(user.id);
  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId,
    organizationName: user.organizationName,
    department: user.department,
    designation: user.designation,
    active: user.active,
    createdAt: user.createdAt,
    profile,
  });
});

// 2. ORGANIZATIONS MANAGEMENT (SUPER_ADMIN ONLY)
app.get('/api/organizations', authenticate, authorize('SUPER_ADMIN'), (_req: Request, res: Response) => {
  // Recalculate employee counts
  const orgs = Array.from(db.organizations.values()).map((org) => {
    let empCount = 0;
    for (const u of db.users.values()) {
      if (u.organizationId === org.id && u.role === 'EMPLOYEE') empCount++;
    }
    return { ...org, employeeCount: empCount };
  });
  res.json(orgs);
});

app.post('/api/organizations', authenticate, authorize('SUPER_ADMIN'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const { name, code, email, address, contactNumber } = req.body;

  if (!name || !code) {
    return res.status(400).json({ error: 'Organization name and code are required' });
  }

  const id = `ORG-${Date.now()}`;
  const newOrg: Organization = {
    id,
    name: name.trim(),
    code: code.trim().toUpperCase(),
    email: email || `${code.toLowerCase()}@threatgraph.corp`,
    address: address || 'Corporate Tower, India',
    contactNumber: contactNumber || '+91 20 0000 0000',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    employeeCount: 0,
  };

  db.organizations.set(id, newOrg);

  db.auditLogs.unshift({
    id: `AUD-${Date.now()}`,
    actor: user.username,
    action: 'ORGANIZATION_CREATED',
    targetRecord: id,
    details: `Created new organization: ${newOrg.name} (${newOrg.code})`,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json(newOrg);
});

app.patch('/api/organizations/:id/status', authenticate, authorize('SUPER_ADMIN'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const org = db.organizations.get(req.params.id);
  if (!org) return res.status(404).json({ error: 'Organization not found' });

  const { status } = req.body;
  org.status = status;

  db.auditLogs.unshift({
    id: `AUD-${Date.now()}`,
    actor: user.username,
    action: 'ORGANIZATION_STATUS_UPDATE',
    targetRecord: org.id,
    details: `Organization ${org.name} status updated to ${status}`,
    createdAt: new Date().toISOString(),
  });

  res.json(org);
});

// 3. ORGANIZATION MANAGERS MANAGEMENT (SUPER_ADMIN ONLY)
app.get('/api/managers', authenticate, authorize('SUPER_ADMIN'), (_req: Request, res: Response) => {
  const managers = Array.from(db.users.values()).filter((u) => u.role === 'ORGANIZATION_MANAGER');
  res.json(managers);
});

app.post('/api/managers', authenticate, authorize('SUPER_ADMIN'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const { username, name, email, password, organizationId } = req.body;

  if (!username || !email || !organizationId) {
    return res.status(400).json({ error: 'Username, email, and organizationId are required' });
  }

  const org = db.organizations.get(organizationId);
  if (!org) return res.status(404).json({ error: 'Organization not found' });

  const id = `MGR-${Date.now()}`;
  const newManager: User = {
    id,
    username: username.trim(),
    name: name || username,
    email: email.trim(),
    passwordHash: password || 'Manager@123',
    role: 'ORGANIZATION_MANAGER',
    organizationId,
    organizationName: org.name,
    department: 'Management',
    designation: 'Organization Manager',
    active: true,
    createdAt: new Date().toISOString(),
  };

  db.users.set(id, newManager);
  org.managerId = id;
  org.managerName = newManager.name;
  org.managerEmail = newManager.email;

  db.auditLogs.unshift({
    id: `AUD-${Date.now()}`,
    actor: user.username,
    action: 'MANAGER_ASSIGNED',
    targetRecord: id,
    details: `Assigned Organization Manager ${newManager.name} to ${org.name}`,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json(newManager);
});

// 4. EMPLOYEE MANAGEMENT (SUPER_ADMIN & ORGANIZATION_MANAGER)
app.get('/api/employees', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;

  let employees = Array.from(db.users.values()).filter((u) => u.role === 'EMPLOYEE');

  // Tenant Isolation: Org Managers only see their own organization!
  if (user.role === 'ORGANIZATION_MANAGER') {
    employees = employees.filter((e) => e.organizationId === user.organizationId);
  } else if (user.role === 'EMPLOYEE') {
    return res.status(403).json({ error: 'Employees cannot access organization employee records.' });
  }

  res.json(employees);
});

app.post('/api/employees', authenticate, authorize('SUPER_ADMIN', 'ORGANIZATION_MANAGER'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const { username, name, email, department, designation, password, organizationId } = req.body;

  // Tenant Isolation: If Org Manager, force their own organizationId
  const effectiveOrgId = user.role === 'ORGANIZATION_MANAGER' ? user.organizationId : organizationId;
  const org = db.organizations.get(effectiveOrgId);

  if (!username || !email || !effectiveOrgId || !org) {
    return res.status(400).json({ error: 'Username, email, and valid organization are required' });
  }

  const id = `EMP-${Date.now()}`;
  const tempPassword = password || `Temp@${Math.floor(1000 + Math.random() * 9000)}`;

  const newEmp: User = {
    id,
    username: username.trim(),
    name: name || username,
    email: email.trim(),
    passwordHash: tempPassword,
    role: 'EMPLOYEE',
    organizationId: effectiveOrgId,
    organizationName: org.name,
    department: department || 'Engineering',
    designation: designation || 'Associate',
    active: true,
    createdAt: new Date().toISOString(),
  };

  db.users.set(id, newEmp);

  // Default baseline profile
  const profile: UserProfile = {
    userId: id,
    normalStartHour: 9,
    normalEndHour: 18,
    knownIps: ['192.168.1.100', '10.0.1.50'],
    usualLocations: ['Pune, India'],
    knownDevices: [`Laptop-${username}`],
  };
  db.profiles.set(id, profile);

  db.auditLogs.unshift({
    id: `AUD-${Date.now()}`,
    actor: user.username,
    action: 'EMPLOYEE_CREATED',
    targetRecord: id,
    details: `Registered employee ${newEmp.name} under ${org.name}. Generated temp credentials.`,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({ employee: newEmp, temporaryPassword: tempPassword });
});

app.patch('/api/employees/:id/status', authenticate, authorize('SUPER_ADMIN', 'ORGANIZATION_MANAGER'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const targetEmp = db.users.get(req.params.id);
  if (!targetEmp || targetEmp.role !== 'EMPLOYEE') {
    return res.status(404).json({ error: 'Employee not found' });
  }

  // Tenant Isolation Check
  if (user.role === 'ORGANIZATION_MANAGER' && targetEmp.organizationId !== user.organizationId) {
    return res.status(403).json({ error: 'Cannot modify employee from another organization' });
  }

  const { active } = req.body;
  targetEmp.active = Boolean(active);

  db.auditLogs.unshift({
    id: `AUD-${Date.now()}`,
    actor: user.username,
    action: 'EMPLOYEE_STATUS_UPDATE',
    targetRecord: targetEmp.id,
    details: `Employee ${targetEmp.name} status updated to: ${targetEmp.active ? 'ACTIVE' : 'INACTIVE'}`,
    createdAt: new Date().toISOString(),
  });

  res.json(targetEmp);
});

app.post('/api/employees/:id/reset-password', authenticate, authorize('SUPER_ADMIN', 'ORGANIZATION_MANAGER'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const targetEmp = db.users.get(req.params.id);
  if (!targetEmp || targetEmp.role !== 'EMPLOYEE') {
    return res.status(404).json({ error: 'Employee not found' });
  }

  // Tenant Isolation Check
  if (user.role === 'ORGANIZATION_MANAGER' && targetEmp.organizationId !== user.organizationId) {
    return res.status(403).json({ error: 'Cannot reset password for another organization' });
  }

  const newTempPassword = `Reset@${Math.floor(1000 + Math.random() * 9000)}`;
  targetEmp.passwordHash = newTempPassword;

  db.auditLogs.unshift({
    id: `AUD-${Date.now()}`,
    actor: user.username,
    action: 'EMPLOYEE_PASSWORD_RESET',
    targetRecord: targetEmp.id,
    details: `Password reset by manager for employee ${targetEmp.name}. Temporary credentials issued.`,
    createdAt: new Date().toISOString(),
  });

  res.json({ message: 'Password reset successfully', temporaryPassword: newTempPassword });
});

// 5. LOGIN EVENTS APIS (TENANT-ISOLATED)
app.get('/api/events', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { search, organizationId, suspicious, loginSuccess, riskLevel } = req.query;

  let events = Array.from(db.events.values());

  // Tenant Isolation:
  // Org Managers can ONLY see events from their organization!
  if (user.role === 'ORGANIZATION_MANAGER') {
    events = events.filter((e) => e.organizationId === user.organizationId);
  } else if (user.role === 'EMPLOYEE') {
    // Employees cannot query global events
    return res.status(403).json({ error: 'Employees only have access to their personal login history.' });
  }

  // Super Admin can filter by organizationId
  if (user.role === 'SUPER_ADMIN' && organizationId && organizationId !== 'all') {
    events = events.filter((e) => e.organizationId === organizationId);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    events = events.filter(
      (e) =>
        e.employeeName.toLowerCase().includes(q) ||
        e.userId.toLowerCase().includes(q) ||
        e.ipAddress.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.organizationName.toLowerCase().includes(q)
    );
  }

  if (suspicious !== undefined && suspicious !== 'all') {
    events = events.filter((e) => e.suspicious === (suspicious === 'true'));
  }

  if (loginSuccess !== undefined && loginSuccess !== 'all') {
    events = events.filter((e) => e.loginSuccess === (loginSuccess === 'true'));
  }

  if (riskLevel && riskLevel !== 'all') {
    events = events.filter((e) => e.riskLevel === riskLevel);
  }

  // Sort descending by timestamp
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json(events);
});

// Employee personal login history
app.get('/api/events/my-history', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const myEvents = Array.from(db.events.values())
    .filter((e) => e.userId === user.sub)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json(myEvents);
});

// Employee self-service: Change password
app.post('/api/employee/change-password', authenticate, authorize('EMPLOYEE'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const { currentPassword, newPassword } = req.body;
  const emp = db.users.get(user.sub);

  if (!emp || emp.passwordHash !== currentPassword) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  emp.passwordHash = newPassword;
  db.auditLogs.unshift({
    id: `AUD-${Date.now()}`,
    actor: emp.username,
    action: 'PASSWORD_CHANGED',
    targetRecord: emp.id,
    details: 'Employee updated account password.',
    createdAt: new Date().toISOString(),
  });

  res.json({ message: 'Password updated successfully' });
});

// Employee self-service: Report unfamiliar login
app.post('/api/employee/report-unfamiliar', authenticate, authorize('EMPLOYEE'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const { eventId, comments } = req.body;
  const emp = db.users.get(user.sub);

  db.auditLogs.unshift({
    id: `AUD-${Date.now()}`,
    actor: emp?.username || user.username,
    action: 'UNFAMILIAR_LOGIN_REPORTED',
    targetRecord: eventId || emp?.id,
    details: `Employee reported unfamiliar login on event ${eventId || 'RECENT'}: ${comments || 'No comment'}`,
    createdAt: new Date().toISOString(),
  });

  res.json({ message: 'Report submitted to Super Admin security review.' });
});

// 6. DASHBOARDS (ROLE-SPECIFIC & TENANT-ISOLATED)

// Super Admin Centralized Security Dashboard
app.get('/api/dashboard/admin', authenticate, authorize('SUPER_ADMIN'), (_req: Request, res: Response) => {
  let successful = 0;
  let failed = 0;
  let suspicious = 0;
  let highAlerts = 0;
  let criticalAlerts = 0;

  for (const e of db.events.values()) {
    if (e.loginSuccess) successful++;
    else failed++;
    if (e.suspicious) suspicious++;
  }

  for (const a of db.alerts.values()) {
    if (a.riskLevel === 'HIGH') highAlerts++;
    if (a.riskLevel === 'CRITICAL') criticalAlerts++;
  }

  // Risk distribution
  const riskDistribution = [
    { name: 'Low (0-29)', count: Array.from(db.events.values()).filter((e) => e.riskLevel === 'LOW').length },
    { name: 'Medium (30-59)', count: Array.from(db.events.values()).filter((e) => e.riskLevel === 'MEDIUM').length },
    { name: 'High (60-79)', count: Array.from(db.events.values()).filter((e) => e.riskLevel === 'HIGH').length },
    { name: 'Critical (80-100)', count: Array.from(db.events.values()).filter((e) => e.riskLevel === 'CRITICAL').length },
  ];

  // Org-wise breakdown
  const orgBreakdown: Record<string, { name: string; total: number; failed: number; suspicious: number }> = {};
  for (const o of db.organizations.values()) {
    orgBreakdown[o.id] = { name: o.name, total: 0, failed: 0, suspicious: 0 };
  }
  for (const e of db.events.values()) {
    if (orgBreakdown[e.organizationId]) {
      orgBreakdown[e.organizationId].total++;
      if (!e.loginSuccess) orgBreakdown[e.organizationId].failed++;
      if (e.suspicious) orgBreakdown[e.organizationId].suspicious++;
    }
  }

  // Top Suspicious IPs
  const ipCounts: Record<string, { ip: string; fails: number; accounts: Set<string>; location: string }> = {};
  for (const e of db.events.values()) {
    if (!e.loginSuccess || e.suspicious) {
      if (!ipCounts[e.ipAddress]) {
        ipCounts[e.ipAddress] = { ip: e.ipAddress, fails: 0, accounts: new Set(), location: e.location };
      }
      ipCounts[e.ipAddress].fails++;
      ipCounts[e.ipAddress].accounts.add(e.userId);
    }
  }

  const topSuspiciousIps = Object.values(ipCounts)
    .map((item) => ({
      ip: item.ip,
      incidentCount: item.fails,
      uniqueAccounts: item.accounts.size,
      location: item.location,
    }))
    .sort((a, b) => b.incidentCount - a.incidentCount)
    .slice(0, 5);

  res.json({
    totalOrganizations: db.organizations.size,
    totalEmployees: Array.from(db.users.values()).filter((u) => u.role === 'EMPLOYEE').length,
    totalLoginEvents: db.events.size,
    successfulLogins: successful,
    failedLogins: failed,
    suspiciousEvents: suspicious,
    highRiskAlerts: highAlerts,
    criticalAlerts: criticalAlerts,
    riskDistribution,
    orgBreakdown: Object.values(orgBreakdown),
    topSuspiciousIps,
  });
});

// Organization Manager Dashboard (Tenant Isolated)
app.get('/api/dashboard/organization', authenticate, authorize('ORGANIZATION_MANAGER'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const orgId = user.organizationId;
  const org = db.organizations.get(orgId);

  let activeEmps = 0;
  let inactiveEmps = 0;
  let totalEvents = 0;
  let successful = 0;
  let failed = 0;

  for (const u of db.users.values()) {
    if (u.organizationId === orgId && u.role === 'EMPLOYEE') {
      if (u.active) activeEmps++;
      else inactiveEmps++;
    }
  }

  const orgEvents = Array.from(db.events.values()).filter((e) => e.organizationId === orgId);
  totalEvents = orgEvents.length;
  for (const e of orgEvents) {
    if (e.loginSuccess) successful++;
    else failed++;
  }

  const recentEvents = orgEvents
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  res.json({
    organization: org,
    totalEmployees: activeEmps + inactiveEmps,
    activeEmployees: activeEmps,
    inactiveEmployees: inactiveEmps,
    totalLoginEvents: totalEvents,
    successfulLogins: successful,
    failedLogins: failed,
    recentEvents,
  });
});

// Employee Personal Security Dashboard
app.get('/api/dashboard/employee', authenticate, authorize('EMPLOYEE'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const emp = db.users.get(user.sub);
  const profile = db.profiles.get(user.sub);

  const myEvents = Array.from(db.events.values())
    .filter((e) => e.userId === user.sub)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const lastLogin = myEvents.length > 0 ? myEvents[0] : null;

  res.json({
    employee: emp,
    profile,
    lastLogin,
    totalLogins: myEvents.length,
    recentLogins: myEvents.slice(0, 5),
  });
});

// 7. THREAT ALERTS MANAGEMENT (SUPER_ADMIN ONLY)
app.get('/api/alerts', authenticate, authorize('SUPER_ADMIN'), (_req: Request, res: Response) => {
  const alertsList = Array.from(db.alerts.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  res.json(alertsList);
});

app.get('/api/alerts/:id', authenticate, authorize('SUPER_ADMIN'), (req: Request, res: Response) => {
  const alert = db.alerts.get(req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  const history = db.alertHistory.filter((h) => h.alertId === alert.id);
  res.json({ alert, history });
});

app.patch('/api/alerts/:id/status', authenticate, authorize('SUPER_ADMIN'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const alert = db.alerts.get(req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });

  const { status, note } = req.body;
  const oldStatus = alert.status;
  alert.status = status;
  alert.updatedAt = new Date().toISOString();

  const historyItem: AlertHistory = {
    id: `HST-${Date.now()}`,
    alertId: alert.id,
    oldStatus,
    newStatus: status,
    note: note || `Status updated to ${status} by Super Admin`,
    changedBy: user.username,
    changedAt: new Date().toISOString(),
  };
  db.alertHistory.push(historyItem);

  db.auditLogs.unshift({
    id: `AUD-${Date.now()}`,
    actor: user.username,
    action: 'ALERT_INVESTIGATION_STATUS_CHANGED',
    targetRecord: alert.alertCode,
    details: `Alert ${alert.alertCode} (${alert.employeeName}) status transitioned: ${oldStatus} -> ${status}. Note: ${historyItem.note}`,
    createdAt: new Date().toISOString(),
  });

  res.json({ alert, historyItem });
});

// 8. THREATGRAPH RELATIONSHIP GRAPH VISUALIZATION (SUPER_ADMIN ONLY)
app.get('/api/threat-graph', authenticate, authorize('SUPER_ADMIN'), (_req: Request, res: Response) => {
  const nodes: any[] = [];
  const edges: any[] = [];
  const seenNodes = new Set<string>();

  // Organizations
  let orgX = 100;
  for (const org of db.organizations.values()) {
    nodes.push({
      id: org.id,
      type: 'organization',
      label: org.name,
      subtitle: `Code: ${org.code}`,
      data: { ...org },
      x: orgX,
      y: 80,
    });
    seenNodes.add(org.id);
    orgX += 300;
  }

  // Employees & Connections: Org -> Employee
  let empX = 80;
  for (const u of db.users.values()) {
    if (u.role === 'EMPLOYEE' && u.organizationId) {
      nodes.push({
        id: u.id,
        type: 'employee',
        label: u.name,
        subtitle: `${u.designation} (${u.department})`,
        data: { ...u },
        x: empX,
        y: 240,
      });
      seenNodes.add(u.id);

      edges.push({
        id: `e-${u.organizationId}-${u.id}`,
        source: u.organizationId,
        target: u.id,
        label: 'Employs',
      });
      empX += 160;
    }
  }

  // Suspicious Events & Alerts
  let eventX = 120;
  const ipMap = new Map<string, string[]>(); // IP -> [eventIds]

  for (const evt of db.events.values()) {
    if (evt.suspicious || !evt.loginSuccess) {
      const evtNodeId = `NODE-${evt.id}`;
      nodes.push({
        id: evtNodeId,
        type: 'event',
        label: `${evt.loginSuccess ? 'Suspicious Login' : 'Failed Login'}`,
        subtitle: `${evt.riskScore} pts · ${evt.riskLevel}`,
        riskLevel: evt.riskLevel,
        riskScore: evt.riskScore,
        data: { ...evt },
        x: eventX,
        y: 420,
      });

      edges.push({
        id: `e-${evt.userId}-${evtNodeId}`,
        source: evt.userId,
        target: evtNodeId,
        label: 'Logged Event',
        suspicious: evt.suspicious,
      });

      // Track IP
      if (!ipMap.has(evt.ipAddress)) ipMap.set(evt.ipAddress, []);
      ipMap.get(evt.ipAddress)!.push(evtNodeId);

      eventX += 180;
    }
  }

  // Unique IP Nodes
  let ipX = 200;
  for (const [ip, relatedEvts] of ipMap.entries()) {
    const ipNodeId = `IP-${ip.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const isShared = relatedEvts.length >= 2;

    nodes.push({
      id: ipNodeId,
      type: 'ip',
      label: ip,
      subtitle: isShared ? `Shared Suspicious IP (${relatedEvts.length} events)` : 'Origin IP',
      riskLevel: isShared ? 'HIGH' : 'MEDIUM',
      data: { ip, relatedEventsCount: relatedEvts.length, isShared },
      x: ipX,
      y: 600,
    });

    for (const evtNodeId of relatedEvts) {
      edges.push({
        id: `e-${evtNodeId}-${ipNodeId}`,
        source: evtNodeId,
        target: ipNodeId,
        label: 'Originates From',
        suspicious: isShared,
      });
    }
    ipX += 240;
  }

  // Threat Alerts: Event -> Threat Alert
  let alertX = 150;
  for (const alt of db.alerts.values()) {
    const alertNodeId = `NODE-${alt.id}`;
    const evtNodeId = `NODE-${alt.eventId}`;

    nodes.push({
      id: alertNodeId,
      type: 'alert',
      label: alt.alertCode,
      subtitle: `${alt.riskScore} pts · ${alt.status}`,
      riskLevel: alt.riskLevel,
      riskScore: alt.riskScore,
      data: { ...alt },
      x: alertX,
      y: 780,
    });

    edges.push({
      id: `e-${evtNodeId}-${alertNodeId}`,
      source: evtNodeId,
      target: alertNodeId,
      label: 'Generated Alert',
      suspicious: true,
    });

    alertX += 200;
  }

  res.json({ nodes, edges });
});

// 9. WHAT-IF LOGIN SIMULATOR (SUPER_ADMIN ONLY)
app.post('/api/simulator/analyze', authenticate, authorize('SUPER_ADMIN'), (req: Request, res: Response) => {
  const { userId, failedAttempts, ipAddress, isUnknownIp, loginHour, location, isUnusualLocation, isSharedIp } = req.body;

  const triggered: any[] = [];
  let rawScore = 0;

  // Multiple failed attempts (30 pts)
  if (failedAttempts >= 5) {
    const pts = 30;
    rawScore += pts;
    triggered.push({
      ruleKey: 'MULTIPLE_FAILED_ATTEMPTS',
      ruleName: 'Multiple Failed Login Attempts',
      points: pts,
      reason: `Simulated ${failedAttempts} failed attempts (threshold: 5)`,
      recommendation: 'Audit credential brute-forcing pattern.',
    });
  }

  // Unknown IP (20 pts)
  if (isUnknownIp) {
    const pts = 20;
    rawScore += pts;
    triggered.push({
      ruleKey: 'UNKNOWN_IP',
      ruleName: 'Unrecognized IP Address',
      points: pts,
      reason: `IP ${ipAddress || '45.23.11.90'} is unknown in employee historical profile`,
      recommendation: 'Prompt for multi-factor authentication.',
    });
  }

  // Unusual Hours (15 pts)
  if (loginHour < 9 || loginHour >= 18) {
    const pts = 15;
    rawScore += pts;
    triggered.push({
      ruleKey: 'UNUSUAL_LOGIN_TIME',
      ruleName: 'Unusual Login Hours',
      points: pts,
      reason: `Attempt at ${loginHour}:00 is outside standard work profile (09:00 - 18:00)`,
      recommendation: 'Verify off-hours corporate justification.',
    });
  }

  // Unusual Location (20 pts)
  if (isUnusualLocation) {
    const pts = 20;
    rawScore += pts;
    triggered.push({
      ruleKey: 'UNUSUAL_LOCATION',
      ruleName: 'Anomalous Geographic Location',
      points: pts,
      reason: `Access location '${location || 'Foreign Region'}' departs from historical baselines`,
      recommendation: 'Verify travel itinerary or unauthorized proxy usage.',
    });
  }

  // Shared Suspicious IP (15 pts)
  if (isSharedIp) {
    const pts = 15;
    rawScore += pts;
    triggered.push({
      ruleKey: 'SHARED_SUSPICIOUS_IP',
      ruleName: 'Shared Suspicious IP Correlated Across Accounts',
      points: pts,
      reason: `Simulated IP observed targeting 3+ distinct accounts with failures`,
      recommendation: 'Correlate on ThreatGraph canvas for horizontal scan detection.',
    });
  }

  const finalScore = Math.min(rawScore, 100);
  const riskLevel = calculateRiskLevel(finalScore);

  res.json({
    riskScore: finalScore,
    riskLevel,
    suspicious: finalScore >= 30,
    triggeredRules: triggered,
    reasons: triggered.map((t) => `${t.ruleName} (+${t.points} pts): ${t.reason}`),
    recommendations: triggered.map((t) => t.recommendation),
  });
});

// 10. DETECTION RULES CONFIGURATION (SUPER_ADMIN ONLY)
app.get('/api/rules', authenticate, authorize('SUPER_ADMIN'), (_req: Request, res: Response) => {
  res.json(Array.from(db.rules.values()));
});

app.put('/api/rules/:key', authenticate, authorize('SUPER_ADMIN'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const rule = db.rules.get(req.params.key);
  if (!rule) return res.status(404).json({ error: 'Detection rule not found' });

  const { points, threshold, enabled } = req.body;
  if (points !== undefined) rule.points = Number(points);
  if (threshold !== undefined) rule.threshold = Number(threshold);
  if (enabled !== undefined) rule.enabled = Boolean(enabled);

  db.auditLogs.unshift({
    id: `AUD-${Date.now()}`,
    actor: user.username,
    action: 'DETECTION_RULE_CONFIGURED',
    targetRecord: rule.ruleKey,
    details: `Updated rule ${rule.name}: points=${rule.points}, threshold=${rule.threshold}, enabled=${rule.enabled}`,
    createdAt: new Date().toISOString(),
  });

  res.json(rule);
});

// 11. AUDIT LOGS (SUPER_ADMIN ONLY)
app.get('/api/audit-logs', authenticate, authorize('SUPER_ADMIN'), (_req: Request, res: Response) => {
  res.json(db.auditLogs.slice(0, 100));
});

// 12. SECURITY REPORTS & EXPORT
app.get('/api/reports/login', authenticate, authorize('SUPER_ADMIN', 'ORGANIZATION_MANAGER'), (req: Request, res: Response) => {
  const user = (req as any).user;
  let records = Array.from(db.events.values());
  if (user.role === 'ORGANIZATION_MANAGER') {
    records = records.filter((r) => r.organizationId === user.organizationId);
  }

  const csvRows = ['EventId,UserId,EmployeeName,Organization,IPAddress,Timestamp,Result,FailedAttempts,Location,RiskScore,RiskLevel'];
  for (const r of records) {
    csvRows.push(
      `"${r.id}","${r.userId}","${r.employeeName}","${r.organizationName}","${r.ipAddress}","${r.timestamp}","${r.loginSuccess ? 'SUCCESS' : 'FAILED'}","${r.failedAttempts}","${r.location}","${r.riskScore}","${r.riskLevel}"`
    );
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="threatgraph_login_report.csv"');
  res.send(csvRows.join('\n'));
});

// --- VITE DEV / PROD INTEGRATION ---
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ThreatGraph Enterprise Server] Running on http://0.0.0.0:${PORT}`);
  });
}

setupVite().catch(console.error);
