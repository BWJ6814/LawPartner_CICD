package com.example.backend_main.HSH.controller;

import com.example.backend_main.HSH.service.AuthService;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.common.vo.ResultVO;
import com.example.backend_main.dto.TokenDTO;
import com.example.backend_main.dto.UserJoinRequestDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/*
 [AuthController]
 회원가입 및 로그인을 담당하는 컨트롤러!!!
 모든 응답은 ResultVO 표준 식판에 담겨 전송 처리 !!!

@RestController : 단순히 글자를 보여주는 것이 아닌, 데이터를 주고 받는 전문 창구!
@RequestMapping("/api/auth") : 인증(Auth)전용 구역임을 알려주는 표지판..! 모든 요청 주소는 /api/auth로 시작
@RequiredArgsConstructor : AuthService라는 강력한 조력자를 생성자 주입 방식으로 데려오기!
*/
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    /*
        [회원 가입 API] - USR-01
        @Valid : DTO에 적힌 유효성 검사(NotBlank, Email 등)를 실행합니다.
                 여기서 통과하지 못하면 중앙 통제실(GlobalExceptionHandler)가 즉각 개입하여 차단..!
        UserJoinRequestDTO : 사용자가 보낸 DTO
    */
    @PostMapping("/join")
    public ResultVO<Void> join(@Valid @ModelAttribute UserJoinRequestDTO dto) throws Exception {
        // AuthService : 데이터를 넘기는 곳, BCrypt와 AES-256 처리의 보안 작업..
        // "SUCCESS" 코드와 상세 메시지를 담아 반환
        authService.join(dto);
        return ResultVO.ok("JOIN-SUCCESS","회원가입이 성공적으로 완료되었습니다!",null);
    }

    /*
        [로그인 API]
        성공시 리액트에게 JWT 토큰을 전달하기..!
        요구사항 AUTH-01과 SEC-01
        1. 아이디 비밀번호 확인 : 리액트가 보낸 Map 데이터에서 아이디/비번을 꺼내 AuthService에게 확인
        2. 정보 일치시 JwtTokenProvider가 만든 신분증(JWT)를 TokenDTO라는 디지털 신분증으로 주기
        3. 발급된 신분증 안에는 사용자의 권한(ROLE_USER/ROLE_LAWYER/ROLE_ADMIN)인지 알 수 있음.
            - 페이지 접근 분기 처리..

    */
    @PostMapping("/login")
    public ResultVO<TokenDTO> login(@RequestBody Map<String, String> loginData) throws Exception {
        // 리액트에서 보낸 id와 pw를 꺼냅니다.
        // userID / userPw
        String userId = loginData.get("userId");
        String password = loginData.get("userPw");

        // 서비스를 통해 로그인을 진행하고 토큰을 받습니다.
        TokenDTO token = authService.login(userId, password);
        // 로그인 성공 코드 "LOGIN-SUCCESS" 부여
        return ResultVO.ok("LOGIN-SUCCESS","로그인에 성공하였습니다.", token);
    }

    @GetMapping("/check-id")
    public ResultVO<Boolean> checkId(@RequestParam("userId") String userId){
        // DB에 해당 아이디가 없어야 (exists == false) 사용 가능
        boolean isAvailable = !userRepository.existsByUserId(userId);
        // ★ [수정] ResponseEntity 대신 표준 식판 ResultVO로 통일!
        if (isAvailable) {
            return ResultVO.ok("ID-AVAILABLE", "사용 가능한 아이디입니다.", true);
        } else {
            // 중복된 경우 success: false와 전용 코드 반환
            return ResultVO.fail("ID-DUPLICATE", "이미 사용 중인 아이디입니다.");
        }
    }




}
