package com.example.backend_main.HSH.aop;

import com.example.backend_main.common.annotation.ActionLog;
import com.example.backend_main.common.entity.AccessLog;
import com.example.backend_main.common.entity.AdminAudit;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.repository.AccessLogRepository;
import com.example.backend_main.common.repository.AdminAuditRepository;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.common.security.CustomUserDetails;
import org.slf4j.MDC;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.UUID;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class LogingAspect {

    private final AccessLogRepository accessLogRepository;
    private final UserRepository userRepository; // USER_NO 조회를 위해 추가
    private final AdminAuditRepository adminAuditRepository;


    /*
    1. [기본 접속 로그] 모든 컨트롤러 요청 시 작동
    누가 - 언제 - 어디로 - 접속했는가?
    */
    @Around("execution(* com.example.backend_main.HSH.controller..*(..))")
    public Object logAccess(ProceedingJoinPoint joinPoint) throws Throwable {

        // 1. [TRACE_ID] 요청 고유 식별자 생성 (UUID 8자리)
        String traceId = UUID.randomUUID().toString().substring(0, 8);
        // 1.1 입구에서부터 쓰레드 명찰(MDC), 달기!
        MDC.put("TRACE_ID", traceId);

        // 1.2 요청 시작 시간 기록
        long startTime = System.currentTimeMillis();

        // 2-1. Request 객체 가져오기
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();

        // 2-2. [USER_AGENT] 접속 환경 정보 (최대 200자 제한으로 안전하게 처리)
        // request.getHeader("User-Agent") : 사용자 브라우저, 운영체제, 기기 정보를 낚아챔..
        String userAgent = request.getHeader("User-Agent");
        if (userAgent != null && userAgent.length() > 200) {
            userAgent = userAgent.substring(0, 200); // DB 컬럼 길이 제한 방어
        }

        String ip = request.getRemoteAddr();
        String uri = request.getRequestURI();

        // 4. [USER_NO] 현재 로그인한 사용자 번호 가져오기
        Long userNo = getCurrentUserNo();

        Object result;
        String errorMsg = null;
        int status = 200; // 기본 성공

        try {
            // ★ 핵심: 실제 컨트롤러 메서드 실행
            result = joinPoint.proceed();
        } catch (Exception e) {
            // 예외 발생 시 정보 캡처
            status = 500; // 에러 코드 설정
            errorMsg = e.getMessage(); // 에러 메시지 캡처

            // DB 컬럼 길이(500자) 넘치지 않게 자르기
            if (errorMsg != null && errorMsg.length() > 500) {
                errorMsg = errorMsg.substring(0, 500);
            }
            throw e; // 예외는 다시 던져서 GlobalExceptionHandler가 처리하게 함
        } finally {
            // 5. 종료 시간 계산 및 로그 저장 (성공이든 실패든 무조건 실행)
            long duration = System.currentTimeMillis() - startTime;

            log.info("📢 [Audit] TraceID: {}, URI: {}, Status: {}, Time: {}ms", traceId, uri, status, duration);

            // [최종 저장] 수정된 AccessLog 엔티티에 맞춰 데이터 삽입
            // 비동기 처리(@Async)를 고려해볼 수 있으나, 데이터 무결성을 위해 동기로 저장
            accessLogRepository.save(AccessLog.builder()
                    .traceId(traceId)
                    .reqIp(ip)
                    .reqUri(uri)
                    .userAgent(userAgent)
                    .userNo(userNo)
                    .statusCode(status)   // 상태 코드
                    .execTime(duration)   // 실행 시간
                    .errorMsg(errorMsg)   // 에러 메시지 (성공 시 null)
                    .build());

            MDC.clear();                  // 퇴근할 땐 명찰 반납하세요! (메모리 누스 방지)
        }

        return result;
    }

    /*
     2. [커스텀 행위 로그] @ActionLog가 붙은 메소드만 골라서 작동
     "관리자가 엑셀을 다운로드했다", "승인했다" 등 중요 행위 추적용
     */
    @Around("@annotation(com.example.backend_main.common.annotation.ActionLog)")
    public Object logAdminAction(ProceedingJoinPoint joinPoint) throws Throwable {

        // 1. 어노테이션에 적힌 내용 읽어오기 (action="엑셀다운", target="로그테이블")
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        ActionLog actionLog = signature.getMethod().getAnnotation(ActionLog.class);

        String actionType = actionLog.action();
        String targetInfo = actionLog.target();

        // 2. 관리자 정보 가져오기 (adminId 포함)
        Long adminNo = null;
        String adminId = "UNKNOWN";
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // 타입 확인과 동시에 'details'라는 변수에 곧바로 담아버리기! - 형변환 생략..
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails details) {
            adminNo = details.getUserNo();
            adminId = details.getUserId();
        }

        // 3. 환경 정보 가져오기
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        String ip = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");
        if (userAgent != null && userAgent.length() > 200) userAgent = userAgent.substring(0, 200);

        // 4. ★ logAccess에서 달아둔 명찰(traceId) 확인
        String traceId = MDC.get("traceId");
        if (traceId == null) traceId = "SYSTEM"; // 혹시 컨트롤러를 안 거쳤을 경우 방어


        // 3. 시작 로그
        log.info("👀 [Admin Action Start] Admin: {}({}), Action: {}, Target: {}", adminId, adminNo, actionType, targetInfo);

        Object result;
        String errorYn = "N";
        String errorMsg = null;

        try {
            result = joinPoint.proceed();
            log.info("✅ [Admin Action Success] Admin: {}, Action: {}, TraceID: {}", adminId, actionType, traceId);
        } catch (Exception e) {
            errorYn = "Y";
            errorMsg = e.getMessage();
            if (errorMsg != null && errorMsg.length() > 500) errorMsg = errorMsg.substring(0, 500);
            log.error("❌ [Admin Action Fail] Admin: {}, Action: {}, Error: {}", adminId, actionType, e.getMessage());
            throw e;
        } finally {
            // [핵심] DB에 저장
            if (adminNo != null) {
                adminAuditRepository.save(AdminAudit.builder()
                        .adminNo(adminNo)
                        .adminId(adminId)
                        .actionType(actionType)
                        .targetInfo(targetInfo)
                        .traceId(traceId)
                        .errorYn(errorYn)
                        .errorMsg(errorMsg)
                        .reqIp(ip)
                        .userAgent(userAgent)
                        .build());
            }
        }

        return result;
    }

    /*
     SecurityContext에서 현재 로그인한 유저의 PK(USER_NO)를 찾는 헬퍼 메서드
     CustomUserDetails를 사용하여 DB 조회를 피하기
     */
    private Long getCurrentUserNo() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // 로그인하지 않은 경우(비회원) 처리
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }

        try {
            Object principal = auth.getPrincipal();

            // 1. [최적화] CustomUserDetails라면 DB 조회 없이 바로 PK 반환
            if (principal instanceof CustomUserDetails details) {
                return details.getUserNo();
            }

            // 2. [기본] 만약 다른 방식으로 로그인했다면 DB 조회 (안전장치)
            String email = auth.getName();
            return userRepository.findByEmail(email)
                    .map(User::getUserNo)
                    .orElse(null);

        } catch (Exception e) {
            log.warn("⚠️ 사용자 번호 조회 중 오류 발생: {}", e.getMessage());
            return null;
        }
    }

}