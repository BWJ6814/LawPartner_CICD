package com.example.backend_main.common.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 아이디/비밀번호 찾기 요청에 대한 이중 Rate Limiter.
 *
 * [잠금 1 - IP 기반] 1분 10회 제한
 * - NAT 환경에서는 네트워크 단위로 동작 (공유기 IP 기준)
 * - X-Forwarded-For 위조 방어를 위해 반드시 getRateLimitIp() 값을 전달받아야 함
 *
 * [잠금 2 - 이메일 기반] 1분 3회 제한
 * - NAT 뒤의 여러 컴퓨터가 같은 계정을 공격하는 경우 차단
 * - IP 관계없이 특정 계정을 보호하는 핵심 레이어
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccountRecoveryRateLimiter {

    private static final int MAX_IP_REQUESTS_PER_MINUTE    = 10;
    private static final int MAX_EMAIL_REQUESTS_PER_MINUTE = 3;

    private final Map<String, AtomicInteger> ipCountMap    = new ConcurrentHashMap<>();
    private final Map<String, AtomicInteger> emailCountMap = new ConcurrentHashMap<>();
    private final SecurityMonitorService securityMonitorService;

    /**
     * IP와 이메일 두 잠금을 모두 통과해야 true를 반환한다.
     *
     * @param clientIp    IpUtil.getRateLimitIp()로 추출한 TCP 연결 IP (위조 불가)
     * @param targetEmail 요청 대상 이메일 (계정 단위 잠금 키)
     */
    public boolean isAllowed(String clientIp, String targetEmail) {
        boolean ipAllowed    = checkLimit(ipCountMap,    clientIp,    MAX_IP_REQUESTS_PER_MINUTE,    "IP");
        boolean emailAllowed = checkLimit(emailCountMap, targetEmail, MAX_EMAIL_REQUESTS_PER_MINUTE, "EMAIL");
        return ipAllowed && emailAllowed;
    }

    private boolean checkLimit(Map<String, AtomicInteger> countMap, String key, int maxCount, String keyType) {
        if (key == null || key.isEmpty()) return true;

        countMap.putIfAbsent(key, new AtomicInteger(0));
        int current = countMap.get(key).incrementAndGet();

        if (current > maxCount) {
            log.warn("⚠️ [AccountRecoveryRateLimiter] {} '{}' 가 1분 내 {}회 초과 요청을 시도했습니다.", keyType, key, maxCount);
            if ("IP".equals(keyType)) {
                securityMonitorService.trackAndAlert(key, "ACCOUNT_RECOVERY_RATE_LIMIT");
            }
            return false;
        }
        return true;
    }

    /**
     * 1분마다 IP/이메일 카운터 모두 초기화.
     */
    @Scheduled(fixedRate = 60_000)
    public void resetCounters() {
        ipCountMap.clear();
        emailCountMap.clear();
    }
}

