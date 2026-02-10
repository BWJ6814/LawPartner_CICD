package com.example.backend_main.service;

import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.common.security.JwtTokenProvider;
import com.example.backend_main.common.util.CryptoUtil;
import com.example.backend_main.dto.TokenDTO;
import com.example.backend_main.dto.UserJoinRequestDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final CryptoUtil cryptoUtil;
    private final JwtTokenProvider jwtTokenProvider;

    /*
     [회원가입] USR-01 요구사항 반영
     비밀번호는 BCrypt로, 이메일/폰은 AES-256으로 암호화하여 저장합니다.
     */
    @Transactional
    public void join(UserJoinRequestDTO dto) throws Exception {
        // 1. 아이디 중복 체크
        if (userRepository.existsByUserId(dto.getUserId())) {
            throw new RuntimeException("이미 사용 중인 아이디입니다.");
        }

        // 2. 암호화 도구(CryptoUtil)를 사용해 데이터 변환
        String hashedPw = cryptoUtil.hashPassword(dto.getUserPw()); // 비번 으깨기 (BCrypt)
        String encryptedEmail = cryptoUtil.encrypt(dto.getEmail()); // 이메일 잠그기 (AES)
        String encryptedPhone = cryptoUtil.encrypt(dto.getPhone()); // 전화번호 잠그기 (AES)

        // 3. 시민 명부(Entity)에 담기
        User user = User.builder()
                .userId(dto.getUserId())
                .userPw(hashedPw)
                .userNm(dto.getUserNm())
                .email(encryptedEmail)
                .phone(encryptedPhone)
                .roleCode(dto.getRoleCode()) // ROLE_ADMIN 이면 관리자로 가입!
                .build();

        // 4. DB 창고에 저장 [
        userRepository.save(user);
    }

    /*
     [로그인] AUTH-01 & SEC-01 요구사항 반영
     아이디/비번을 검증하고 Access/Refresh Token을 발급합니다.
     */
    public TokenDTO login(String userId, String password) throws Exception {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("아이디 또는 비밀번호가 일치하지 않습니다."));

        if (!cryptoUtil.checkPassword(password, user.getUserPw())) {
            throw new RuntimeException("아이디 또는 비밀번호가 일치하지 않습니다.");
        }

        // 성문의 공식 명찰(Authentication)을 만듭니다.
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                user.getUserId(),
                null,
                List.of(new SimpleGrantedAuthority(user.getRoleCode()))
        );

        // 이제 공식 명찰을 발급기(Provider)에 전달합니다. [cite: 2026-01-30]
        return jwtTokenProvider.createToken(authentication);
    }
}