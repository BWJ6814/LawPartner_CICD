package com.example.backend_main.KimMinSu;

import com.example.backend_main.common.entity.CalendarEvent;
import com.example.backend_main.common.repository.ChatRoomRepository;
import com.example.backend_main.common.security.CustomUserDetails;
import com.example.backend_main.common.security.JwtTokenProvider;
import com.example.backend_main.common.vo.ResultVO;
import com.example.backend_main.dto.GeneralMyPageDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mypage")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class GeneralMyPageController {

    private final GeneralMyPageService myPageService;
    private final JwtTokenProvider jwtTokenProvider; // ★ 신분증 해독기 추가
    private final ChatRoomRepository chatRoomRepository;

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
            @Valid @RequestBody GeneralMyPageDTO.CalendarEventDTO dto
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
            @Valid @RequestBody GeneralMyPageDTO.CalendarEventDTO dto
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

    // 1. 프로필 이름 수정
    @PutMapping("/profile")
    public ResultVO<String> updateProfile(
            @RequestHeader("Authorization") String token,
            // ★ [핵심] JSON이 아니라 FormData로 받기 때문에 @RequestParam을 쓴다!
            @RequestParam("name") String name,
            @RequestParam("email") String email,
            @RequestParam("phone") String phone,
            @RequestParam(value = "profileImage", required = false) org.springframework.web.multipart.MultipartFile profileImage) throws Exception {

        Long userNo = jwtTokenProvider.getUserNoFromToken(token.substring(7));

        // 서비스로 다 넘겨버리기
        myPageService.updateProfileData(userNo, name, email, phone, profileImage);

        return ResultVO.ok("프로필 수정 성공", null);
    }


    // 2. 비밀번호 수정
    @PutMapping("/password")
    public ResultVO<String> updatePassword(@RequestHeader("Authorization") String token, @RequestBody java.util.Map<String, String> body) {
        Long userNo = jwtTokenProvider.getUserNoFromToken(token.substring(7));
        myPageService.updatePassword(userNo, body.get("oldPassword"), body.get("newPassword"));
        return ResultVO.ok("비밀번호 수정 성공", null);
    }

    // 3. 회원 탈퇴
    @DeleteMapping("/account")
    public ResultVO<String> deleteAccount(@RequestHeader("Authorization") String token) {
        Long userNo = jwtTokenProvider.getUserNoFromToken(token.substring(7));
        myPageService.deleteAccount(userNo);
        return ResultVO.ok("회원 탈퇴 성공", null);
    }

    @GetMapping("/notifications/count")
    public ResponseEntity<?> getUnreadNotificationCount(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        // 혹시 로그인이 안 된 놈이 찌르면 빠꾸 먹이기
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(0);
        }

        // ★ [핵심 2] 검증된 신분증에서 안전하게 유저 번호랑 권한 빼오기
        Long userNo = userDetails.getUserNo(); // CustomUserDetails에 getUserNo()가 있다고 가정
        String role = userDetails.getAuthorities().iterator().next().getAuthority(); // 권한(Role) 꺼내기

        int count = 0;
        if ("ROLE_LAWYER".equals(role)) {
            // 변호사: 나한테 온 대기(ST01) 중인 상담 요청
            count = chatRoomRepository.countByLawyerNoAndProgressCode(userNo, "ST01");
        } else {
            // 일반 유저: 내가 신청한 것 중 수락(ST02)된 상담
            count = chatRoomRepository.countByUserNoAndProgressCode(userNo, "ST02");
        }

        return ResponseEntity.ok(count);
    }



}