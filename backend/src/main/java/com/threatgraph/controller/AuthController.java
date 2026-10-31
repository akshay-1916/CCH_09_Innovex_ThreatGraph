package com.threatgraph.controller;

import com.threatgraph.dto.AuthResponse;
import com.threatgraph.dto.LoginRequest;
import com.threatgraph.dto.UserDto;
import com.threatgraph.model.AuditLog;
import com.threatgraph.model.User;
import com.threatgraph.model.UserProfile;
import com.threatgraph.repository.AuditLogRepository;
import com.threatgraph.repository.UserProfileRepository;
import com.threatgraph.repository.UserRepository;
import com.threatgraph.security.JwtTokenProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final AuditLogRepository auditLogRepository;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        User user = userRepository.findByUsername(loginRequest.getUsername())
                .or(() -> userRepository.findByEmail(loginRequest.getUsername()))
                .orElseThrow();

        // Audit log recording
        auditLogRepository.save(AuditLog.builder()
                .id("AUD-" + UUID.randomUUID().toString().substring(0, 8))
                .actor(user.getUsername())
                .action("USER_LOGIN")
                .details("Successful authentication with role: " + user.getRole().name())
                .createdAt(LocalDateTime.now())
                .build());

        AuthResponse response = AuthResponse.builder()
                .token(jwt)
                .tokenType("Bearer")
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetails userDetails)) {
            return ResponseEntity.status(401).build();
        }

        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow();

        UserProfile profile = profileRepository.findByUserId(user.getId()).orElse(null);

        UserDto userDto = UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .normalStartHour(profile != null ? profile.getNormalStartHour() : 9)
                .normalEndHour(profile != null ? profile.getNormalEndHour() : 18)
                .knownIps(profile != null ? profile.getKnownIps() : "")
                .usualLocations(profile != null ? profile.getUsualLocations() : "")
                .knownDevices(profile != null ? profile.getKnownDevices() : "")
                .build();

        return ResponseEntity.ok(userDto);
    }
}
