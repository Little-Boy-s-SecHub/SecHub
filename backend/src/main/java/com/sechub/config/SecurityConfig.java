package com.sechub.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sechub.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private static final List<String> REQUIRED_ALLOWED_ORIGIN_PATTERNS = List.of(
            "https://sechub-academy.vercel.app",
            "https://*.vercel.app",
            "https://api.littleboys.biz"
    );

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${app.cors.allowed-origin-patterns}")
    private String allowedOriginPatterns;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .headers(headers -> headers.frameOptions(frame -> frame.disable()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpStatus.UNAUTHORIZED.value());
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setCharacterEncoding("UTF-8");
                    new ObjectMapper().writeValue(response.getOutputStream(),
                        ApiResponse.error("Phiên đăng nhập đã hết hạn hoặc token không hợp lệ"));
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpStatus.FORBIDDEN.value());
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setCharacterEncoding("UTF-8");
                    new ObjectMapper().writeValue(response.getOutputStream(),
                        ApiResponse.error("Bạn không có quyền truy cập tài nguyên này"));
                })
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Lab attempts endpoints requiring authentication
                .requestMatchers(HttpMethod.GET, "/api/labs/attempts/me").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/labs/*/attempts").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/labs/attempts/*/feedback").authenticated()
                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/actuator/health", "/actuator/health/**").permitAll()
                .requestMatchers("/api/lab-runtime/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/vulnerabilities/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/learning-paths/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/lessons/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/labs/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/growth/public/**", "/api/growth/leaderboard").permitAll()
                .requestMatchers("/api/lab-runtime/**").permitAll()
                .requestMatchers("/api/sync/**").permitAll()
                .requestMatchers("/api/ai/**").authenticated()
                .requestMatchers("/api/author/**").hasAnyRole("INSTRUCTOR", "ADMIN")
                // Admin endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // All other requests require authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> patterns = new ArrayList<>(Arrays.stream(allowedOriginPatterns.split(","))
                .map(String::trim).filter(value -> !value.isEmpty()).toList());
        REQUIRED_ALLOWED_ORIGIN_PATTERNS.forEach(pattern -> {
            if (!patterns.contains(pattern)) {
                patterns.add(pattern);
            }
        });
        configuration.setAllowedOriginPatterns(patterns);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Location"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
