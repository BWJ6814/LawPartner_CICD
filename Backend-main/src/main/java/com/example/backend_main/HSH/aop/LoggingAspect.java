package com.example.backend_main.HSH.aop;

import com.example.backend_main.common.entity.AccessLog;
import com.example.backend_main.common.repository.AccessLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/*
@Aspect : 이 클래스는 성 전체를 감시하는 'CCTV(AOP)'임을 선언함
@Component : 스프링이 관리하는 부품으로 등록함
@RequiredArgsConstructor : final이 붙은 도구들(Repository)를 가져오기 위한 생성자를 자동 처리
@Slf4j : 로그 출력을 위한 도구, 콘솔창에 "누가 들어왔다!"라고 글자를 찍어주는 역할을 함
--> private static final Logger log = LoggerFactory.getLogger(LoggingAspect.class); 자동 생성
*/
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class LoggingAspect {
    // 1. 콘솔에 찍힌 기록을 DB 창고(TB_ACCESS_LOG)에 저장해주는 관리자 도구 - 저장 데이터!
    private final AccessLogRepository accessLogRepository;

    // 일단 HSH 패키지 내부에서 로그 돌아가는지 보고, 전체 처리..
    // @Before : 대상 메서드가 실행되기 직전에 녹화버튼을 눌러라!!
    // execution(...) : 어떤 메서드를 감시할지 정하는 실행 명령문
    // *(첫 번째) : 리턴 타입이 무엇이든 상관없이 모두 감시!
    // com.example.backend_main..controller : backend_main 패키지 하위의 모든(..) controller 패키지를 찾아내기
    // *.*(..) : 모든 클래스(*) 안의 모든 메서드(*)를 감시하며, 매개 변수(..)가 몇 개든 상관하지 않습니다.
    // @Before("execution(* com.example.backend_main..controller.*.*(..))")
    @Before("execution(* com.example.backend_main.HSH.controller.*.*(..))")
    public void logAccess(JoinPoint joinPoint) {

        // 2. 지금 성(서버)에 들어온 요청의 상세 정보(IP, 주소 등)를 가져옴
        // RequestContextHolder : 현재 서버에 들어온 요청의 모든 주머니 정보를 쥐고 있는 손
        // HttpServleRequest : 주머니에서 꺼낸 [방문증] 여기에 IP주소, 요청 주소(URL) 등이 적혀있습니다.
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();

        // 3. 현재 활동 중인 사람의 신분증(JWT)에서 아이디를 꺼냄
        // SecurityContextHolder : 현재 서버에 돌아다니는 사람의 가슴에 달린 신분증을 확인하는 보안 요원
        // auth.getName() : 신분증(JWT)에서 사용자의 식별자(복호화된 이메일)를 읽어오기
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = (auth != null) ? auth.getName() : "ANONYMOUS"; // 로그인 안 했으면 '익명'

        // 4. 로그인 상태라면 신분증(JWT)에서 이메일(식별자)을 꺼냄
        // !"anonymousUser".equals(...) : 신분증이 없는 구경꾼(로그인 전 사용자)인지, 정식 발급자인지 판별하기
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            userId = auth.getName();
        }

        // 5. DB에 기록할 블랙박스 객체를 조립함
        // joinPoint : 감시망에 걸린 해당 지점(메서드)
        //  getSignature().toShortString() : [어떤 클래스의 어떤 함수]가 실행됬는지 간략한 이름표를 가져오기
        // getRemoteIp(request) 접속자의 컴퓨터 주소(IP)를 정확하게 파악하기
        AccessLog accessLog = AccessLog.builder()
                .userId(userId) // 누가?
                .methodNm(joinPoint.getSignature().getName()) // 어떤 기능을? (예: getAllUsers)
                .requestUri(request.getRequestURI()) // 어떤 주소로? (예: /api/admin/users)
                .remoteIp(request.getRemoteAddr()) // 어떤 컴퓨터(IP)에서?
                .build();

        // 6. DB 창고(TB_ACCESS_LOG)에 즉시 저장!
        // save(log) : DB의 TB_ACCESS_LOG 테이블에 한 줄의 기록을 영구적으로 저장
        // log.info 관리자묭 모니터(콘솔)에 실시간으로 상황 출력하기.
        // log는 @Slf4j를 통해서 사용..!
        accessLogRepository.save(accessLog);
        log.info("📢 [Security Audit] User: {}, Method: {}, URI: {}", userId, accessLog.getMethodNm(), accessLog.getRequestUri());
    }
    // 실제 접속 IP를 정확하게 가져오는 유틸리티 메서드
    private String getRemoteIp(HttpServletRequest request) {
        // X-Forwarded-For : 실제 사용자가 프록시 서버나 보안 장비를 거쳐 올 때, 진짜 IP를 숨기지 못하도록 찾아주는 [추적용 헤더]
        // request.getRemoteAddr() : 헤더 정보가 없다면 직접 연결된 컴퓨터의 주소를 가져오기..
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }


}