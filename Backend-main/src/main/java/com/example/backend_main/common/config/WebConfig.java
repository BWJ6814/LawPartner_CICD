package com.example.backend_main.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.profile.resource-location:file:///Z:/profile_images/}")
    private String profileResourceLocation;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 프론트에서 /images/profiles/어쩌고.jpg 요청 시 설정된 경로에서 이미지 제공 (application.properties에서 변경 가능)
        registry.addResourceHandler("/images/profiles/**")
                .addResourceLocations(profileResourceLocation);
    }
}