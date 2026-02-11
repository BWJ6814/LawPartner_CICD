package com.example.backend_main.HSH.aop;

import com.example.backend_main.common.entity.AccessLog;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.repository.AccessLogRepository;
import com.example.backend_main.common.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class LoggingAspect {

    private final AccessLogRepository accessLogRepository;
    private final UserRepository userRepository; // USER_NO 조회를 위해 추가
    private final HttpServletRequest request;

    @Around("execution(* com.example.backend_main.HSH.controller..*(..))")
    public Object logAccess(ProceedingJoinPoint joinPoint) throws Throwable {

        // 1. [TRACE_ID] 요청 고유 식별자 생성 (UUID 8자리)
        String traceId = UUID.randomUUID().toString().substring(0, 8);

        // 2. [USER_AGENT] 접속 환경 정보 (최대 200자 제한으로 안전하게 처리)
        String userAgent = request.getHeader("User-Agent");
        if (userAgent != null && userAgent.length() > 200) {
            userAgent = userAgent.substring(0, 200);
        }

        // 3. 기타 접속 정보 수집
        String ip = request.getRemoteAddr();
        String uri = request.getRequestURI();

        // 4. [USER_NO] 현재 로그인한 사용자 번호 가져오기
        Long userNo = getCurrentUserNo();

        // 5. [AccessLog] 엔티티 생성 (새로운 SQL 규격 반영)
        AccessLog accessLog = AccessLog.builder()
                .traceId(traceId)
                .reqIp(ip)
                .reqUri(uri)
                .userAgent(userAgent)
                .userNo(userNo)
                .build();

        // 6. DB 저장 (블랙박스 기록)
        accessLogRepository.save(accessLog);

        log.info("📢 [Security Audit] TRACE: {}, IP: {}, USER_NO: {}, URI: {}", traceId, ip, userNo, uri);

        return joinPoint.proceed(); // 실제 컨트롤러 메서드 실행
    }

    /*
     SecurityContext에서 현재 로그인한 유저의 PK(USER_NO)를 찾는 헬퍼 메서드
     */
    private Long getCurrentUserNo() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // 로그인하지 않은 경우(비회원) 처리
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }

        try {
            // 현재 인증된 주체(Principal)는 이메일이므로, DB에서 해당 유저의 번호를 조회합니다.
            String email = auth.getName();
            return userRepository.findByEmail(email)
                    .map(User::getUserNo) // User 엔티티의 @Id인 userNo 필드 가져오기
                    .orElse(null);
        } catch (Exception e) {
            log.warn("⚠️ 사용자 번호 조회 중 오류 발생: {}", e.getMessage());
            return null;
        }
    }
}