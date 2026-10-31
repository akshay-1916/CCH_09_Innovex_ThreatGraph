package com.threatgraph.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "detection_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DetectionRule {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "rule_key", nullable = false, unique = true, length = 100)
    private String ruleKey; // e.g. MULTIPLE_FAILED_ATTEMPTS

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer points; // Default points, e.g. 30, 20, 15

    @Column
    private Integer threshold; // e.g. 5 for failed attempts

    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;
}
