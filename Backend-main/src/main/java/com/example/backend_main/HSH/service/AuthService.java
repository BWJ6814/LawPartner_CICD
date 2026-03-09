package com.example.backend_main.HSH.service;

import com.example.backend_main.common.entity.RefreshToken;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.exception.CustomException;
import com.example.backend_main.common.exception.ErrorCode;
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


    /*
 [회원가입] USR-01 요구사항 반영
 비밀번호는 BCrypt로, 이메일/폰은 AES-256으로 암호화하여 저장합니다.
 */
    @Transactional
    public void join(UserJoinRequestDTO dto) {
        // 1. 왜? 'throws Exception'이 사라짐으로써 메서드가 가벼워졌습니다.
        log.info("📝 [회원가입 시작] ID: {}", dto.getUserId());

        // 1-1. 아이디 중복 체크
        if (userRepository.existsByUserId(dto.getUserId())) {
            throw new CustomException(ErrorCode.DUPLICATE_USER_ID);
        }

        // 1-2. 이메일/폰 중복 체크 (해시값 기준)
        String inputEmailHash = hashUtil.generateHash(dto.getEmail());
        String inputPhoneHash = hashUtil.generateHash(dto.getPhone());

        if (userRepository.existsByEmailHash(inputEmailHash)) {
            throw new CustomException(ErrorCode.DUPLICATE_EMAIL);
        }
        if (userRepository.existsByPhoneHash(inputPhoneHash)) {
            throw new CustomException(ErrorCode.DUPLICATE_PHONE);
        }

        // 1-3 닉네임 중복 체크 및 결정
        String finalNickname = determineNickname(dto);
        if (userRepository.existsByNickNm(finalNickname)) {
            throw new CustomException(ErrorCode.INVALID_INPUT, "이미 사용 중인 닉네임입니다.");
        }

        // 2. 보안 데이터 암호화 (PII)
        String hashedPw = passwordEncoder.encode(dto.getUserPw());
        String encryptedEmail;
        String encryptedPhone;

        try {
            encryptedEmail = aes256Util.encrypt(dto.getEmail());
            encryptedPhone = aes256Util.encrypt(dto.getPhone());
        } catch (Exception e) {
            log.error("🚨 [암호화 실패] ID: {}, 사유: {}", dto.getUserId(), e.getMessage());
            throw new CustomException(ErrorCode.ENCRYPTION_ERROR);
        }

        // 3. 권한 및 상태 결정 로직 (변수 선언 포함)
        // 파트너님, 이 변수들은 여기서 선언되어 빌더에 들어갑니다.
        String initialRole = dto.getRoleCode();
        String initialStatus = "S01"; // 기본: 정상 활동

        // 변호사(ROLE_LAWYER)로 가입 신청 시 -> '준회원'으로 권한 조정 및 '대기' 상태 설정
        if ("ROLE_LAWYER".equals(dto.getRoleCode())) {
            initialRole = "ROLE_ASSOCIATE";
            initialStatus = "S02";
        }

        // 4. Entity 생성 및 저장 (불필요한 try-catch 제거로 가독성 향상)
        User user = User.builder()
                .userId(dto.getUserId())
                .userPw(hashedPw)
                .userNm(dto.getUserNm())
                .nickNm(finalNickname)
                .email(encryptedEmail)
                .emailHash(inputEmailHash)
                .phone(encryptedPhone)
                .phoneHash(inputPhoneHash)
                .roleCode(initialRole)
                .statusCode(initialStatus)
                .build();

        userRepository.save(user);

        // 5. 후속 처리
        if (user.isLawyer()) {
            log.info("⚖️ [변호사 회원가입] 상세 정보 등록 시작: {}", user.getUserId());
            lawyerService.registerLawyerInfo(user, dto);
        }

        log.info("✅ [회원가입 완료] 유저 No: {}", user.getUserNo());
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
        RefreshToken savedToken = refreshTokenService.findByUserNo(user.getUserNo());

        if (!savedToken.getTokenValue().equals(oldRefreshToken)) {
            // 탈취 의심 시 즉시 DB에서 해당 토큰을 날려버려 강제 로그아웃 처리
            refreshTokenService.deleteToken(savedToken);
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