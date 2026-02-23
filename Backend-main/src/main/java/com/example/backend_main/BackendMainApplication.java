package com.example.backend_main;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing // ★★★ 이 어노테이션이 반드시 있어야 시간이 자동으로 들어갑니다! (이게 빠져서 빵꾸가 났을 확률 99%)
@SpringBootApplication
public class BackendMainApplication {
    public static void main(String[] args) {
        SpringApplication.run(BackendMainApplication.class, args);
    }
}
