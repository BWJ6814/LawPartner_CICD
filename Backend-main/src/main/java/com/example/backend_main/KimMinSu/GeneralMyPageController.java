package com.example.backend_main.KimMinSu;

import com.example.backend_main.common.entity.CalendarEvent;
import com.example.backend_main.common.entity.ChatRoom;
import com.example.backend_main.common.repository.ChatRoomRepository;
import com.example.backend_main.common.security.CustomUserDetails;
import com.example.backend_main.common.security.JwtTokenProvider;
import com.example.backend_main.common.vo.ResultVO;
import com.example.backend_main.dto.GeneralMyPageDTO;
import com.example.backend_main.dto.ProfileUpdateDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
    @PutMapping(value = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResultVO<String> updateProfile(
            @ModelAttribute ProfileUpdateDTO dto, // ★ @RequestPart 대신 @ModelAttribute 사용
            @AuthenticationPrincipal CustomUserDetails userDetails // ★ 이미 토큰 검증 끝난 객체
    ) throws Exception {

        // 1. 중복된 토큰 파싱 로직 제거! userDetails에서 바로 꺼낸다.
        Long userNo = userDetails.getUserNo();

        // 2. 서비스 호출 (DTO에서 데이터 꺼내서 전달)
        myPageService.updateProfileData(
                userNo,
                dto.getName(),
                dto.getEmail(),
                dto.getPhone(),
                dto.getProfileImage()
        );

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
            // ★ 시큐리티 의존 안 하고 토큰 직접 받음
            @RequestHeader(value = "Authorization", required = false) String token
    ) {
        // 1. 토큰 없으면 바로 401 빠꾸
        if (token == null || !token.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(0);
        }

        try {
            // 2. 토큰에서 유저 번호 직접 빼오기 (네가 짰던 기존 방식)
            String actualToken = token.substring(7);
            Long userNo = jwtTokenProvider.getUserNoFromToken(actualToken);

            // ★ 여기서 권한(Role) 확인이 필요한데, DB에서 유저 정보를 직접 조회해서 팩트 체크
            com.example.backend_main.common.entity.User user = myPageService.getUserById(userNo); // 서비스에 없으면 userRepository.findById(userNo).get() 써라
            String role = user.getRoleCode(); // 네 엔티티 구조에 맞게 권한 가져오기 (ex: user.getRoleCode() 등)

            int count = 0;
            if ("ROLE_LAWYER".equals(role)) {
                count = chatRoomRepository.countByLawyerNoAndProgressCode(userNo, "ST01");
            } else {
                count = chatRoomRepository.countByUserNoAndProgressCode(userNo, "ST02");
            }

            return ResponseEntity.ok(count);

        } catch (Exception e) {
            // 토큰이 만료됐거나 위조됐으면 401 처리
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(0);
        }
    }

    @GetMapping("/notifications/list")
    public ResponseEntity<?> getNotificationList(
            @RequestHeader(value = "Authorization", required = false) String token) {

        if (token == null || !token.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            String actualToken = token.substring(7);
            Long userNo = jwtTokenProvider.getUserNoFromToken(actualToken);
            com.example.backend_main.common.entity.User user = myPageService.getUserById(userNo);
            String role = user.getRoleCode(); // (또는 getRoleCode() 등 엔티티에 맞게)

            List<java.util.Map<String, Object>> notiList = new java.util.ArrayList<>();
            java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

            // 역할에 맞게 리스트를 긁어와서 프론트가 원하는 알림 포맷으로 맵핑
            if ("ROLE_LAWYER".equals(role)) {
                List<ChatRoom> rooms = chatRoomRepository.findByLawyerNoAndProgressCode(userNo, "ST01");
                for (ChatRoom r : rooms) {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", r.getRoomId()); // 고유 ID
                    map.put("text", "새로운 1:1 상담 요청이 들어왔습니다.");
                    map.put("time", r.getRegDt() != null ? r.getRegDt().format(formatter) : "최근");
                    map.put("read", false);
                    notiList.add(map);
                }
            } else {
                List<ChatRoom> rooms = chatRoomRepository.findByUserNoAndProgressCode(userNo, "ST02");
                for (ChatRoom r : rooms) {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", r.getRoomId());
                    map.put("text", "변호사님이 상담 요청을 수락했습니다!");
                    map.put("time", r.getRegDt() != null ? r.getRegDt().format(formatter) : "최근");
                    map.put("read", false);
                    notiList.add(map);
                }
            }

            return ResponseEntity.ok(notiList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @DeleteMapping("/chat/room/{roomId}")
    public ResultVO<String> deleteConsultation(
            @PathVariable("roomId") String roomId,
            // ★ 여기도 토큰 직접 받기
            @RequestHeader(value = "Authorization", required = false) String token) {

        // 1. 토큰 유무 팩트 체크
        if (token == null || !token.startsWith("Bearer ")) {
            throw new RuntimeException("로그인이 필요한 서비스입니다. (토큰 없음)");
        }

        // 2. 수동으로 유저 번호 해독
        String actualToken = token.substring(7);
        Long userNo = jwtTokenProvider.getUserNoFromToken(actualToken);

        // 3. 서비스 호출
        myPageService.deleteChatRoom(roomId, userNo);
        return ResultVO.ok("상담이 삭제되었습니다.", null);
    }



}