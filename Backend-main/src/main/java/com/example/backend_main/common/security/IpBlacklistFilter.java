package com.example.backend_main.common.security;

import com.example.backend_main.common.entity.BlacklistIp;
import com.example.backend_main.common.repository.BlacklistIpRepository;
import com.example.backend_main.common.util.IpUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class IpBlacklistFilter extends OncePerRequestFilter {

    private final BlacklistIpRepository blacklistIpRepository;

    /**
     * DB 스냅샷을 통째로 갈아끼움(clear+addAll 없음) — 읽기 스레드가 빈 캐시를 보는 틈 제거.
     */
    private volatile Set<String> blacklistSnapshot = Set.of();

    private long lastCacheUpdateTime = 0;
    private static final long CACHE_TTL_MS = 60_000; // 캐시 갱신 주기 (1분)

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String ip = IpUtil.getClientIp(request);

        refreshCacheIfNecessary();

        Set<String> snap = blacklistSnapshot;
        if (ip != null && snap.contains(ip)) {
            log.warn("🚨 [차단된 IP 접근 방어] IP: {}, URI: {}", ip, request.getRequestURI());

            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"success\": false, \"code\": \"BL-403\", \"message\": \"접근이 원천 차단된 IP입니다.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void refreshCacheIfNecessary() {
        long currentTime = System.currentTimeMillis();
        if (currentTime - lastCacheUpdateTime > CACHE_TTL_MS) {
            synchronized (this) {
                if (currentTime - lastCacheUpdateTime > CACHE_TTL_MS) {
                    try {
                        Set<String> latest = blacklistIpRepository.findAll().stream()
                                .map(BlacklistIp::getIpAddress)
                                .collect(Collectors.toSet());
                        blacklistSnapshot = Collections.unmodifiableSet(latest);
                        lastCacheUpdateTime = System.currentTimeMillis();
                    } catch (Exception e) {
                        log.error("❌ 블랙리스트 캐시 갱신 중 오류 발생", e);
                    }
                }
            }
        }
    }
}
