package com.threatgraph.service;

import com.threatgraph.model.DetectionRule;
import com.threatgraph.model.LoginEvent;
import com.threatgraph.model.UserProfile;
import com.threatgraph.repository.DetectionRuleRepository;
import com.threatgraph.repository.LoginEventRepository;
import com.threatgraph.repository.UserProfileRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ThreatDetectionEngine {

    private final DetectionRuleRepository ruleRepository;
    private final UserProfileRepository profileRepository;
    private final LoginEventRepository eventRepository;

    @Data
    @Builder
    public static class DetectionResult {
        private String ruleKey;
        private String ruleName;
        private int points;
        private String reason;
        private String recommendation;
    }

    /**
     * Deterministic, explainable evaluation of an event against user profile baselines
     * and historical network correlations. No machine learning or black-box logic is used.
     */
    public List<DetectionResult> evaluateEvent(LoginEvent event) {
        List<DetectionResult> triggered = new ArrayList<>();
        Map<String, DetectionRule> rules = new HashMap<>();
        for (DetectionRule r : ruleRepository.findAll()) {
            if (Boolean.TRUE.equals(r.getEnabled())) {
                rules.put(r.getRuleKey(), r);
            }
        }

        UserProfile profile = profileRepository.findByUserId(event.getUserId()).orElse(null);

        // Rule 1: MULTIPLE_FAILED_ATTEMPTS
        DetectionRule failedRule = rules.get("MULTIPLE_FAILED_ATTEMPTS");
        int failedThreshold = (failedRule != null && failedRule.getThreshold() != null) ? failedRule.getThreshold() : 5;
        int failedPoints = (failedRule != null) ? failedRule.getPoints() : 30;

        if (event.getFailedAttempts() != null && event.getFailedAttempts() >= failedThreshold) {
            triggered.add(DetectionResult.builder()
                    .ruleKey("MULTIPLE_FAILED_ATTEMPTS")
                    .ruleName("Multiple Failed Login Attempts")
                    .points(failedPoints)
                    .reason(String.format("Observed %d consecutive failed login attempts (exceeds safety threshold of %d)",
                            event.getFailedAttempts(), failedThreshold))
                    .recommendation("Audit source authentication logs for potential credential brute-forcing or credential stuffing.")
                    .build());
        }

        // Evaluate against stored UserProfile baselines
        if (profile != null) {
            // Rule 2: UNUSUAL_LOGIN_TIME
            DetectionRule timeRule = rules.get("UNUSUAL_LOGIN_TIME");
            int timePoints = (timeRule != null) ? timeRule.getPoints() : 15;
            int eventHour = event.getTimestamp().getHour();
            int startHour = profile.getNormalStartHour() != null ? profile.getNormalStartHour() : 9;
            int endHour = profile.getNormalEndHour() != null ? profile.getNormalEndHour() : 18;

            if (eventHour < startHour || eventHour >= endHour) {
                triggered.add(DetectionResult.builder()
                        .ruleKey("UNUSUAL_LOGIN_TIME")
                        .ruleName("Unusual Login Hours")
                        .points(timePoints)
                        .reason(String.format("Event occurred at %02d:00, outside user's established working profile (%02d:00 - %02d:00)",
                                eventHour, startHour, endHour))
                        .recommendation("Confirm with the user if out-of-hours authorization or scheduled batch activity was intended.")
                        .build());
            }

            // Rule 3: UNKNOWN_IP
            DetectionRule ipRule = rules.get("UNKNOWN_IP");
            int ipPoints = (ipRule != null) ? ipRule.getPoints() : 20;
            List<String> knownIps = parseCsvList(profile.getKnownIps());

            if (!knownIps.isEmpty() && !knownIps.contains(event.getIpAddress().trim())) {
                triggered.add(DetectionResult.builder()
                        .ruleKey("UNKNOWN_IP")
                        .ruleName("Unrecognized IP Address")
                        .points(ipPoints)
                        .reason(String.format("Origin IP '%s' is not registered in the user's historical IP whitelist (%s)",
                                event.getIpAddress(), String.join(", ", knownIps)))
                        .recommendation("Review network ASN/ISP routing and prompt user for out-of-band MFA verification if needed.")
                        .build());
            }

            // Rule 4: UNUSUAL_LOCATION
            DetectionRule locRule = rules.get("UNUSUAL_LOCATION");
            int locPoints = (locRule != null) ? locRule.getPoints() : 20;
            List<String> usualLocs = parseCsvList(profile.getUsualLocations());

            if (event.getLocation() != null && !usualLocs.isEmpty() && !containsIgnoreCase(usualLocs, event.getLocation().trim())) {
                triggered.add(DetectionResult.builder()
                        .ruleKey("UNUSUAL_LOCATION")
                        .ruleName("Anomalous Geographic Location")
                        .points(locPoints)
                        .reason(String.format("Access location '%s' differs from user's regular profile locations (%s)",
                                event.getLocation(), String.join(", ", usualLocs)))
                        .recommendation("Verify if the employee is in transit, using an external corporate VPN gateway, or remote proxy.")
                        .build());
            }
        }

        // Rule 5: SHARED_SUSPICIOUS_IP
        DetectionRule sharedRule = rules.get("SHARED_SUSPICIOUS_IP");
        int sharedThreshold = (sharedRule != null && sharedRule.getThreshold() != null) ? sharedRule.getThreshold() : 3;
        int sharedPoints = (sharedRule != null) ? sharedRule.getPoints() : 15;

        long distinctAccounts = eventRepository.countDistinctUsersWithSuspiciousOrFailedLoginsForIp(event.getIpAddress());
        // If current event is also failed or suspicious, ensure it counts
        if (!Boolean.TRUE.equals(event.getLoginSuccess()) || (event.getFailedAttempts() != null && event.getFailedAttempts() > 0)) {
            distinctAccounts = Math.max(distinctAccounts, 1);
        }

        if (distinctAccounts >= sharedThreshold) {
            triggered.add(DetectionResult.builder()
                    .ruleKey("SHARED_SUSPICIOUS_IP")
                    .ruleName("Shared Suspicious IP Correlated Across Accounts")
                    .points(sharedPoints)
                    .reason(String.format("IP '%s' correlates across %d distinct user accounts with failed or suspicious events (threshold: %d)",
                            event.getIpAddress(), distinctAccounts, sharedThreshold))
                    .recommendation("Investigate IP correlation on ThreatGraph canvas; correlation suggests horizontal reconnaissance.")
                    .build());
        }

        return triggered;
    }

    private List<String> parseCsvList(String str) {
        if (str == null || str.trim().isEmpty()) return Collections.emptyList();
        String[] parts = str.split(",");
        List<String> list = new ArrayList<>();
        for (String p : parts) {
            if (!p.trim().isEmpty()) list.add(p.trim());
        }
        return list;
    }

    private boolean containsIgnoreCase(List<String> list, String target) {
        for (String item : list) {
            if (item.equalsIgnoreCase(target)) return true;
        }
        return false;
    }
}
