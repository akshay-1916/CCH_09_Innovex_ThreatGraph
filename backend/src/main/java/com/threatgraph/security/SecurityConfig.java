package com.threatgraph.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService userDetailsService;

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::disable)) // For H2 console
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers("/actuator/health").permitAll()
                        
                        // SUPER_ADMIN Only: Manage users, rules, audit logs, upload
                        .requestMatchers("/api/users/**").hasRole("SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/rules/**").hasRole("SUPER_ADMIN")
                        .requestMatchers("/api/rules/**").hasAnyRole("SUPER_ADMIN", "SECURITY_ANALYST")
                        .requestMatchers("/api/audit-logs/**").hasRole("SUPER_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/events/upload").hasRole("SUPER_ADMIN")

                        // ANALYST & SUPER_ADMIN: Alert status changes, event edits, simulation, graph
                        .requestMatchers(HttpMethod.PATCH, "/api/alerts/**").hasAnyRole("SUPER_ADMIN", "SECURITY_ANALYST")
                        .requestMatchers(HttpMethod.PUT, "/api/events/**").hasAnyRole("SUPER_ADMIN", "SECURITY_ANALYST")
                        .requestMatchers("/api/events/simulate").hasAnyRole("SUPER_ADMIN", "SECURITY_ANALYST")
                        .requestMatchers("/api/threat-graph").hasAnyRole("SUPER_ADMIN", "SECURITY_ANALYST", "ORG_MANAGER")

                        // Read-only dashboards and reports
                        .requestMatchers("/api/dashboard/**").hasAnyRole("SUPER_ADMIN", "SECURITY_ANALYST", "ORG_MANAGER")
                        .requestMatchers("/api/reports/**").hasAnyRole("SUPER_ADMIN", "SECURITY_ANALYST", "ORG_MANAGER")

                        // Events & Alerts viewing
                        .requestMatchers(HttpMethod.GET, "/api/events/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/alerts/**").authenticated()

                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
