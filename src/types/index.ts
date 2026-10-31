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
  role: Role;
  organizationId?: string;
  organizationName?: string;
  department?: string;
  designation?: string;
  active: boolean;
  createdAt: string;
  profile?: UserProfile;
}

export interface UserProfile {
  userId: string;
  normalStartHour: number;
  normalEndHour: number;
  knownIps: string[];
  usualLocations: string[];
  knownDevices: string[];
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

export interface DetectionRule {
  id: string;
  ruleKey: string;
  name: string;
  description: string;
  points: number;
  threshold: number;
  enabled: boolean;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  targetRecord?: string;
  details: string;
  createdAt: string;
}

export interface ThreatGraphNode {
  id: string;
  type: 'organization' | 'employee' | 'ip' | 'event' | 'alert';
  label: string;
  subtitle?: string;
  riskLevel?: RiskLevel;
  riskScore?: number;
  data: Record<string, any>;
  x?: number;
  y?: number;
}

export interface ThreatGraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  suspicious?: boolean;
}

export interface ThreatGraphData {
  nodes: ThreatGraphNode[];
  edges: ThreatGraphEdge[];
}

export interface SimulatorRequest {
  userId: string;
  failedAttempts: number;
  ipAddress: string;
  isUnknownIp: boolean;
  loginHour: number;
  location: string;
  isUnusualLocation: boolean;
  isSharedIp: boolean;
}

export interface SimulatorResult {
  riskScore: number;
  riskLevel: RiskLevel;
  suspicious: boolean;
  triggeredRules: Array<{
    ruleKey: string;
    ruleName: string;
    points: number;
    reason: string;
    recommendation: string;
  }>;
  reasons: string[];
  recommendations: string[];
}
