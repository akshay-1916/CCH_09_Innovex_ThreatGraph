package com.threatgraph.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "alert_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertHistory {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "alert_id", nullable = false, length = 64)
    private String alertId;

    @Enumerated(EnumType.STRING)
    @Column(name = "old_status", nullable = false, length = 30)
    private AlertStatus oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 30)
    private AlertStatus newStatus;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "changed_by", nullable = false, length = 100)
    private String changedBy;

    @Column(name = "changed_at", nullable = false)
    @Builder.Default
    private LocalDateTime changedAt = LocalDateTime.now();
}
