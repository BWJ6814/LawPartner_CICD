package com.example.backend_main.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // 비밀번호 빈 봉투 설정
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. CSRF 비활성화 (REST API이므로 불필요)
                .csrf(csrf -> csrf.disable())

                // 2. 세션 정책 설정 (JWT 사용을 위해 STATELESS 설정)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 3. 인가 규칙 설정 (ADM-01, LC-01 등 대응)
                .authorizeHttpRequests(auth -> auth
                        // 로그인, 메인 등 공개 API
                        .requestMatchers("/api/auth/**", "/api/main/**").permitAll()
                        // 관리자 전용
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        // 변호사 전용
                        .requestMatchers("/api/lawyer/**").hasRole("LAWYER")
                        // 나머지는 인증 필요
                        .anyRequest().authenticated()
                );

        return http.build();
    }
}