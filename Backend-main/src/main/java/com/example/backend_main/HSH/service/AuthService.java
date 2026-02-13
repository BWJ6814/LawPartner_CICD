package com.example.backend_main.HSH.service;

import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.common.security.JwtTokenProvider;
import com.example.backend_main.common.util.Aes256Util;
import com.example.backend_main.common.util.HashUtil;
import com.example.backend_main.dto.TokenDTO;
import com.example.backend_main.dto.UserJoinRequestDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
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
@Slf4j
public class AuthService {
    // 미리 준비한 3가지 핵심 도구를 의존성 설정!
    private final UserRepository userRepository;        // DB 창고 관리자
    private final Aes256Util aes256Util;                // PII 전용 암호기
    private final JwtTokenProvider jwtTokenProvider;    // 신분증(토큰) 발급기
    private final PasswordEncoder passwordEncoder;      // 비밀번호 전용 보초
    private final LawyerService lawyerService;
    private final RefreshTokenService refreshTokenService;
    private final HashUtil hashUtil;                    // 단방향 해시 처리 (검색용)

    /*
     [회원가입] USR-01 요구사항 반영
     비밀번호는 BCrypt로, 이메일/폰은 AES-256으로 암호화하여 저장합니다.
     */
    @Transactional
    public void join(UserJoinRequestDTO dto) throws Exception {


        // 1-1. 아이디 중복 체크
        // DB창고 userRepository에 가서 아이디(UserId)를 이미 사용하는 사람이 있는지 확인하기..
        if (userRepository.existsByUserId(dto.getUserId())) {
            // IllegalArgumentException : 너가 보낸 데이터가 우리 시스템 규칙에 안 맞아!
            // RuntimeException         : 원인은 모르겠지만 실행 중에 터졌다
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }
        // 1-2. 중복 체크를 해시값으로 수행하기
        String inputEmailHash = hashUtil.generateHash(dto.getEmail());
        String inputPhoneHash = hashUtil.generateHash(dto.getPhone());

        if (userRepository.existsByEmailHash(inputEmailHash)) {
            throw new IllegalArgumentException("이미 가입된 이메일입니다.");
        }
        if (userRepository.existsByPhoneHash(inputPhoneHash)) {
            throw new IllegalArgumentException("이미 가입된 휴대폰 번호입니다.");
        }

        // 1-3 닉네임 결정 및 중복 체크 로직
        String finalNickname = determineNickname(dto);

        // 결정된 닉네임이 DB에 있는지 확인
        if (userRepository.existsByNickNm(finalNickname)) {
            // 변호사의 경우 실명이 중복된 것이므로 메시지를 다르게 줄 수도 있음
            throw new IllegalArgumentException("이미 사용 중인 닉네임(또는 이름)입니다.");
        }



        // 2. 암호화 도구(CryptoUtil/BCrypt)를 사용해 데이터 변환
        // 비밀번호 : 해싱 (복호화 불가능)
        // 이메일/전화번호 : AES-256 암호화 (복호화 가능)
        String hashedPw = passwordEncoder.encode(dto.getUserPw()); // 비번 으깨기 (BCrypt)
        String encryptedEmail = aes256Util.encrypt(dto.getEmail()); // 이메일 잠그기 (AES)
        String encryptedPhone = aes256Util.encrypt(dto.getPhone()); // 전화번호 잠그기 (AES)

        // 분기처리 하기 위한 코드 설정
        String initialRole = dto.getRoleCode();
        String initialStatus = "S01"; // 기본: 정상 활동

        // 변호사(ROLE_LAWYER)로 가입 신청 시 -> '준회원'으로 강등 및 '대기' 상태로 설정
        if ("ROLE_LAWYER".equals(dto.getRoleCode())) {
            initialRole = "ROLE_ASSOCIATE"; // 준회원 (권한 없음)
            initialStatus = "S02";          // 승인 대기 상태
        }
        // 3. 시민 명부(Entity)에 담기
        User user = User.builder()
                .userId(dto.getUserId())    // 아이디
                .userPw(hashedPw)           // 해시 처리된 비번
                .userNm(dto.getUserNm())    // 이름
                .nickNm(finalNickname)      // 닉네임
                .email(encryptedEmail)      // 암호화된 이메일
                .emailHash(inputEmailHash)  // Hash 값 (검색용)
                .phone(encryptedPhone)      // 암호화된 휴대폰 번호
                .phoneHash(inputPhoneHash)  // Hash 값 (검색용)
                .roleCode(initialRole)      // ROLE_USER 또는 ROLE_LAWYER
                .statusCode(initialStatus)  // 상태 (정상)
                .build();

        userRepository.save(user);
        if (user.isLawyer()) {
            log.info("⚖️ [변호사 회원가입] 상세 정보 및 전문 분야 등록을 시작합니다. (대상: {})", user.getUserId());
            // 변호사일 때만 실행되므로, 일반 유저 가입 시에는 IMG_URL 등을 건드리지 않습니다.
            lawyerService.registerLawyerInfo(user, dto);
        } else {
            log.info("👤 [일반 회원가입] 추가 상세 정보 없이 가입을 완료합니다. (대상: {})", user.getUserId());
        }
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
                .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 일치하지 않습니다."));

        // 2. 비밀번호 확인
        // matches(방금 입력한 비번, DB에 저장된 비번)
        // 이 두개를 넣으면 스프링이 같으면 true / 다르면 false를 알려줍니다.
        if (!passwordEncoder.matches(password, user.getUserPw())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 일치하지 않습니다.");
        }

        // 3. [핵심] 이메일 복호화 (JWT의 식별자로 사용하기 위해)
        // DB에 잠겨있던 이메일을 해독기(decrypt)로 풀어서 꺼내기..
        String decryptedEmail = aes256Util.decrypt(user.getEmail());

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

        // 5. 토큰 발급 후 추가 정보를 주머니에 담기!
        TokenDTO tokenDTO = jwtTokenProvider.createToken(authentication, user.getUserNo(), user.getUserNm());
        tokenDTO.setUserNm(user.getUserNm()); // 이제 리액트에서 undefined가 안 뜹니다!
        tokenDTO.setRole(user.getRoleCode()); // RBAC 설계도에 따른 권한 전송
        tokenDTO.setEmail(decryptedEmail);  // 복호화된 진짜 이메일
        tokenDTO.setUserNo(user.getUserNo()); // DB 고유 번호

        // ★ [REQ-SEC-02] 중복 로그인 차단 및 토큰 DB 저장은 추후 활성화 예정
        // 현재는 토큰 발급 후 리액트로 전달만 하고, DB 기록은 생략합니다.
        refreshTokenService.saveRefreshToken(user.getUserNo(), tokenDTO.getRefreshToken());

        log.info("★ 로그인 성공 ★ : {} ({})", user.getUserId(), user.getUserNm());
        // 6. 마지막으로 이메일이 담긴 명찰로 토큰 발급!
        return tokenDTO;
    }
    // =================================================================================
    // [내부 헬퍼 메서드] 닉네임 결정 로직
    // =================================================================================
    private String determineNickname(UserJoinRequestDTO dto) {
        // user의 isLawyer()을 못 쓰는 이유 : 분기가 다르기 때문에.
        // dto.isLawyer() : join - 새로 만들기 때문에, 만들 dto에서 처리하는 것이 분기에 적합.
        // user.isLawyer() : login - 이미 존재하는 계정이기 때문에 user의 엔티티 사용
        if (dto.isLawyer()) {
            // [변호사] 닉네임 = 실명 (강제 설정)
            return dto.getUserNm();
        } else {
            // [일반 유저] 닉네임 = 입력값 (유효성 검사 필수)
            if (dto.getNickNm() == null || dto.getNickNm().trim().isEmpty()) {
                throw new IllegalArgumentException("일반 회원은 닉네임을 반드시 입력해야 합니다.");
            }
            return dto.getNickNm();
        }
    }

}