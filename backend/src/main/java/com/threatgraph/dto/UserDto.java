package com.threatgraph.dto;

import com.threatgraph.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private String id;
    private String username;
    private String email;
    private Role role;
    private Boolean active;
    private LocalDateTime createdAt;
    private Integer normalStartHour;
    private Integer normalEndHour;
    private String knownIps;
    private String usualLocations;
    private String knownDevices;
}
