package com.example.backend_main.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

/*
    [UserJoinRequestDTO]
    리액트에서 보낸 가입 정보를 담아 AuthService로 전달하는 바구니입니다.
    @Builder를 추가하여 서비스 단에서 다루기 편하게 만들었습니다.
*/
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserJoinRequestDTO {

    @NotBlank(message = "아이디는 필수 입력 항목입니다.")
    private String userId;

    @NotBlank(message = "비밀번호는 필수 입력 항목입니다.")
    @Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다.")
    private String userPw;

    @NotBlank(message = "이름은 필수 입력 항목입니다.")
    private String userNm;

    @NotBlank(message = "이메일은 필수 입력 항목입니다.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;

    @NotBlank(message = "전화번호는 필수 입력 항목입니다.")
    @Pattern(regexp = "^[0-9]{10,11}$", message = "올바른 전화번호 형식이 아닙니다.")
    private String phone;

    private String nickNm; // 별칭 - 추후에 개인 설정으로 처리 가능
    private String imgUrl;  // 변호사 이미지 URL
    // ROLE_USER, ROLE_LAWYER, ROLE_ADMIN
    private String roleCode;

    // --- [변호사 가입 시에만 사용하는 필드들] ---
    private String licenseNo;    // 자격번호
    private MultipartFile licenseFile;  // 증빙파일 경로
    private String officeName;   // 소속 로펌
    private String officeAddr;   // 사무실 주소
    private String examType;     // 출신 (사시/로스쿨)
    private String introText;    // 자기소개
    private String specialtyStr; // 전문분야 리스트 (L01, L02 등)

    // 가입 로직(AuthService)에서 아직 User 객체를 만들기 전에 사용하기..!
    public boolean isLawyer() {
        return "ROLE_LAWYER".equals(this.roleCode);
    }
}