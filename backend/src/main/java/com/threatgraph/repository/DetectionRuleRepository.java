package com.threatgraph.repository;

import com.threatgraph.model.DetectionRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DetectionRuleRepository extends JpaRepository<DetectionRule, String> {
    Optional<DetectionRule> findByRuleKey(String ruleKey);
}
