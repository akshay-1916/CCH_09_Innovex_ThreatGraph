package com.threatgraph.controller;

import com.threatgraph.model.AuditLog;
import com.threatgraph.model.LoginEvent;
import com.threatgraph.repository.AuditLogRepository;
import com.threatgraph.repository.LoginEventRepository;
import com.threatgraph.service.CsvImportService;
import com.threatgraph.service.RiskScoringEngine;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final LoginEventRepository eventRepository;
    private final RiskScoringEngine scoringEngine;
    private final CsvImportService csvImportService;
    private final AuditLogRepository auditLogRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getEvents(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String ipAddress,
            @RequestParam(required = false) Boolean suspicious,
            @RequestParam(required = false) Boolean loginSuccess,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {

        Page<LoginEvent> eventPage = eventRepository.filterEvents(
                userId, ipAddress, suspicious, loginSuccess,
                PageRequest.of(page, size, Sort.by("timestamp").descending())
        );

        Map<String, Object> response = new HashMap<>();
        response.put("events", eventPage.getContent());
        response.put("currentPage", eventPage.getNumber());
        response.put("totalItems", eventPage.getTotalElements());
        response.put("totalPages", eventPage.getTotalPages());

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createEvent(@RequestBody LoginEvent eventPayload,
                                                           Authentication auth) {
        if (eventPayload.getId() == null || eventPayload.getId().trim().isEmpty()) {
            eventPayload.setId("EVT-" + UUID.randomUUID().toString().substring(0, 8));
        }
        if (eventPayload.getTimestamp() == null) {
            eventPayload.setTimestamp(LocalDateTime.now());
        }

        RiskScoringEngine.RiskAssessment assessment = scoringEngine.assessEvent(eventPayload);
        LoginEvent saved = eventRepository.save(eventPayload);

        auditLogRepository.save(AuditLog.builder()
                .id("AUD-" + UUID.randomUUID().toString().substring(0, 8))
                .actor(auth != null ? auth.getName() : "ANONYMOUS")
                .action("EVENT_CREATE")
                .details(String.format("Manual event created for user '%s', risk score: %d (%s)",
                        saved.getUserId(), saved.getRiskScore(), saved.getRiskLevel()))
                .createdAt(LocalDateTime.now())
                .build());

        Map<String, Object> res = new HashMap<>();
        res.put("event", saved);
        res.put("assessment", assessment);
        return ResponseEntity.ok(res);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateEvent(@PathVariable String id,
                                                           @RequestBody LoginEvent updateData,
                                                           Authentication auth) {
        LoginEvent existing = eventRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Event not found with ID: " + id));

        int oldScore = existing.getRiskScore();

        existing.setUserId(updateData.getUserId());
        existing.setIpAddress(updateData.getIpAddress());
        existing.setTimestamp(updateData.getTimestamp());
        existing.setLoginSuccess(updateData.getLoginSuccess());
        existing.setFailedAttempts(updateData.getFailedAttempts());
        existing.setLocation(updateData.getLocation());
        existing.setDeviceId(updateData.getDeviceId());

        // Re-analyze event through Explainable Risk Engine
        RiskScoringEngine.RiskAssessment assessment = scoringEngine.assessEvent(existing);
        LoginEvent saved = eventRepository.save(existing);

        auditLogRepository.save(AuditLog.builder()
                .id("AUD-" + UUID.randomUUID().toString().substring(0, 8))
                .actor(auth != null ? auth.getName() : "ANONYMOUS")
                .action("EVENT_REANALYZED")
                .details(String.format("Event '%s' modified & re-evaluated: score shifted %d -> %d (%s)",
                        id, oldScore, saved.getRiskScore(), saved.getRiskLevel()))
                .createdAt(LocalDateTime.now())
                .build());

        Map<String, Object> res = new HashMap<>();
        res.put("event", saved);
        res.put("assessment", assessment);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/upload")
    public ResponseEntity<CsvImportService.CsvImportSummary> uploadCsv(
            @RequestParam("file") MultipartFile file,
            Authentication auth) throws IOException {

        CsvImportService.CsvImportSummary summary = csvImportService.processCsvStream(file.getInputStream());

        auditLogRepository.save(AuditLog.builder()
                .id("AUD-" + UUID.randomUUID().toString().substring(0, 8))
                .actor(auth != null ? auth.getName() : "SUPER_ADMIN")
                .action("CSV_BATCH_UPLOAD")
                .details(String.format("Uploaded CSV '%s'. Total: %d, Valid: %d, Invalid: %d, Alerts Generated: %d",
                        file.getOriginalFilename(), summary.getTotalProcessed(), summary.getValidImported(),
                        summary.getInvalidCount(), summary.getAlertsGenerated()))
                .createdAt(LocalDateTime.now())
                .build());

        return ResponseEntity.ok(summary);
    }

    @PostMapping("/analyze")
    public ResponseEntity<RiskScoringEngine.RiskAssessment> analyzeOnTheFly(@RequestBody LoginEvent event) {
        if (event.getTimestamp() == null) event.setTimestamp(LocalDateTime.now());
        RiskScoringEngine.RiskAssessment assessment = scoringEngine.assessEvent(event);
        return ResponseEntity.ok(assessment);
    }

    @GetMapping("/sample-csv")
    public ResponseEntity<byte[]> downloadSampleCsv() {
        String csvContent = "userId,ipAddress,timestamp,loginSuccess,failedAttempts,location,deviceId\n" +
                "U101,10.100.1.11,2026-10-31T09:15:00,SUCCESS,0,Pune, India,Corp-Workstation-U101\n" +
                "U101,45.23.11.90,2026-10-31T03:30:00,FAILED,12,Frankfurt, Germany,Unknown-Attacker-Rig\n" +
                "U102,45.23.11.90,2026-10-31T03:35:00,FAILED,8,Frankfurt, Germany,Unknown-Attacker-Rig\n" +
                "U104,45.23.11.90,2026-10-31T03:40:00,FAILED,6,Frankfurt, Germany,Unknown-Attacker-Rig\n" +
                "U103,185.220.101.5,2026-10-31T02:10:00,FAILED,9,Moscow, Russia,Tor-Exit-Node-01\n" +
                "U105,10.100.0.15,2026-10-31T11:45:00,SUCCESS,0,Pune, India,Device-U105-Corp\n" +
                "INVALID_ROW,999.999.999.999,invalid-date,UNKNOWN,-5,Nowhere,Bad-Device\n" + // Invalid row demonstration
                ",10.100.1.11,2026-10-31T12:00:00,SUCCESS,0,Pune, India,Corp-01\n"; // Missing userId demonstration

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"threatgraph_sample_events.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvContent.getBytes(StandardCharsets.UTF_8));
    }
}
