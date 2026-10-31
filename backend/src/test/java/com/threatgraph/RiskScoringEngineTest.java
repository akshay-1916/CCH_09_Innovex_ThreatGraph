package com.threatgraph;

import com.threatgraph.model.DetectionRule;
import com.threatgraph.model.LoginEvent;
import com.threatgraph.model.RiskLevel;
import com.threatgraph.model.UserProfile;
import com.threatgraph.repository.DetectionRuleRepository;
import com.threatgraph.repository.LoginEventRepository;
import com.threatgraph.repository.ThreatAlertRepository;
import com.threatgraph.repository.UserProfileRepository;
import com.threatgraph.service.RiskScoringEngine;
import com.threatgraph.service.ThreatDetectionEngine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

public class RiskScoringEngineTest {

    private DetectionRuleRepository ruleRepository;
    private UserProfileRepository profileRepository;
    private LoginEventRepository eventRepository;
    private ThreatAlertRepository alertRepository;
    private ThreatDetectionEngine detectionEngine;
    private RiskScoringEngine scoringEngine;

    @BeforeEach
    void setUp() {
        ruleRepository = Mockito.mock(DetectionRuleRepository.class);
        profileRepository = Mockito.mock(UserProfileRepository.class);
        eventRepository = Mockito.mock(LoginEventRepository.class);
        alertRepository = Mockito.mock(ThreatAlertRepository.class);

        // Standard detection rules
        List<DetectionRule> rules = Arrays.asList(
                DetectionRule.builder().ruleKey("MULTIPLE_FAILED_ATTEMPTS").name("Multiple Failed Attempts").points(30).threshold(5).enabled(true).build(),
                DetectionRule.builder().ruleKey("UNUSUAL_LOGIN_TIME").name("Unusual Login Hours").points(15).threshold(0).enabled(true).build(),
                DetectionRule.builder().ruleKey("UNKNOWN_IP").name("Unrecognized IP").points(20).threshold(0).enabled(true).build(),
                DetectionRule.builder().ruleKey("UNUSUAL_LOCATION").name("Anomalous Location").points(20).threshold(0).enabled(true).build(),
                DetectionRule.builder().ruleKey("SHARED_SUSPICIOUS_IP").name("Shared Suspicious IP").points(15).threshold(3).enabled(true).build()
        );
        when(ruleRepository.findAll()).thenReturn(rules);

        // Baseline profile for U101
        UserProfile profile = UserProfile.builder()
                .userId("U101")
                .normalStartHour(9)
                .normalEndHour(18)
                .knownIps("192.168.1.10,10.0.1.15")
                .usualLocations("Pune, India")
                .knownDevices("Corp-MacBook-01")
                .build();
        when(profileRepository.findByUserId("U101")).thenReturn(Optional.of(profile));

        detectionEngine = new ThreatDetectionEngine(ruleRepository, profileRepository, eventRepository);
        scoringEngine = new RiskScoringEngine(detectionEngine, alertRepository);
    }

    @Test
    @DisplayName("Case 1: Normal login baseline should produce Score 0, LOW category, and NO alert")
    void testNormalLoginBaseline() {
        LoginEvent normalEvent = LoginEvent.builder()
                .id("EVT-NORM")
                .userId("U101")
                .ipAddress("192.168.1.10")
                .timestamp(LocalDateTime.of(2026, 10, 31, 10, 30)) // 10:30 AM (normal hours)
                .loginSuccess(true)
                .failedAttempts(0)
                .location("Pune, India")
                .deviceId("Corp-MacBook-01")
                .build();

        RiskScoringEngine.RiskAssessment result = scoringEngine.assessEvent(normalEvent);

        assertEquals(0, result.getRiskScore());
        assertEquals(RiskLevel.LOW, result.getRiskLevel());
        assertFalse(result.isSuspicious());
        assertTrue(result.getTriggeredRules().isEmpty());
    }

    @Test
    @DisplayName("Case 2: Minor single anomaly should stay below Alert Threshold (Score < 30, LOW category)")
    void testLowRiskBoundary() {
        // Only Unusual Login Time (15 pts)
        LoginEvent offHoursEvent = LoginEvent.builder()
                .id("EVT-OFFHOURS")
                .userId("U101")
                .ipAddress("192.168.1.10") // Known IP
                .timestamp(LocalDateTime.of(2026, 10, 31, 21, 0)) // 9:00 PM (off hours)
                .loginSuccess(true)
                .failedAttempts(0)
                .location("Pune, India")
                .build();

        RiskScoringEngine.RiskAssessment result = scoringEngine.assessEvent(offHoursEvent);

        assertEquals(15, result.getRiskScore());
        assertEquals(RiskLevel.LOW, result.getRiskLevel());
        assertFalse(result.isSuspicious(), "Score 15 should not raise an alert");
    }

    @Test
    @DisplayName("Case 3: Alert Creation Boundary (Score 30 exactly, category MEDIUM, alert triggered)")
    void testMediumRiskBoundaryAndAlertCreation() {
        // Failed attempts >= 5 triggers MULTIPLE_FAILED_ATTEMPTS (30 pts)
        LoginEvent bruteEvent = LoginEvent.builder()
                .id("EVT-BRUTE-1")
                .userId("U101")
                .ipAddress("192.168.1.10")
                .timestamp(LocalDateTime.of(2026, 10, 31, 14, 0)) // Normal hours
                .loginSuccess(false)
                .failedAttempts(5) // Exactly threshold
                .location("Pune, India")
                .build();

        RiskScoringEngine.RiskAssessment result = scoringEngine.assessEvent(bruteEvent);

        assertEquals(30, result.getRiskScore());
        assertEquals(RiskLevel.MEDIUM, result.getRiskLevel());
        assertTrue(result.isSuspicious(), "Score >= 30 must mark event as suspicious and create alert");
    }

    @Test
    @DisplayName("Case 4: High Risk Boundary (Score 60–79, category HIGH)")
    void testHighRiskBoundary() {
        // Failed attempts (30 pts) + Unknown IP (20 pts) + Unusual time (15 pts) = 65 pts
        LoginEvent highEvent = LoginEvent.builder()
                .id("EVT-HIGH")
                .userId("U101")
                .ipAddress("203.0.113.88") // Unknown IP
                .timestamp(LocalDateTime.of(2026, 10, 31, 23, 15)) // Off hours
                .loginSuccess(false)
                .failedAttempts(6)
                .location("Pune, India")
                .build();

        RiskScoringEngine.RiskAssessment result = scoringEngine.assessEvent(highEvent);

        assertEquals(65, result.getRiskScore());
        assertEquals(RiskLevel.HIGH, result.getRiskLevel());
        assertTrue(result.isSuspicious());
    }

    @Test
    @DisplayName("Case 5: Critical Risk Boundary (Score 80–100, category CRITICAL)")
    void testCriticalRiskBoundary() {
        // Failed attempts (30) + Unknown IP (20) + Unusual Location (20) + Unusual time (15) = 85 pts
        LoginEvent critEvent = LoginEvent.builder()
                .id("EVT-CRIT")
                .userId("U101")
                .ipAddress("45.23.11.90") // Unknown IP
                .timestamp(LocalDateTime.of(2026, 10, 31, 3, 30)) // 3:30 AM
                .loginSuccess(false)
                .failedAttempts(12)
                .location("Frankfurt, Germany") // Unusual Location
                .build();

        RiskScoringEngine.RiskAssessment result = scoringEngine.assessEvent(critEvent);

        assertEquals(85, result.getRiskScore());
        assertEquals(RiskLevel.CRITICAL, result.getRiskLevel());
        assertTrue(result.isSuspicious());
        assertEquals(4, result.getTriggeredRules().size());
    }

    @Test
    @DisplayName("Case 6: Score Capping at 100 (Sum of all rules 30+15+20+20+15 = 100 strictly capped)")
    void testScoreCapAt100() {
        // Simulate Shared IP correlation >= 3
        when(eventRepository.countDistinctUsersWithSuspiciousOrFailedLoginsForIp("45.23.11.90")).thenReturn(4L);

        // Trigger ALL 5 rules:
        // Multiple failed (30) + Unusual time (15) + Unknown IP (20) + Unusual location (20) + Shared IP (15) = 100
        LoginEvent maxEvent = LoginEvent.builder()
                .id("EVT-MAX")
                .userId("U101")
                .ipAddress("45.23.11.90")
                .timestamp(LocalDateTime.of(2026, 10, 31, 3, 0))
                .loginSuccess(false)
                .failedAttempts(15)
                .location("Frankfurt, Germany")
                .build();

        RiskScoringEngine.RiskAssessment result = scoringEngine.assessEvent(maxEvent);

        assertEquals(100, result.getRiskScore(), "Score must be capped at 100");
        assertEquals(RiskLevel.CRITICAL, result.getRiskLevel());
        assertTrue(result.isSuspicious());
    }

    @Test
    @DisplayName("Case 7: Shared Suspicious IP Correlation Rule Evaluation")
    void testSharedSuspiciousIpCorrelation() {
        when(eventRepository.countDistinctUsersWithSuspiciousOrFailedLoginsForIp("198.51.100.77")).thenReturn(3L);

        LoginEvent sharedEvent = LoginEvent.builder()
                .id("EVT-SHARED")
                .userId("U101")
                .ipAddress("198.51.100.77")
                .timestamp(LocalDateTime.of(2026, 10, 31, 11, 0)) // Normal hours
                .loginSuccess(false)
                .failedAttempts(2) // Below failed threshold
                .location("Pune, India")
                .build();

        RiskScoringEngine.RiskAssessment result = scoringEngine.assessEvent(sharedEvent);

        // Unknown IP (20) + Shared IP (15) = 35
        assertEquals(35, result.getRiskScore());
        assertEquals(RiskLevel.MEDIUM, result.getRiskLevel());
        assertTrue(result.getReasons().stream().anyMatch(r -> r.contains("Shared Suspicious IP")));
    }
}
