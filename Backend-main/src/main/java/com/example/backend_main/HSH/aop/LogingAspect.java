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
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.UUID;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class LogingAspect {

    private final AccessLogRepository accessLogRepository;
    private final UserRepository userRepository; // USER_NO 조회를 위해 추가
    private final HttpServletRequest request;

    @Around("execution(* com.example.backend_main.HSH.controller..*(..))")
    public Object logAccess(ProceedingJoinPoint joinPoint) throws Throwable {

        // 1. [TRACE_ID] 요청 고유 식별자 생성 (UUID 8자리)
        String traceId = UUID.randomUUID().toString().substring(0, 8);
        // 1.1 요청 시작 시간 기록
        long startTime = System.currentTimeMillis();

        // 2-1. Request 객체 가져오기
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();

        // 2-2. [USER_AGENT] 접속 환경 정보 (최대 200자 제한으로 안전하게 처리)
        // request.getHeader("User-Agent") : 사용자 브라우저, 운영체제, 기기 정보를 낚아챔..
        String userAgent = request.getHeader("User-Agent");

        // 3. 기타 접속 정보 수집
        if (userAgent != null && userAgent.length() > 200) userAgent = userAgent.substring(0, 200);
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
                .statusCode(102) // 102: Processing (임시)
                .build();

        // 일단 저장 (ID 확보를 위해) - *필요 시 생략하고 마지막에만 저장해도 됨
        // accessLogRepository.save(accessLog);

        Object result = null;
        String errorMsg = null;
        int status = 200; // 기본 성공

        try {
            // 3. 실제 타겟 메서드 실행
            result = joinPoint.proceed();
        } catch (Exception e) {
            // 4. 예외 발생 시 정보 캡처
            status = 500;
            errorMsg = e.getMessage();
            throw e; // 예외는 다시 던져서 컨트롤러 어드바이스가 처리하게 함
        } finally {
            // 5. 종료 시간 및 최종 정보 업데이트
            long duration = System.currentTimeMillis() - startTime;

            // 엔티티에 statusCode, execTime 필드가 추가되었다고 가정 (DB 컬럼 추가 필요!)
            // AccessLog 엔티티 수정이 필요합니다.

            log.info("📢 [Audit] TraceID: {}, URI: {}, Status: {}, Time: {}ms", traceId, uri, status, duration);

            // 여기서 최종 저장 (DB 부하를 줄이려면 여기서 한 번만 저장하는 게 좋음)
            accessLogRepository.save(AccessLog.builder()
                    .traceId(traceId)
                    .reqIp(ip)
                    .reqUri(uri)
                    .userAgent(userAgent)
                    .userNo(userNo)
                    .statusCode(status) // Entity에 필드 추가 필요
                    .execTime(duration) // Entity에 필드 추가 필요
                    .errorMsg(errorMsg) // Entity에 필드 추가 필요
                    .build());
        }

        return result;
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