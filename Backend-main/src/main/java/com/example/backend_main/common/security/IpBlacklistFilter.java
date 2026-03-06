package com.example.backend_main.common.security;

import com.example.backend_main.common.repository.BlacklistIpRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class IpBlacklistFilter extends OncePerRequestFilter {

    private final BlacklistIpRepository blacklistIpRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. 요청한 사람의 진짜 IP 가져오기
        String ip = getClientIp(request);

        // 2. DB에서 이 IP가 차단 명부(Blacklist)에 있는지 검사
        if (blacklistIpRepository.existsByIpAddress(ip)) {
            log.warn("🚨 [차단된 IP 접근 시도] IP: {}, URI: {}", ip, request.getRequestURI());

            // 3. 차단된 IP라면 더 이상 진행시키지 않고, 에러(403 Forbidden)를 던지고 끝내버림
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"success\": false, \"message\": \"접근이 차단된 IP입니다.\"}");
            return; // 💥 여기서 리턴하면 Controller로 아예 넘어가지 못함!
        }

        // 4. 차단되지 않은 깨끗한 IP라면, 무사히 다음 필터(JWT 필터 등)로 통과시킴
        filterChain.doFilter(request, response);
    }

    // AOP에서 썼던 것과 동일한 무적의 IP 추출기
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) ip = request.getHeader("Proxy-Client-IP");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) ip = request.getHeader("WL-Proxy-Client-IP");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) ip = request.getRemoteAddr();

        if (ip != null && ip.contains(",")) ip = ip.split(",")[0].trim();
        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) ip = "127.0.0.1";

        return ip;
    }
}