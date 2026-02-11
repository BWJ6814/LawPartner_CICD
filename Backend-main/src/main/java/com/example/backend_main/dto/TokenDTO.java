package com.example.backend_main.dto;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TokenDTO {
    // "Bearer"라는 인증 방식 명시
    private String grantType;
    // 실제 문을 열 때 쓰는 단거리 통행증
    private String accessToken;
    // Access Token이 만료되면 교환할 때 쓰는 장기 통행증
    private String refreshToken;
    private String userNm;
    private String role;
}
