package com.example.backend_main.common.security;

import com.example.backend_main.common.util.IpUtil;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 모든 요청에 대해 IP(연결 기준)당 분당 요청 수를 제한합니다.
 * {@link AccountRecoveryRateLimiter} 등 컨트롤러 단 레이트 리밋과는 별도 버킷이므로 이중 소모될 수 있습니다.
 */
@Slf4j
public class GlobalRateLimitFilter extends OncePerRequestFilter {

    private final int maxRequestsPerMinute;
    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    public GlobalRateLimitFilter(int maxRequestsPerMinute) {
        this.maxRequestsPerMinute = Math.max(0, maxRequestsPerMinute);
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        if (maxRequestsPerMinute <= 0) {
            return true;
        }
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String uri = request.getRequestURI();
        if (uri != null) {
            if (uri.startsWith("/ws-stomp") || uri.startsWith("/actuator")) {
                return true;
            }
        }
        return false;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String ip = IpUtil.getRateLimitIp(request);
        if (ip == null || ip.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        Bucket bucket = buckets.computeIfAbsent(ip, k -> createBucket());

        if (!bucket.tryConsume(1)) {
            log.warn("[GlobalRateLimit] IP 한도 초과: {}, URI: {}", ip, request.getRequestURI());
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(
                    "{\"success\": false, \"code\": \"SEC-429\", \"message\": \"요청이 너무 자주 발생했습니다. 잠시 후 다시 시도해주세요.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private Bucket createBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(maxRequestsPerMinute)
                        .refillGreedy(maxRequestsPerMinute, Duration.ofMinutes(1))
                        .build())
                .build();
    }
}
