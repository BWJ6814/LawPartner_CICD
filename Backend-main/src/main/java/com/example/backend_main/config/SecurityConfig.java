package com.example.backend_main.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

// @Configuration : 해당 클래스는 설정 파일 - 파일 내용대로 시스템을 구성해줘!
@Configuration
// @EnableWebSecurity : 스프링 시큐리티라는 경비 시스템을 가동
@EnableWebSecurity
public class SecurityConfig {

    // 비밀번호 빈 봉투 설정
    // @Bean : 스프링이 관리하는 공용 도구함에 넣어둔다는 뜻
    // BCryptPasswordEncoder : 똑같은 비밀번호라도 다르게 변하게 시켜주는 마법 도구
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. CSRF 비활성화 (REST API이므로 불필요)
                // CSRF : 사이트 간 요청 위조 공격 방지 기능
                .csrf(csrf -> csrf.disable())

                // 2. 세션 정책 설정 (JWT 사용을 위해 STATELESS 설정)
                // 들어올 때마다 신분증(JWT)만 보여주고 바로 나가는 방식
                // 서버가 손님의 정보를 일일이 기억하지 않아도 됨..
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 3. 인가 규칙 설정 (ADM-01, LC-01 등 대응)
                // 이제부터 구역별 출입증 검사를 시작..!
                .authorizeHttpRequests(auth -> auth
                        // 로그인, 메인 등 공개 API
                        .requestMatchers("/api/auth/**", "/api/main/**").permitAll()
                        // 관리자 전용
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        // 변호사 전용
                        .requestMatchers("/api/lawyer/**").hasRole("LAWYER")
                        // 나머지는 인증(신분증-JWT) 필요
                        .anyRequest().authenticated()
                );
        // 위 모든 규칙을 합친 문지기를 완성..!
        return http.build();
    }
}