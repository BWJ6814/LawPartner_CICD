package com.example.backend_main.common.util;

import jakarta.servlet.http.HttpServletRequest;

/*
 [IpUtil]
 클라이언트 IP 추출 공통 유틸
 - GlobalExceptionHandler, LogingAspect 양쪽에서 동일하게 사용
 - 중복 제거 목적
*/
public class IpUtil {

    private IpUtil() {} // 인스턴스 생성 방지

    public static String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");

        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip))
            ip = request.getHeader("Proxy-Client-IP");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip))
            ip = request.getHeader("WL-Proxy-Client-IP");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip))
            ip = request.getRemoteAddr();

        // 다중 프록시 환경: 첫 번째 IP가 진짜 클라이언트 IP
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }

        // IPv6 로컬 → IPv4 변환
        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) {
            ip = "127.0.0.1";
        }

        // ::ffff:192.168.x.x → 192.168.x.x 변환
        if (ip != null && ip.startsWith("::ffff:")) {
            ip = ip.substring(7);
        }

        return ip;
    }
}