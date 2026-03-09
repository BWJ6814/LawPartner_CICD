package com.example.backend_main.HSH.service;

import com.example.backend_main.common.entity.RefreshToken;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.repository.RefreshTokenRepository;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.common.security.JwtTokenProvider;
import com.example.backend_main.common.util.Aes256Util;
import com.example.backend_main.common.util.HashUtil;
import com.example.backend_main.dto.HSH_DTO.TokenDTO;
import com.example.backend_main.dto.HSH_DTO.UserJoinRequestDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
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
    private final RefreshTokenRepository refreshTokenRepository;

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
    @Transactional
    public TokenDTO login(String userId, String password) {

        // 1. 비즈니스 로직: 유저 찾기 (예외 메시지는 보안상 똑같이 맞춤)
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 계정이거나 비밀번호가 틀렸습니다."));

        // 2. 비즈니스 로직: 비밀번호 대조
        if (!passwordEncoder.matches(password, user.getUserPw())) {
            throw new IllegalArgumentException("가입되지 않은 계정이거나 비밀번호가 틀렸습니다.");
        }

        // 3. 비즈니스 로직: 상태 검사
        if ("S03".equals(user.getStatusCode())) {
            throw new IllegalStateException("해당 계정은 이용이 정지되었습니다. 관리자에게 문의하세요.");
        }

        // 4. 복호화 처리
        String decryptedEmail;
        try {
            decryptedEmail = aes256Util.decrypt(user.getEmail());
        } catch (Exception e) {
            log.error("🚨 [Decryption Error] 유저명 '{}'의 이메일 복호화 실패: {}", user.getUserId(), e.getMessage());
            throw new RuntimeException("시스템 오류가 발생했습니다. 관리자에게 문의해주세요.");
        }

        // 5. 토큰 생성
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                decryptedEmail,
                null,
                List.of(new SimpleGrantedAuthority(user.getRoleCode()))
        );

        TokenDTO tokenDTO = jwtTokenProvider.createToken(
                authentication, user.getUserNo(), user.getUserNm(), user.getNickNm()
        );

        // 6. ✅ RefreshToken DB 저장 (토큰 재발급 검증용)
        refreshTokenService.saveRefreshToken(user.getUserNo(), tokenDTO.getRefreshToken());

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
    
    // 아이디 중복 확인 로직
    public boolean isUserIdAvailable(String userId){
        // 나중에 "탈퇴한 회원 아이디는 30일간 재사용 금지" 같은 규칙이 생겨도 여기만 고치면 됨!
        return !userRepository.existsByUserId(userId);
    }

    // 이메일 중복 확인 로직 (해싱 포함)
    public boolean isEmailAvailable(String email){
        // 해싱 로직(요리법)은 셰프(Service)의 몫!
        String emailHash = hashUtil.generateHash(email);
        return !userRepository.existsByEmailHash(emailHash);
    }

    // 휴대폰 번호 중복 확인 로직 (해싱 포함)
    public boolean isPhoneAvailable(String phone){
        String phoneHash = hashUtil.generateHash(phone);
        return !userRepository.existsByPhoneHash(phoneHash);
    }


    // 리프레시 토큰 재발급 처리.
    @Transactional // DB 조작이 들어가므로 트랜잭션 필수!
    public TokenDTO refresh(String oldRefreshToken) {

        // 1. 토큰 자체의 유효성 검사 (서명, 만료)
        if (!jwtTokenProvider.validateToken(oldRefreshToken)) {
            throw new IllegalArgumentException("리프레시 토큰이 만료되었거나 유효하지 않습니다.");
        }

        // 2. 토큰에서 추출 (★ 수정: 이제 토큰의 주인은 userId가 아니라 '이메일'입니다!)
        String email = jwtTokenProvider.parseClaims(oldRefreshToken).getSubject();

        // 3. DB에서 유저 최신 정보 조회 (★ 수정: 평문 이메일을 해시로 변환하여 DB와 대조!)
        String emailHash = hashUtil.generateHash(email);
        User user = userRepository.findByEmailHash(emailHash)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if ("S03".equals(user.getStatusCode()) || "S99".equals(user.getStatusCode())) {
            throw new IllegalArgumentException("이용이 정지되거나 탈퇴한 계정입니다.");
        }

        // 4. 저장소 대조 (보안 핵심!)
        RefreshToken savedToken = refreshTokenRepository.findByUserNo(user.getUserNo())
                .orElseThrow(() -> new IllegalArgumentException("로그아웃 된 사용자입니다. 다시 로그인해주세요."));

        if (!savedToken.getTokenValue().equals(oldRefreshToken)) {
            // 탈취 의심 시 즉시 DB에서 해당 토큰을 날려버려 강제 로그아웃 처리
            refreshTokenRepository.delete(savedToken);
            throw new IllegalArgumentException("탈취된 토큰이 의심됩니다. 다시 로그인해주세요.");
        }

        // 5. 새로운 권한 객체 생성 (★ 수정: 새로운 토큰의 주인도 똑같이 '이메일'로 박아줍니다!)
        List<SimpleGrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority(user.getRoleCode())
        );
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(email, null, authorities);

        // 6. 새로운 토큰 세트(Access + Refresh) 발급
        TokenDTO newTokenDTO = jwtTokenProvider.createToken(
                auth, user.getUserNo(), user.getUserNm(), user.getNickNm()
        );

        // ==========================================================
        // ★ Refresh Token Rotation (기존 토큰 폐기)
        // ==========================================================
        LocalDateTime newExpireDt = LocalDateTime.now().plusDays(7);
        savedToken.updateToken(newTokenDTO.getRefreshToken(), newExpireDt);

        // 7. 새로 발급된 토큰 객체 딱 하나만 깔끔하게 반환!
        return newTokenDTO;
    }
}