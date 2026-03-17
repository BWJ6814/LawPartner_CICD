package com.example.backend_main.common.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 아이디/비밀번호 찾기 요청에 대한 IP 기반 간단 Rate Limiter.
 * - 동일 IP 기준 1분 동안 5회까지 허용, 6번째부터는 차단.
 * - TB_IP_BLACKLIST에는 영구 등록하지 않고, 메모리 카운트만 1분마다 초기화.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccountRecoveryRateLimiter {

    private static final int MAX_REQUESTS_PER_MINUTE = 5;

    private final Map<String, AtomicInteger> requestCountMap = new ConcurrentHashMap<>();
    private final SecurityMonitorService securityMonitorService;

    /**
     * 주어진 IP의 요청이 허용되는지 여부를 판단한다.
     * 1분 내 호출 횟수가 5회를 초과하면 false를 반환하고, 보안 모니터링에 이벤트를 남긴다.
     */
    public boolean isAllowed(String clientIp) {
        if (clientIp == null || clientIp.isEmpty()) {
            return true;
        }

        requestCountMap.putIfAbsent(clientIp, new AtomicInteger(0));
        int current = requestCountMap.get(clientIp).incrementAndGet();

        if (current > MAX_REQUESTS_PER_MINUTE) {
            log.warn("⚠️ [AccountRecoveryRateLimiter] IP {} 가 1분 내 {}회 이상 계정 찾기 요청을 시도했습니다.", clientIp, MAX_REQUESTS_PER_MINUTE);
            securityMonitorService.trackAndAlert(clientIp, "ACCOUNT_RECOVERY_RATE_LIMIT");
            return false;
        }

        return true;
    }

    /**
     * 1분마다 카운터 초기화.
     */
    @Scheduled(fixedRate = 60_000)
    public void resetCounters() {
        requestCountMap.clear();
    }
}

