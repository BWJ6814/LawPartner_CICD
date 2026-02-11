package com.example.backend_main.security;

import com.example.backend_main.common.security.JwtAuthenticationEntryPoint;
import com.example.backend_main.common.security.JwtAuthenticationFilter;
import com.example.backend_main.common.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;
@Configuration
@EnableWebSecurity
// // JwtTokenProvider를 가져오기 위해 필요합니당~
@RequiredArgsConstructor
public class SecurityConfig {
    // 신분증 확인 기계 가져오기..!
    private final JwtTokenProvider jwtTokenProvider;
    // 보안관 가져오기!
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    // 비밀번호 암호기 등록하기.
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. CSRF 보안 끄기 (REST API 방식에서는 필수)
                // csrf : 스프링 시큐리티가 제공하는 CsrfConfigurer 객체 (설정을 담당하는 일꾼)
                //
                // csrf.disable() : CSRF 보안 기능을 꺼라..!
                .csrf(AbstractHttpConfigurer::disable)

                // 2. CORS 설정 적용 (리액트와의 연결 통로)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 3. 세션 사용 안함 (JWT를 쓸 거니까 '무상태'로 설정!)
                // 세션을 보통 아이디를 확인하지만 JWT를 사용함으로 인해 JWT내부에 있는 이름과 권한을 사용할 것이기 때문!
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 401 Unauthorized 에러를 처리할 보안관을 등록!
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                )

                // 4. 페이지별 출입 권한 설정
                // .requestMatchers("/api/auth/**").permitAll() : 로그인이나 회원가입 주소로 오는 사람들은
                // 신분증이 없어도 무조건 들어오도록  처리..!
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll() // 로그인/회원가입은 프리패스!
                        // 2. [개발 기간용] 그 외의 모든 요청도 일단은 다 통과!
                        .anyRequest().permitAll()
                        // 그 외 모든 요청은 신분증(JWT) 검사! - 개발 중간 중간 확인할 예정..
                        // .anyRequest().authenticated()
                        /*
                        추후 상태 수정할 코드
                        .requestMatchers("/api/auth/**").permitAll() // 로그인/회원가입은 자유롭게
                        .requestMatchers("/api/admin/**").hasRole("ADMIN") // 관리자 전용 구역 잠금
                        .anyRequest().authenticated() // 그 외 모든 곳은 신분증(JWT) 필수!
                        */
                )

                // 5. JWT 문지기 배치 (기본 문지기 앞에 우리 문지기를 세웁니다)
                .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider),
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // CORS 허용 설정
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 리액트 주소(3000) 허용
        configuration.setAllowedOrigins(List.of("http://localhost:3000"));

        // 모든 메소드 허용
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // 모든 헤더 허용
        configuration.setAllowedHeaders(List.of("*"));
        /*
        - [운영 환경 적용] 모든 헤더(*) 대신 실제 사용하는 헤더만 명시
        configuration.setAllowedHeaders(List.of(
                "Authorization",      // JWT 토큰 전달용
                "Content-Type",       // JSON 데이터 전달용
                "Cache-Control",
                "X-Requested-With"    // AJAX 요청 확인용
        ));

        - 브라우저가 위 헤더들을 읽을 수 있도록 노출 설정
        configuration.setExposedHeaders(List.of("Authorization"));
        */
        // 쿠키나 인증 정보 포함 허용
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }


}