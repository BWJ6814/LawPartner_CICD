package com.example.backend_main.common.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class AccountRecoveryRateLimiter {

    private final SecurityMonitorService securityMonitorService;

    private static final int MAX_IP_REQUESTS_PER_MINUTE = 10;
    private static final int MAX_EMAIL_REQUESTS_PER_MINUTE = 3;
    private static final int MAX_IDENTIFIER_REQUESTS_PER_MINUTE = 5;

    // IP별 버킷 저장소
    private final Map<String, Bucket> ipBuckets = new ConcurrentHashMap<>();
    // EMAIL별 버킷 저장소
    private final Map<String, Bucket> emailBuckets = new ConcurrentHashMap<>();
    // USER_ID별 버킷 저장소
    private final Map<String, Bucket> identifierBuckets = new ConcurrentHashMap<>();
    private final Map<String, Instant> bucketCreatedAt = new ConcurrentHashMap<>();

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

    private Bucket createIdentifierBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(MAX_IDENTIFIER_REQUESTS_PER_MINUTE)
                        .refillGreedy(MAX_IDENTIFIER_REQUESTS_PER_MINUTE,
                                Duration.ofMinutes(1))
                        .build())
                .build();
    }

    public boolean isAllowed(String clientIp, String targetEmail) {
        Bucket ipBucket = ipBuckets.computeIfAbsent(clientIp, k -> {
            bucketCreatedAt.put(k, Instant.now());
            return createIpBucket();
        });
        Bucket emailBucket = emailBuckets.computeIfAbsent(targetEmail, k -> {
            bucketCreatedAt.put(k, Instant.now());
            return createEmailBucket();
        });

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

    public boolean isAllowedLogin(String clientIp, String userId) {
        Bucket ipBucket = ipBuckets.computeIfAbsent(clientIp, k -> {
            bucketCreatedAt.put(k, Instant.now());
            return createIpBucket();
        });
        Bucket identifierBucket = identifierBuckets.computeIfAbsent(userId, k -> {
            bucketCreatedAt.put(k, Instant.now());
            return createIdentifierBucket();
        });

        boolean ipAllowed = ipBucket.tryConsume(1);
        boolean identifierAllowed = identifierBucket.tryConsume(1);

        if (!ipAllowed) {
            log.warn("[RateLimit] 로그인 IP 차단: {}", clientIp);
            securityMonitorService.trackAndAlert(clientIp, "LOGIN_IP_RATE_LIMIT_EXCEEDED");
        }
        if (!identifierAllowed) {
            log.warn("[RateLimit] 로그인 UserId 차단: {}", userId);
            securityMonitorService.trackAndAlert(clientIp, "LOGIN_ID_RATE_LIMIT_EXCEEDED");
        }

        return ipAllowed && identifierAllowed;
    }

    @Scheduled(fixedRate = 300_000)
    public void cleanUpExpiredBuckets() {
        Instant threshold = Instant.now().minusSeconds(300);

        ipBuckets.entrySet().removeIf(e ->
                bucketCreatedAt.getOrDefault(e.getKey(), Instant.EPOCH).isBefore(threshold));
        emailBuckets.entrySet().removeIf(e ->
                bucketCreatedAt.getOrDefault(e.getKey(), Instant.EPOCH).isBefore(threshold));
        identifierBuckets.entrySet().removeIf(e ->
                bucketCreatedAt.getOrDefault(e.getKey(), Instant.EPOCH).isBefore(threshold));
        bucketCreatedAt.entrySet().removeIf(e ->
                e.getValue().isBefore(threshold));

        log.info("[RateLimit] 만료 버킷 정리 완료");
    }
}

