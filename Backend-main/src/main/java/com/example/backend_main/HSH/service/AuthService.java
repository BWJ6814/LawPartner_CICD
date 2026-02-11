package com.example.backend_main.HSH.service;

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

/*
이 클래스는 시스템에 들어오려는 사람들의 서류를 검사 및 통행증 발급해주는 사령부!
@RequiredArgsConstructor : 필요한 도구들(final)을 스프링이 자동으로 배치해도록 해주는 어노테이션
@Transactional(readOnly = true) : 기본적으로는 읽기 전용 모드로 안전하게 운영하기..! + 원자성!

*/
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {
    // 미리 준비한 3가지 핵심 도구를 의존성 설정!
    private final UserRepository userRepository;        // DB 창고 관리자
    private final CryptoUtil cryptoUtil;                // 암호화/해독 전문가
    private final JwtTokenProvider jwtTokenProvider;    // 신분증(토큰) 발급기

    /*
     [회원가입] USR-01 요구사항 반영
     비밀번호는 BCrypt로, 이메일/폰은 AES-256으로 암호화하여 저장합니다.
     */
    @Transactional
    public void join(UserJoinRequestDTO dto) throws Exception {
        // 1. 아이디 중복 체크
        // DB창고 userRepository에 가서 아이디(UserId)를 이미 사용하는 사람이 있는지 확인하기..
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
        // 1. 아이디로 유저 찾기 (로그인 입력값 활용)
        // 입력받은 아이디로 DB에서 해당 시민(User 객체)을 가져오기
        // 아이디가 없어도 아이디가 없습니다..! 라고 보내주는 것이 아닌 아이디/비밀번호 통째로 불일치 처리..
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("아이디 또는 비밀번호가 일치하지 않습니다."));

        // 2. 비밀번호 확인
        if (!cryptoUtil.checkPassword(password, user.getUserPw())) {
            throw new RuntimeException("아이디 또는 비밀번호가 일치하지 않습니다.");
        }

        // 3. [핵심] 이메일 복호화 (JWT의 식별자로 사용하기 위해)
        // DB에 잠겨있던 이메일을 해독기(decrypt)로 풀어서 꺼내기..
        String decryptedEmail = cryptoUtil.decrypt(user.getEmail());

        // 4. 복호화된 이메일을 담은 공식 명찰(Authentication) 생성
        // user.getUserId() 대신 decryptedEmail을 첫 번째 인자로 넣습니다.
        // 스프링 시큐리티가 이해할 수 있는 규격의 임시 명찰 만들기..! (사용자의 권한 정보도 함께)
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                // 신분증 주인 이름(이메일)
                decryptedEmail,
                null,
                // 부여할 권한 배지 (예: ROLE_ADMIN)
                List.of(new SimpleGrantedAuthority(user.getRoleCode()))
        );
        // 5. 마지막으로 이메일이 담긴 명찰로 토큰 발급!
        return jwtTokenProvider.createToken(authentication);
    }
}