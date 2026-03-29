package com.example.backend_main.common.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 전역 레이트 리밋 필터는 Spring Security 체인에만 넣고, 서블릿 컨테이너에 이중 등록되지 않게 합니다.
 */
@Configuration
public class GlobalRateLimitFilterConfig {

    @Bean
    public GlobalRateLimitFilter globalRateLimitFilter(
            @Value("${app.security.global-rate-limit-per-minute:300}") int maxPerMinute) {
        return new GlobalRateLimitFilter(maxPerMinute);
    }

    @Bean
    public FilterRegistrationBean<GlobalRateLimitFilter> globalRateLimitFilterServletRegistration(
            GlobalRateLimitFilter filter) {
        FilterRegistrationBean<GlobalRateLimitFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }
}
