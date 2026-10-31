package com.threatgraph.repository;

import com.threatgraph.model.AlertStatus;
import com.threatgraph.model.RiskLevel;
import com.threatgraph.model.ThreatAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ThreatAlertRepository extends JpaRepository<ThreatAlert, String> {
    Optional<ThreatAlert> findByAlertCode(String alertCode);
    Optional<ThreatAlert> findByEventId(String eventId);
    List<ThreatAlert> findByUserId(String userId);
    List<ThreatAlert> findByStatus(AlertStatus status);
    List<ThreatAlert> findByRiskLevel(RiskLevel riskLevel);
}
