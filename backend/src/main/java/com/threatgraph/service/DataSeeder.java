package com.threatgraph.service;

import com.threatgraph.model.*;
import com.threatgraph.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final DetectionRuleRepository ruleRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already seeded. Skipping initial seeding.");
            return;
        }

        log.info("Starting ThreatGraph database seeding...");

        // 1. Seed Detection Rules
        seedDetectionRules();

        // 2. Seed 4 Core Demo Accounts
        seedDemoAccounts();

        // 3. Seed 20 synthetic user profiles (U101 - U120)
        seedSyntheticUsersAndProfiles();

        // 4. Seed initial audit log
        auditLogRepository.save(AuditLog.builder()
                .id("AUD-INIT-001")
                .actor("SYSTEM")
                .action("SYSTEM_INITIALIZATION")
                .details("ThreatGraph schema initialized with 20 synthetic user profiles and 5 detection rules.")
                .createdAt(LocalDateTime.now().minusDays(1))
                .build());

        log.info("ThreatGraph seeding completed successfully!");
    }

    private void seedDetectionRules() {
        List<DetectionRule> rules = Arrays.asList(
                DetectionRule.builder()
                        .id("RULE-1")
                        .ruleKey("MULTIPLE_FAILED_ATTEMPTS")
                        .name("Multiple Failed Login Attempts")
                        .description("Flags repeated failed authentication attempts exceeding the safety threshold.")
                        .points(30)
                        .threshold(5)
                        .enabled(true)
                        .build(),
                DetectionRule.builder()
                        .id("RULE-2")
                        .ruleKey("UNUSUAL_LOGIN_TIME")
                        .name("Unusual Login Hours")
                        .description("Detects logins occurring outside the user's established business hours profile.")
                        .points(15)
                        .threshold(0) // Evaluated against user's normalStartHour & normalEndHour
                        .enabled(true)
                        .build(),
                DetectionRule.builder()
                        .id("RULE-3")
                        .ruleKey("UNKNOWN_IP")
                        .name("Unrecognized IP Address")
                        .description("Identifies access attempts from IP addresses not present in the user's historical whitelist.")
                        .points(20)
                        .threshold(0)
                        .enabled(true)
                        .build(),
                DetectionRule.builder()
                        .id("RULE-4")
                        .ruleKey("UNUSUAL_LOCATION")
                        .name("Anomalous Geographic Location")
                        .description("Detects logins originating from regions or cities unfamiliar to the user profile.")
                        .points(20)
                        .threshold(0)
                        .enabled(true)
                        .build(),
                DetectionRule.builder()
                        .id("RULE-5")
                        .ruleKey("SHARED_SUSPICIOUS_IP")
                        .name("Shared Suspicious IP Correlated Across Accounts")
                        .description("Correlates single IP addresses observed targeting 3 or more distinct accounts with failures.")
                        .points(15)
                        .threshold(3)
                        .enabled(true)
                        .build()
        );
        ruleRepository.saveAll(rules);
    }

    private void seedDemoAccounts() {
        createAccount("U001", "superadmin", "admin@threatgraph.io", "Admin@123", Role.SUPER_ADMIN,
                9, 18, "192.168.1.10,10.0.1.15", "Pune, India", "Corp-Admin-MacBook");

        createAccount("U002", "analyst_raj", "analyst@threatgraph.io", "Analyst@123", Role.SECURITY_ANALYST,
                8, 19, "192.168.1.20,10.0.1.25", "Pune, India", "SOC-Station-04");

        createAccount("U003", "manager_sarah", "manager@threatgraph.io", "Manager@123", Role.ORG_MANAGER,
                9, 17, "192.168.1.30,10.0.1.35", "Mumbai, India", "Dell-Latitude-Exec");

        createAccount("U004", "employee_alex", "alex@threatgraph.io", "Employee@123", Role.EMPLOYEE,
                9, 18, "192.168.1.40,10.0.1.45", "Bengaluru, India", "HP-EliteBook-Eng");
    }

    private void seedSyntheticUsersAndProfiles() {
        String[] names = {
                "Vikram Malhotra", "Ananya Sharma", "Karan Mehta", "Pooja Patel", "Rohan Verma",
                "Sneha Rao", "Aditya Nair", "Divya Joshi", "Arjun Kulkarni", "Meera Iyer",
                "Siddharth Gupta", "Tanvi Deshmukh", "Nikhil Sen", "Ritu Bhatia", "Aman Jain",
                "Kavita Reddy", "Varun Das", "Priya Nair", "Manish Kapoor", "Neha Singhania"
        };
        String[] cities = {
                "Pune, India", "Bengaluru, India", "Mumbai, India", "Hyderabad, India", "Delhi, India"
        };

        for (int i = 1; i <= 20; i++) {
            String uid = String.format("U%03d", 100 + i);
            String username = "user_" + uid.toLowerCase();
            String email = username + "@threatgraph-corp.org";
            String city = cities[i % cities.length];
            String knownIp1 = "10.100." + (i % 5) + "." + (10 + i);
            String knownIp2 = "172.16.2." + (20 + i);

            createAccount(uid, username, email, "Password@123", Role.EMPLOYEE,
                    9, 18, knownIp1 + "," + knownIp2, city, "Device-" + uid + "-Corp");
        }
    }

    private void createAccount(String id, String username, String email, String rawPassword, Role role,
                               int startHour, int endHour, String ips, String locs, String devices) {
        User user = User.builder()
                .id(id)
                .username(username)
                .email(email)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(role)
                .active(true)
                .createdAt(LocalDateTime.now().minusDays(30))
                .build();
        userRepository.save(user);

        UserProfile profile = UserProfile.builder()
                .userId(id)
                .normalStartHour(startHour)
                .normalEndHour(endHour)
                .knownIps(ips)
                .usualLocations(locs)
                .knownDevices(devices)
                .build();
        userProfileRepository.save(profile);
    }
}
