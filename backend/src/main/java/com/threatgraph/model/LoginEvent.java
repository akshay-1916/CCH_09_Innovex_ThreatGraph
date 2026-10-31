package com.threatgraph.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "login_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginEvent {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "user_id", nullable = false, length = 64)
    private String userId;

    @Column(name = "ip_address", nullable = false, length = 45)
    private String ipAddress;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "login_success", nullable = false)
    private Boolean loginSuccess;

    @Column(name = "failed_attempts", nullable = false)
    @Builder.Default
    private Integer failedAttempts = 0;

    @Column(length = 100)
    private String location;

    @Column(name = "device_id", length = 100)
    private String deviceId;

    @Column(name = "risk_score", nullable = false)
    @Builder.Default
    private Integer riskScore = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false, length = 20)
    @Builder.Default
    private RiskLevel riskLevel = RiskLevel.LOW;

    @Column(nullable = false)
    @Builder.Default
    private Boolean suspicious = false;
}
