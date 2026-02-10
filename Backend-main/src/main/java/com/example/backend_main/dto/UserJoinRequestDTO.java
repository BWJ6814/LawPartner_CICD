package com.example.backend_main.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UserJoinRequestDTO {
    // errorMessage 처리 내용
    @NotBlank(message = "이메일은 필수 입력 항목입니다.")
    // 형식이 틀리면 이 메시지를 가져오기.
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;

    // 사이즈가 틀릴경우 여기서 가져옵니다.
    @Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다.")
    private String password;
}
