package com.example.backend_main.HSH.config;

import com.example.backend_main.HSH.service.KeyRotationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class ForceExecuteConfig {

    private final KeyRotationService keyRotationService;

    @Bean
    public CommandLineRunner executeNow() {
        return args -> {
            log.info("⚠️ [강제 실행] 서버 기동과 동시에 키 로테이션을 시작합니다!");
            try {
                keyRotationService.rotateKeys();
                log.info("✅ [강제 실행] 성공적으로 완료되었습니다.");
            } catch (Exception e) {
                log.error("❌ [강제 실행] 실패: {}", e.getMessage());
            }
        };
    }
}