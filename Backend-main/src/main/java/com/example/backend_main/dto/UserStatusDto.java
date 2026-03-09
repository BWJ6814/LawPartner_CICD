package com.example.backend_main.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserStatusDto {
    @NotBlank(message = "대상 아이디는 필수입니다.")
    private String userId;

    @Pattern(regexp = "^S[0-9]{2}$", message = "상태 코드가 올바르지 않습니다. (예: S01, S02)")
    @NotBlank(message = "상태 코드는 필수입니다.")
    private String statusCode;

    @Size(min = 5, message = "사유는 최소 5자 이상 입력해야 합니다.")
    private String reason;
}