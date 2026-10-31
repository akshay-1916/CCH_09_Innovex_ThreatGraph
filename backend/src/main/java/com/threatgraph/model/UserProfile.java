package com.threatgraph.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {

    @Id
    @Column(name = "user_id", length = 64)
    private String userId;

    @Column(name = "normal_start_hour", nullable = false)
    @Builder.Default
    private Integer normalStartHour = 9;

    @Column(name = "normal_end_hour", nullable = false)
    @Builder.Default
    private Integer normalEndHour = 18;

    @Column(name = "known_ips", columnDefinition = "TEXT")
    private String knownIps;

    @Column(name = "usual_locations", columnDefinition = "TEXT")
    private String usualLocations;

    @Column(name = "known_devices", columnDefinition = "TEXT")
    private String knownDevices;
}
