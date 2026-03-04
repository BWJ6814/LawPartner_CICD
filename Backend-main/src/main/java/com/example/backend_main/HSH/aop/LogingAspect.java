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
import org.springframework.web.context.request.RequestAttributes;
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
    private final AdminAuditRepository adminAuditRepository;


    /*
    1. [기본 접속 로그] 모든 컨트롤러 요청 시 작동
    누가 - 언제 - 어디로 - 접속했는가?
    변경: 프로젝트 내의 모든 Controller 하위 메서드 감시

    누구를 타겟으로 하는가?
    모든 컨트롤러와 채팅(STOMP) 통신의 입출력을 감시

    @Around : 메서드의 시작 전과 끝난 후 모두를 감싸서 통제하겠다는 뜻
    execution(...) : 감시할 타겟 정하기
    물리적주소.*Controller.*(..) : 이름이 Controller로 끝나는 모든 클래스의 모든 메서드(일반 API와 채팅 컨트롤러 포함)
    */
    @Around("execution(* com.example.backend_main..*Controller.*(..))")
    public Object logAccess(ProceedingJoinPoint joinPoint) throws Throwable {

        // 1. [TRACE_ID] 요청 고유 식별자 생성 (UUID 8자리)
        String traceId = UUID.randomUUID().toString().substring(0, 8);
        // 1.1 입구에서부터 쓰레드 명찰(MDC), 달기!
        MDC.put("TRACE_ID", traceId);

        // 1.2 요청 시작 시간 기록
        long startTime = System.currentTimeMillis();

        // 2. HTTP/WebSocket 분기 처리를 위한 Attributes 안전하게 가져오기
        // ★ currentRequestAttributes() 대신 getRequestAttributes()를 사용하여 에러 방지!
        // currentRequestAttributes() : 웹 소켓처럼 HTTP 요청이 없을 때 에러를 발생시킴
        // getRequestAttributes() : HTTP 요청이 없으면 NULL을 반환
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();

        String ip;
        String uri;
        String userAgent;

        if (attributes != null) {
            // ==========================================
            // [A] 일반 HTTP (REST API) 요청일 경우
            // attributes : 범용 상자에 요청 정보를 담은 객체
            // ServletRequestAttributes : 웹 요청인지 확인했으니, 해당 상자를 열어
            // HttpServletRequest : HTTP 편지의 원본을 꺼내달라!
            // 그것을 request 라는 변수명으로 활용하겠다는 뜻
            // ==========================================
            HttpServletRequest request = ((ServletRequestAttributes) attributes).getRequest();

            // 헤더가 없을 경우(NULL 방지)
            // 헤더 머리말 부분에 적힌 User-Agent 라는 값을 읽어오기
            userAgent = request.getHeader("User-Agent");
            if (userAgent != null && userAgent.length() > 200) {
                //
                userAgent = userAgent.substring(0, 200);
            }
            ip = getClientIp(request); // 헬퍼 메서드로 변경
            uri = request.getRequestURI();
        } else {
            // ==========================================
            // [B] 웹소켓 (STOMP 채팅 등) 통신일 경우
            // ==========================================
            String className = joinPoint.getSignature().getDeclaringType().getSimpleName();
            String methodName = joinPoint.getSignature().getName();

            uri = "[STOMP] /" + className + "/" + methodName;
            ip = "WebSocket Client";
            userAgent = "WebSocket Session";
        }

        // 3. 사용자 번호 가져오기
        Long userNo = getCurrentUserNo();

        Object result;
        String errorMsg = null;
        int status = 200; // 기본 성공

        try {
            // ★ 비즈니스 로직(API 또는 채팅 전송) 실행
            result = joinPoint.proceed();
        } catch (Exception e) {
            status = 500;
            errorMsg = e.getMessage();
            if (errorMsg != null && errorMsg.length() > 500) {
                errorMsg = errorMsg.substring(0, 500);
            }
            throw e;
        } finally {
            // 4. 종료 시간 계산 및 DB 저장
            long duration = System.currentTimeMillis() - startTime;

            log.info("📢 [Audit] TraceID: {}, URI: {}, Status: {}, Time: {}ms", traceId, uri, status, duration);

            accessLogRepository.save(AccessLog.builder()
                    .traceId(traceId)
                    .reqIp(ip)
                    .reqUri(uri)
                    .userAgent(userAgent)
                    .userNo(userNo)
                    .statusCode(status)
                    .execTime(duration)
                    .errorMsg(errorMsg)
                    .regDt(LocalDateTime.now())
                    .build());

            MDC.clear(); // 퇴근 시 명찰 반납
        }

        return result;
    }
    /*
     2. [커스텀 행위 로그] @ActionLog가 붙은 메소드만 골라서 작동
     "관리자가 엑셀을 다운로드했다", "승인했다" 등 중요 행위 추적용
     
     누구를 감시하는가?
     @ActionLog 어노테이션이 붙은 메서드만 골라서 감시하기
     
     해당 어노테이션에 적어둔 acton이나 target 같은 글자들을 쏙쏙 뽑아오기..
     */
    @Around("@annotation(com.example.backend_main.common.annotation.ActionLog)")
    public Object logAdminAction(ProceedingJoinPoint joinPoint) throws Throwable {

        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        ActionLog actionLog = signature.getMethod().getAnnotation(ActionLog.class);

        String actionType = actionLog.action();
        String targetInfo = actionLog.target();

        // 1. 관리자 정보 가져오기
        Long adminNo = null;
        String adminId = "UNKNOWN";
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails details) {
            adminNo = details.getUserNo();
            adminId = details.getUserId();
        }

        // 2. 환경 정보 및 TraceID
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        String ip = "Unknown IP";
        String userAgent = "Unknown Agent";

        if (attributes != null) {
            HttpServletRequest request = ((ServletRequestAttributes) attributes).getRequest();
            ip = getClientIp(request); // 헬퍼 메서드 사용!
            userAgent = request.getHeader("User-Agent");
            if (userAgent != null && userAgent.length() > 200) userAgent = userAgent.substring(0, 200);
        }

        String traceId = MDC.get("TRACE_ID");
        if (traceId == null) traceId = "SYSTEM";

        // ⭐ 파라미터에서 사유(Reason) 낚아채기!
        String reason = "사유 미입력"; // 기본값
        // joinPoint.getArgs() : 이 호출을 통해 전달되는 모든 파라미터를 싹 다 뒤져서 
        // 어떤 방식으로 보냈던 "reason"이라는 이름의 데이터를 무조건 낚사채서 추출하기
        Object[] args = joinPoint.getArgs();
        String[] parameterNames = signature.getParameterNames();

        for (int i = 0; i < args.length; i++) {
            Object arg = args[i];
            if (arg == null) continue;

            /*
                케이스 A와 B로 나눈 이유
            - 케이스 A
            [상태 변경 / 승인] - PUT 또는 POST 방식
            데이터를 숨겨서 Body(JSON) 담아 보냄 -
            백엔드 : @RequestBody Map<String, String> 또는 DTO로 받음

            - 케이스 B
            [엑셀 다운로드 / 삭제] - GET 또는 DELETE 방식
            Get 요청은 Body(JSON)를 가질 수 없는 것이 웹의 표준 규칙
            따라서 URL 뒤에 파라미터를 붙여서 보내기 (/api/admin/logs/download?reason=이유)
            백엔드 : @RequestParam("reason") String reason
            */

            // 케이스 A: 프론트에서 Map으로 보냈을 때 (예: @RequestBody Map<String, String>)
            if (arg instanceof java.util.Map<?, ?> mapArg) {
                if (mapArg.containsKey("reason") && mapArg.get("reason") != null) {
                    reason = String.valueOf(mapArg.get("reason"));
                    break;
                }
            }
            // 케이스 B: 파라미터 이름 자체가 "reason"일 때 (예: @RequestParam String reason)
            else if (parameterNames != null && "reason".equals(parameterNames[i])) {
                reason = String.valueOf(arg);
                break;
            }
        }
        // =================================================================

        log.info("👀 [Admin Action Start] Admin: {}({}), Action: {}, Target: {}, Reason: {}",
                adminId, adminNo, actionType, targetInfo, reason);

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
            // DB 저장! (reason 포함)
            if (adminNo != null) {
                adminAuditRepository.save(AdminAudit.builder()
                        .adminNo(adminNo)
                        .adminId(adminId)
                        .actionType(actionType)
                        .targetInfo(targetInfo)
                        .reason(reason) // ★ 낚아챈 사유를 DB에 저장!
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
            // 🌟 1. [S급 최적화] JwtTokenProvider가 가방 안쪽 주머니(details)에 넣어둔 userNo를 0.001초 만에 꺼내기!
            Object details = auth.getDetails();
            if (details instanceof java.util.Map<?, ?> mapDetails) {
                if (mapDetails.containsKey("userNo") && mapDetails.get("userNo") != null) {
                    // Integer로 올 수 있는 경우를 대비해 Number로 캐스팅 후 longValue() 호출 (안전한 형변환)
                    return ((Number) mapDetails.get("userNo")).longValue();
                }
            }

            // 2. [방어 로직] 폼 로그인 등 다른 방식으로 로그인해서 Principal 자체가 CustomUserDetails인 경우
            Object principal = auth.getPrincipal();
            if (principal instanceof CustomUserDetails customDetails) {
                return customDetails.getUserNo();
            }

            // 3. [최후의 보루] 위 두 방법이 모두 실패했다면 어쩔 수 없이 DB 조회 (기존 로직 유지)
            String email = auth.getName();
            return userRepository.findByEmail(email)
                    .map(User::getUserNo)
                    .orElse(null);

        } catch (Exception e) {
            log.warn("⚠️ 사용자 번호 조회 중 오류 발생: {}", e.getMessage());
            return null;
        }
    }


    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");

        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty()  || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty()  || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }

        // 다중 프록시를 거쳤을 경우, 첫 번째 IP가 진짜 클라이언트 IP임
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }

        // ★ 대망의 IPv6 로컬호스트 변환!
        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) {
            ip = "127.0.0.1";
        }

        return ip;
    }

}