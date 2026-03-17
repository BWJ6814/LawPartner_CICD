package com.example.backend_main.HSH.service;

import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.exception.CustomException;
import com.example.backend_main.common.exception.ErrorCode;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.common.util.HashUtil;
import com.example.backend_main.dto.HSH_DTO.FindIdRequestDto;
import com.example.backend_main.dto.HSH_DTO.FindPasswordRequestDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FindAccountService {

    private final UserRepository userRepository;
    private final HashUtil hashUtil;
    private final MailService mailService;
    private final PasswordEncoder passwordEncoder;

    /**
     * 아이디 찾기: 이름 + 전화번호(원본)를 받아 PHONE_HASH로 사용자 조회 후, 등록된 이메일로 아이디를 전송한다.
     */
    @Transactional
    public void sendUserIdByEmail(FindIdRequestDto dto) {
        String phoneHash = hashUtil.generateHash(dto.getPhone());

        Optional<User> optionalUser = userRepository.findByUserNmAndPhoneHash(dto.getUserNm(), phoneHash);
        if (optionalUser.isEmpty()) {
            throw new CustomException(ErrorCode.USER_NOT_FOUND, "입력하신 정보와 일치하는 계정을 찾을 수 없습니다.");
        }

        User user = optionalUser.get();
        String email = user.getEmail(); // Aes256Converter를 통한 자동 복호화
        mailService.sendFindIdMail(email, user.getUserId());
    }

    /**
     * 비밀번호 찾기: 아이디 + 이름 + 전화번호 + 이메일을 모두 검증 후,
     * 임시 비밀번호를 생성하여 저장(해시)하고, 이메일로 전송한다.
     * 저장 시 PW_CHANGE_REQUIRED = 'Y' 로 설정한다.
     */
    @Transactional
    public void resetPasswordAndSendTempPassword(FindPasswordRequestDto dto) {
        String phoneHash = hashUtil.generateHash(dto.getPhone());
        String emailHash = hashUtil.generateHash(dto.getEmail());

        Optional<User> optionalUser = userRepository.findByUserIdAndUserNmAndPhoneHashAndEmailHash(
                dto.getUserId(),
                dto.getUserNm(),
                phoneHash,
                emailHash
        );

        if (optionalUser.isEmpty()) {
            throw new CustomException(ErrorCode.USER_NOT_FOUND, "입력하신 정보와 일치하는 계정을 찾을 수 없습니다.");
        }

        User user = optionalUser.get();

        String tempPassword = generateTempPassword();
        String encoded = passwordEncoder.encode(tempPassword);

        user.setUserPw(encoded);
        user.setPwChangeRequired("Y");
        userRepository.updatePwChangeRequiredToY(user.getUserNo());

        String email = user.getEmail();
        mailService.sendTempPasswordMail(email, tempPassword);
    }

    /**
     * 영문 대소문자, 숫자를 섞은 임시 비밀번호 생성.
     */
    private String generateTempPassword() {
        final String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(12);
        for (int i = 0; i < 12; i++) {
            int idx = random.nextInt(chars.length());
            sb.append(chars.charAt(idx));
        }
        return sb.toString();
    }
}

