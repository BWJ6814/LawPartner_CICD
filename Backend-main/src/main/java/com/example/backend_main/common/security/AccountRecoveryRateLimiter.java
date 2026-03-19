package com.example.backend_main.common.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class AccountRecoveryRateLimiter {

    private final SecurityMonitorService securityMonitorService;

    private static final int MAX_IP_REQUESTS_PER_MINUTE = 10;
    private static final int MAX_EMAIL_REQUESTS_PER_MINUTE = 3;

    // IP별 버킷 저장소
    private final Map<String, Bucket> ipBuckets = new ConcurrentHashMap<>();
    // EMAIL별 버킷 저장소
    private final Map<String, Bucket> emailBuckets = new ConcurrentHashMap<>();

    private Bucket createIpBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(MAX_IP_REQUESTS_PER_MINUTE)
                        .refillGreedy(MAX_IP_REQUESTS_PER_MINUTE,
                                Duration.ofMinutes(1))
                        .build())
                .build();
    }

    private Bucket createEmailBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(MAX_EMAIL_REQUESTS_PER_MINUTE)
                        .refillGreedy(MAX_EMAIL_REQUESTS_PER_MINUTE,
                                Duration.ofMinutes(1))
                        .build())
                .build();
    }

    public boolean isAllowed(String clientIp, String targetEmail) {
        Bucket ipBucket = ipBuckets.computeIfAbsent(
                clientIp, k -> createIpBucket());
        Bucket emailBucket = emailBuckets.computeIfAbsent(
                targetEmail, k -> createEmailBucket());

        boolean ipAllowed = ipBucket.tryConsume(1);
        boolean emailAllowed = emailBucket.tryConsume(1);

        if (!ipAllowed) {
            log.warn("[RateLimit] IP 차단: {}", clientIp);
            securityMonitorService.trackAndAlert(
                    clientIp, "IP_RATE_LIMIT_EXCEEDED");
        }
        if (!emailAllowed) {
            log.warn("[RateLimit] EMAIL 차단: {}", targetEmail);
            securityMonitorService.trackAndAlert(
                    clientIp, "EMAIL_RATE_LIMIT_EXCEEDED");
        }

        return ipAllowed && emailAllowed;
    }
}

