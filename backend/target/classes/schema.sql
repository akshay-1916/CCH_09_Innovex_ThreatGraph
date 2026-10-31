-- ThreatGraph Multi-Tenant Relational Database Schema
-- Compatible with PostgreSQL & H2 (PostgreSQL Mode)

CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL,
    address VARCHAR(255),
    contact_number VARCHAR(50),
    manager_id VARCHAR(64),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- SUPER_ADMIN, ORGANIZATION_MANAGER, EMPLOYEE
    organization_id VARCHAR(64),
    department VARCHAR(100),
    designation VARCHAR(100),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS employee_login_profiles (
    user_id VARCHAR(64) PRIMARY KEY,
    normal_start_hour INT NOT NULL DEFAULT 9,
    normal_end_hour INT NOT NULL DEFAULT 18,
    known_ips TEXT,
    usual_locations TEXT,
    known_devices TEXT,
    CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS login_events (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    organization_id VARCHAR(64) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    login_success BOOLEAN NOT NULL,
    failed_attempts INT NOT NULL DEFAULT 0,
    location VARCHAR(100),
    device_id VARCHAR(100),
    user_agent TEXT,
    risk_score INT NOT NULL DEFAULT 0,
    risk_level VARCHAR(20) NOT NULL DEFAULT 'LOW', -- LOW, MEDIUM, HIGH, CRITICAL
    suspicious BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_event_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_login_events_user_id ON login_events(user_id);
CREATE INDEX IF NOT EXISTS idx_login_events_org_id ON login_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_login_events_ip ON login_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_events_timestamp ON login_events(timestamp);

CREATE TABLE IF NOT EXISTS threat_alerts (
    id VARCHAR(64) PRIMARY KEY,
    alert_code VARCHAR(32) NOT NULL UNIQUE, -- e.g. TG-1001
    event_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    organization_id VARCHAR(64) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    risk_score INT NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    reasons_json TEXT NOT NULL,
    recommendations_json TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'NEW', -- NEW, UNDER_REVIEW, RESOLVED, FALSE_POSITIVE
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alert_event FOREIGN KEY (event_id) REFERENCES login_events(id) ON DELETE CASCADE,
    CONSTRAINT fk_alert_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS alert_history (
    id VARCHAR(64) PRIMARY KEY,
    alert_id VARCHAR(64) NOT NULL,
    old_status VARCHAR(30) NOT NULL,
    new_status VARCHAR(30) NOT NULL,
    note TEXT,
    changed_by VARCHAR(100) NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_history_alert FOREIGN KEY (alert_id) REFERENCES threat_alerts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS detection_rules (
    id VARCHAR(64) PRIMARY KEY,
    rule_key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    points INT NOT NULL,
    threshold INT,
    enabled BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    actor VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_record VARCHAR(100),
    details TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
