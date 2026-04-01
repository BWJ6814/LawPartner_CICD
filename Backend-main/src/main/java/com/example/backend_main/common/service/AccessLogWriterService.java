package com.example.backend_main.common.service;

import com.example.backend_main.common.entity.AccessLog;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.repository.AccessLogRepository;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.common.security.CustomUserDetails;
import com.example.backend_main.common.util.IpUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/** 접속 로그는 감사용으로 별도 트랜잭션에서 커밋. 필터·시큐리티 차단도 TB_ACCESS_LOG에 기록. */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccessLogWriterService {

    private final AccessLogRepository accessLogRepository;
    private final UserRepository userRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void save(AccessLog accessLog) {
        accessLogRepository.save(accessLog);
    }

    /** 필터·시큐리티에서 컨트롤러 없이 종료되는 요청을 TB_ACCESS_LOG에 기록합니다. */
    public void saveSecurityRejection(HttpServletRequest request, int statusCode, String errorMsg) {
        try {
            String traceId = UUID.randomUUID().toString().substring(0, 8);
            String uri = request.getRequestURI();
            if (uri != null && uri.length() > 200) {
                uri = uri.substring(0, 200);
            }
            if (uri == null || uri.isEmpty()) {
                uri = "Unknown";
            }
            String ua = request.getHeader("User-Agent");
            if (ua != null && ua.length() > 200) {
                ua = ua.substring(0, 200);
            }
            if (ua == null || ua.isEmpty()) {
                ua = "Unknown";
            }
            String err = errorMsg;
            if (err != null && err.length() > 500) {
                err = err.substring(0, 500);
            }

            save(AccessLog.builder()
                    .traceId(traceId)
                    .reqIp(IpUtil.getClientIp(request))
                    .reqUri(uri)
                    .userAgent(ua)
                    .userNo(resolveUserNoIfAuthenticated())
                    .statusCode(statusCode)
                    .execTime(0L)
                    .errorMsg(err)
                    .regDt(LocalDateTime.now())
                    .build());
        } catch (Exception e) {
            log.warn("🚨 [보안 차단 접속 로그 저장 실패] {}", e.getMessage());
        }
    }

    private Long resolveUserNoIfAuthenticated() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        try {
            Object details = auth.getDetails();
            if (details instanceof java.util.Map<?, ?> mapDetails) {
                if (mapDetails.containsKey("userNo") && mapDetails.get("userNo") != null) {
                    return ((Number) mapDetails.get("userNo")).longValue();
                }
            }
            Object principal = auth.getPrincipal();
            if (principal instanceof CustomUserDetails customDetails) {
                return customDetails.getUserNo();
            }
            return userRepository.findByEmail(auth.getName())
                    .map(User::getUserNo)
                    .orElse(null);
        } catch (Exception e) {
            log.debug("보안 로그용 처리 userNo 조회 생략: {}", e.getMessage());
            return null;
        }
    }
}
