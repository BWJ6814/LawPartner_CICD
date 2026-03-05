package com.example.backend_main.common.config; // 패키지명은 너네 구조에 맞게

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 프론트에서 /images/profiles/어쩌고.jpg 라고 요청하면
        // Z드라이브(Z:/profile_images/) 폴더를 뒤져서 이미지를 갖다 바침
        registry.addResourceHandler("/images/profiles/**")
                .addResourceLocations("file:///Z:/profile_images/");
    }
}