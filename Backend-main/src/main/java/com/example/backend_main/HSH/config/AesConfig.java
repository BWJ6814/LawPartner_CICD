package com.example.backend_main.HSH.config;

import com.example.backend_main.common.util.Aes256Util;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class AesConfig {

    @Value("${encryption.aes256.key}")
    private String newKey;

    @Value("${encryption.aes256.old-key}")
    private String oldKey;


    // 현재 사용하는 신규 키 전용 유틸
    @Bean(name = "newAesUtil")
    @Primary
    public Aes256Util newAesUtil() {
        return new Aes256Util(newKey);
    }

    // 마이그레이션용 구형 키 전용 유틸
    @Bean(name = "oldAesUtil")
    public Aes256Util oldAesUtil() {
        return new Aes256Util(oldKey);
    }
}