package com.threatgraph.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.threatgraph.model.AlertStatus;
import com.threatgraph.model.LoginEvent;
import com.threatgraph.model.RiskLevel;
import com.threatgraph.model.ThreatAlert;
import com.threatgraph.repository.ThreatAlertRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class RiskScoringEngine {

    private final ThreatDetectionEngine detectionEngine;
    private final ThreatAlertRepository alertRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Data
    @Builder
    public static class RiskAssessment {
        private int riskScore;
        private RiskLevel riskLevel;
        private boolean suspicious;
        private List<ThreatDetectionEngine.DetectionResult> triggeredRules;
        private List<String> reasons;
        private List<String> recommendations;
        private ThreatAlert alert;
    }

    /**
     * Calculates deterministic risk score (0-100 capped), assigns risk category,
     * and produces human-readable explainable alerts when score >= 30.
     */
    public RiskAssessment assessEvent(LoginEvent event) {
        List<ThreatDetectionEngine.DetectionResult> triggered = detectionEngine.evaluateEvent(event);

        int rawScore = 0;
        Set<String> evaluatedRuleKeys = new HashSet<>();
        List<String> reasons = new ArrayList<>();
        List<String> recommendations = new ArrayList<>();

        for (ThreatDetectionEngine.DetectionResult res : triggered) {
            // Count each triggered rule exactly once
            if (!evaluatedRuleKeys.contains(res.getRuleKey())) {
                rawScore += res.getPoints();
                evaluatedRuleKeys.add(res.getRuleKey());
            }
            reasons.add(String.format("%s (+%d pts): %s", res.getRuleName(), res.getPoints(), res.getReason()));
            if (!recommendations.contains(res.getRecommendation())) {
                recommendations.add(res.getRecommendation());
            }
        }

        // Cap at 100
        int finalScore = Math.min(rawScore, 100);
        RiskLevel level = calculateRiskLevel(finalScore);
        boolean isSuspicious = finalScore >= 30;

        // Update event fields
        event.setRiskScore(finalScore);
        event.setRiskLevel(level);
        event.setSuspicious(isSuspicious);

        ThreatAlert alert = null;
        if (isSuspicious) {
            alert = createOrUpdateAlert(event, finalScore, level, reasons, recommendations);
        }

        return RiskAssessment.builder()
                .riskScore(finalScore)
                .riskLevel(level)
                .suspicious(isSuspicious)
                .triggeredRules(triggered)
                .reasons(reasons)
                .recommendations(recommendations)
                .alert(alert)
                .build();
    }

    public static RiskLevel calculateRiskLevel(int score) {
        if (score >= 80) return RiskLevel.CRITICAL;
        if (score >= 60) return RiskLevel.HIGH;
        if (score >= 30) return RiskLevel.MEDIUM;
        return RiskLevel.LOW;
    }

    private ThreatAlert createOrUpdateAlert(LoginEvent event, int score, RiskLevel level,
                                            List<String> reasons, List<String> recommendations) {
        try {
            String reasonsJson = objectMapper.writeValueAsString(reasons);
            String recommendationsJson = objectMapper.writeValueAsString(recommendations);

            Optional<ThreatAlert> existing = alertRepository.findByEventId(event.getId());
            ThreatAlert alert;
            if (existing.isPresent()) {
                alert = existing.get();
                alert.setRiskScore(score);
                alert.setRiskLevel(level);
                alert.setReasonsJson(reasonsJson);
                alert.setRecommendationsJson(recommendationsJson);
                alert.setUpdatedAt(LocalDateTime.now());
            } else {
                String alertCode = "TG-" + (1000 + alertRepository.count() + 1);
                alert = ThreatAlert.builder()
                        .id("ALT-" + UUID.randomUUID().toString().substring(0, 8))
                        .alertCode(alertCode)
                        .eventId(event.getId())
                        .userId(event.getUserId())
                        .ipAddress(event.getIpAddress())
                        .riskScore(score)
                        .riskLevel(level)
                        .reasonsJson(reasonsJson)
                        .recommendationsJson(recommendationsJson)
                        .status(AlertStatus.NEW)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
            }
            return alertRepository.save(alert);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize alert reasons", e);
            return null;
        }
    }
}
