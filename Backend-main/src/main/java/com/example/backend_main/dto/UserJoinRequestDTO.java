package com.example.backend_main.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter // AuthService의 빨간불을 꺼주는 마법의 도구!
@NoArgsConstructor
@AllArgsConstructor
public class UserJoinRequestDTO {

    @NotBlank(message = "아이디는 필수 입력 항목입니다.")
    private String userId;

    @NotBlank(message = "비밀번호는 필수 입력 항목입니다.")
    @Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다.")
    private String userPw; // AuthService와 이름을 맞췄습니다.

    @NotBlank(message = "이름은 필수 입력 항목입니다.")
    private String userNm;

    @NotBlank(message = "이메일은 필수 입력 항목입니다.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;

    @NotBlank(message = "전화번호는 필수 입력 항목입니다.")
    @Pattern(regexp = "^[0-9]{10,11}$", message = "올바른 전화번호 형식이 아닙니다.")
    private String phone;

    // ROLE_USER 또는 ROLE_ADMIN
    private String roleCode;
}