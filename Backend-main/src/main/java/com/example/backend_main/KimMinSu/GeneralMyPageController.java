package com.example.backend_main.KimMinSu;

import com.example.backend_main.common.security.JwtTokenProvider;
import com.example.backend_main.common.vo.ResultVO;
import com.example.backend_main.dto.GeneralMyPageDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/mypage")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class GeneralMyPageController {

    private final GeneralMyPageService myPageService;
    private final JwtTokenProvider jwtTokenProvider; // ★ 신분증 해독기 추가

    @GetMapping("/general")
    // ★ 리턴 타입을 팀 표준인 ResultVO로 변경
    public ResultVO<GeneralMyPageDTO> getGeneralDashboard(
            @RequestHeader(value = "Authorization") String token
    ) {
        // 1. "Bearer " 글자 떼어내기 (순수 토큰만 추출)
        String actualToken = token;
        if(token != null && token.startsWith("Bearer ")) {
            actualToken = token.substring(7);
        }

        // 2. 신분증에서 진짜 로그인한 유저 번호(userNo) 꺼내기
        Long userNo = jwtTokenProvider.getUserNoFromToken(actualToken);

        System.out.println("마이페이지 데이터 요청 들어옴! 진짜 UserNo: " + userNo);

        // 3. 서비스 호출 (진짜 DB 데이터 가져오기)
        GeneralMyPageDTO data = myPageService.getDashboardData(userNo);

        // 4. ResultVO 표준 식판에 담아서 반환
        return ResultVO.ok("마이페이지 조회 성공", data);
    }
}