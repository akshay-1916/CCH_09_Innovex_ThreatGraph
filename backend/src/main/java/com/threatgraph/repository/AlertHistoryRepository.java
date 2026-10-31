package com.threatgraph.repository;

import com.threatgraph.model.AlertHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertHistoryRepository extends JpaRepository<AlertHistory, String> {
    List<AlertHistory> findByAlertIdOrderByChangedAtDesc(String alertId);
}
