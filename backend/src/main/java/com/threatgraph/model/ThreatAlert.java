package com.threatgraph.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "threat_alerts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThreatAlert {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "alert_code", nullable = false, unique = true, length = 32)
    private String alertCode; // e.g., TG-1001

    @Column(name = "event_id", nullable = false, length = 64)
    private String eventId;

    @Column(name = "user_id", nullable = false, length = 64)
    private String userId;

    @Column(name = "ip_address", nullable = false, length = 45)
    private String ipAddress;

    @Column(name = "risk_score", nullable = false)
    private Integer riskScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false, length = 20)
    private RiskLevel riskLevel;

    @Column(name = "reasons_json", nullable = false, columnDefinition = "TEXT")
    private String reasonsJson;

    @Column(name = "recommendations_json", nullable = false, columnDefinition = "TEXT")
    private String recommendationsJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private AlertStatus status = AlertStatus.NEW;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
