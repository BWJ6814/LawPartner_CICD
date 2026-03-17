package com.example.backend_main.dto.HSH_DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FindIdRequestDto {

    @NotBlank(message = "이름을 입력해주세요.")
    private String userNm;

    @NotBlank(message = "전화번호를 입력해주세요.")
    private String phone;
}

