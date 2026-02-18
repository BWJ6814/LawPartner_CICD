package com.example.backend_main.KimMinSu;

import com.example.backend_main.common.entity.CalendarEvent;
import com.example.backend_main.common.security.JwtTokenProvider;
import com.example.backend_main.common.vo.ResultVO;
import com.example.backend_main.dto.GeneralMyPageDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @PostMapping("/calendar")
    public ResultVO<Long> addCalendarEvents(
            @RequestHeader(value = "Authorization") String token,
            @RequestBody GeneralMyPageDTO.CalendarEventDTO dto
    ){
        // 1. token에서 실제 userNo를 추출한다.
        String actualToken = token;
        if(token != null && token.startsWith("Bearer ")) {
            actualToken = token.substring(7);
        }
        Long userNo = jwtTokenProvider.getUserNoFromToken(actualToken);

        // 2. Service 클래스의 메서드를 호출하여 userNo와 dto를 넘겨준다
        // DB에 저장된 진짜 일정 번호(eventNo)를 리턴받습니다.
        Long savedEventNo = myPageService.saveCalendarEvent(userNo, dto);

        // 3. 프론트엔드에게 성공 메시지와 함께 방금 생성된 일정 번호를 줍니다.
        return ResultVO.ok("일정 추가 성공",savedEventNo);

    }

    @PutMapping("/calendar/{eventNo}")
    public ResultVO<String> updateCalendarEvent(
            @PathVariable("eventNo") Long eventNo,
            @RequestHeader(value = "Authorization") String token,
            @RequestBody GeneralMyPageDTO.CalendarEventDTO dto
    ){
        // 1. 토큰 까서 유저 번호 꺼내기
        String actualToken = token != null && token.startsWith("Bearer ") ? token.substring(7) : null;
        Long userNo = jwtTokenProvider.getUserNoFromToken(actualToken);

        myPageService.updateCalendarEvent(eventNo, userNo, dto);
        return ResultVO.ok("일정 수정 성공", null);
    }

    @DeleteMapping("/calendar/{eventNo}")
    public ResultVO<String> deleteCalendarEvent(
            @PathVariable("eventNo") Long eventNo,
            @RequestHeader(value = "Authorization") String token
    ){
        String actualToken = token != null && token.startsWith("Bearer ") ? token.substring(7) : null;
        Long userNo = jwtTokenProvider.getUserNoFromToken(actualToken);

        myPageService.deleteCalendarEvent(eventNo, userNo);
        return ResultVO.ok("일정 삭제 성공", null);
    }

}