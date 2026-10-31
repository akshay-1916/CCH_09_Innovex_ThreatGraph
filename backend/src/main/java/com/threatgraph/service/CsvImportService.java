package com.threatgraph.service;

import com.opencsv.CSVReader;
import com.threatgraph.model.LoginEvent;
import com.threatgraph.repository.LoginEventRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class CsvImportService {

    private final LoginEventRepository eventRepository;
    private final RiskScoringEngine scoringEngine;

    private static final Pattern IPV4_PATTERN = Pattern.compile(
            "^((25[0-5]|(2[0-4]|1\\d|[1-9]|)\\d)\\.?\\b){4}$"
    );

    @Data
    @Builder
    public static class RowValidationError {
        private int rowNumber;
        private String rawLine;
        private String reason;
    }

    @Data
    @Builder
    public static class CsvImportSummary {
        private int totalProcessed;
        private int validImported;
        private int invalidCount;
        private int alertsGenerated;
        private List<RowValidationError> errors;
        private List<LoginEvent> importedEvents;
    }

    public CsvImportSummary processCsvStream(InputStream inputStream) {
        List<RowValidationError> errors = new ArrayList<>();
        List<LoginEvent> validEvents = new ArrayList<>();
        int rowNumber = 1; // 1 is header
        int alertsCount = 0;

        try (CSVReader reader = new CSVReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String[] header = reader.readNext();
            if (header == null) {
                return CsvImportSummary.builder()
                        .totalProcessed(0)
                        .validImported(0)
                        .invalidCount(0)
                        .alertsGenerated(0)
                        .errors(Collections.singletonList(RowValidationError.builder()
                                .rowNumber(0)
                                .rawLine("")
                                .reason("Uploaded CSV is empty")
                                .build()))
                        .importedEvents(Collections.emptyList())
                        .build();
            }

            String[] line;
            while ((line = reader.readNext()) != null) {
                rowNumber++;
                if (line.length == 0 || (line.length == 1 && line[0].trim().isEmpty())) {
                    continue; // skip blank lines
                }

                if (line.length < 5) {
                    errors.add(RowValidationError.builder()
                            .rowNumber(rowNumber)
                            .rawLine(String.join(",", line))
                            .reason(String.format("Insufficient columns. Expected at least 5 (userId,ip,timestamp,loginSuccess,failedAttempts), found %d", line.length))
                            .build());
                    continue;
                }

                String userId = line[0].trim();
                String ipAddress = line[1].trim();
                String timestampStr = line[2].trim();
                String loginSuccessStr = line[3].trim();
                String failedAttemptsStr = line[4].trim();
                String location = line.length > 5 ? line[5].trim() : "Unknown";
                String deviceId = line.length > 6 ? line[6].trim() : "Unknown-Device";

                // Validations
                if (userId.isEmpty()) {
                    errors.add(RowValidationError.builder().rowNumber(rowNumber).rawLine(String.join(",", line)).reason("Missing user ID").build());
                    continue;
                }

                if (!IPV4_PATTERN.matcher(ipAddress).matches()) {
                    errors.add(RowValidationError.builder().rowNumber(rowNumber).rawLine(String.join(",", line)).reason("Invalid IPv4 address format: " + ipAddress).build());
                    continue;
                }

                LocalDateTime timestamp;
                try {
                    timestamp = parseTimestamp(timestampStr);
                } catch (Exception e) {
                    errors.add(RowValidationError.builder().rowNumber(rowNumber).rawLine(String.join(",", line)).reason("Unparseable timestamp: " + timestampStr + " (Expected ISO-8601)").build());
                    continue;
                }

                boolean loginSuccess;
                if (loginSuccessStr.equalsIgnoreCase("true") || loginSuccessStr.equalsIgnoreCase("success") || loginSuccessStr.equals("1")) {
                    loginSuccess = true;
                } else if (loginSuccessStr.equalsIgnoreCase("false") || loginSuccessStr.equalsIgnoreCase("failed") || loginSuccessStr.equals("0")) {
                    loginSuccess = false;
                } else {
                    errors.add(RowValidationError.builder().rowNumber(rowNumber).rawLine(String.join(",", line)).reason("Invalid loginResult value: " + loginSuccessStr + " (Expected TRUE/FALSE or SUCCESS/FAILED)").build());
                    continue;
                }

                int failedAttempts;
                try {
                    failedAttempts = Integer.parseInt(failedAttemptsStr);
                    if (failedAttempts < 0) throw new NumberFormatException("Negative attempts");
                } catch (NumberFormatException e) {
                    errors.add(RowValidationError.builder().rowNumber(rowNumber).rawLine(String.join(",", line)).reason("Invalid failedAttempts count: " + failedAttemptsStr + " (Must be non-negative integer)").build());
                    continue;
                }

                // Construct and analyze event
                LoginEvent event = LoginEvent.builder()
                        .id("EVT-" + UUID.randomUUID().toString().substring(0, 8))
                        .userId(userId)
                        .ipAddress(ipAddress)
                        .timestamp(timestamp)
                        .loginSuccess(loginSuccess)
                        .failedAttempts(failedAttempts)
                        .location(location)
                        .deviceId(deviceId)
                        .build();

                RiskScoringEngine.RiskAssessment assessment = scoringEngine.assessEvent(event);
                eventRepository.save(event);
                validEvents.add(event);

                if (assessment.isSuspicious()) {
                    alertsCount++;
                }
            }
        } catch (Exception e) {
            log.error("CSV import failure", e);
            errors.add(RowValidationError.builder().rowNumber(rowNumber).rawLine("").reason("Malformed CSV structure: " + e.getMessage()).build());
        }

        return CsvImportSummary.builder()
                .totalProcessed(validEvents.size() + errors.size())
                .validImported(validEvents.size())
                .invalidCount(errors.size())
                .alertsGenerated(alertsCount)
                .errors(errors)
                .importedEvents(validEvents)
                .build();
    }

    private LocalDateTime parseTimestamp(String str) {
        try {
            return LocalDateTime.parse(str, DateTimeFormatter.ISO_DATE_TIME);
        } catch (DateTimeParseException e) {
            return LocalDateTime.parse(str, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        }
    }
}
