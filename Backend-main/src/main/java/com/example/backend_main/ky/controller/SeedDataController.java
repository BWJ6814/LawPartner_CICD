package com.example.backend_main.ky.controller;

import com.example.backend_main.ky.entity.Review;
import com.example.backend_main.ky.repository.CalendarRepository;
import com.example.backend_main.ky.repository.ReviewRepository;
import com.example.backend_main.common.entity.CalendarEvent;
import com.example.backend_main.common.entity.ChatRoom;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.repository.ChatRoomRepository;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.common.security.JwtTokenProvider;
import com.example.backend_main.common.vo.ResultVO;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/*
 * [개발용] 더미 데이터 시드 컨트롤러
 * POST /api/dev/seed
 * 변호사 대시보드 테스트용 더미 데이터를 DB에 삽입합니다.
 * ROLE_LAWYER 권한이 있어야 호출 가능합니다.
 */
@RestController
@RequestMapping("/api/dev")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class SeedDataController {

    private final ChatRoomRepository  chatRoomRepository;
    private final ReviewRepository    reviewRepository;
    private final CalendarRepository  calendarRepository;
    private final UserRepository      userRepository;
    private final JwtTokenProvider    jwtTokenProvider;

    @PostMapping("/seed")
    public ResultVO<String> seed(@RequestHeader("Authorization") String token) {

        // 1. JWT 파싱 및 변호사 번호 추출
        String actualToken = token.startsWith("Bearer ") ? token.substring(7) : token;
        Claims claims = jwtTokenProvider.parseClaims(actualToken);

        Long lawyerNo = claims.get("userNo", Long.class);
        if (lawyerNo == null) {
            return ResultVO.fail("SEED-FAIL", "토큰에서 userNo를 읽을 수 없습니다. 재로그인 후 시도하세요.");
        }

        // 2. ROLE_LAWYER 권한 체크
        String role = claims.get("role", String.class);
        if (role == null || !role.contains("ROLE_LAWYER")) {
            return ResultVO.fail("SEED-FORBIDDEN", "변호사 계정만 시드 데이터를 생성할 수 있습니다.");
        }

        // 3. 일반 유저 찾기 (더미 의뢰인용)
        List<User> users = userRepository.findAll();
        Long userNo = users.stream()
            .filter(u -> "ROLE_USER".equals(u.getRoleCode()))
            .map(User::getUserNo)
            .findFirst()
            .orElse(lawyerNo);

        // 4. 더미 채팅방(상담) 데이터 삽입
        String[] progressCodes = {"ST01", "ST02", "ST03", "ST04", "ST05"};
        for (String code : progressCodes) {
            ChatRoom c = ChatRoom.builder()
                .roomId(UUID.randomUUID().toString())
                .userNo(userNo)
                .lawyerNo(lawyerNo)
                .statusCode("ST05".equals(code) ? "CLOSED" : "OPEN")
                .progressCode(code)
                .build();
            chatRoomRepository.save(c);
        }

        // 5. 더미 후기 데이터 삽입
        String[] contents = {
            "변호사님 덕분에 사건이 잘 해결되었습니다. 정말 감사합니다.",
            "전문적인 법률 지식으로 친절하게 설명해 주셨어요.",
            "신속하게 처리해 주셔서 큰 도움이 되었습니다.",
            "복잡한 사건인데도 꼼꼼하게 처리해 주셨습니다."
        };
        double[] ratings = {5.0, 4.5, 4.0, 5.0};

        for (int i = 0; i < contents.length; i++) {
            Review r = Review.builder()
                .lawyerNo(lawyerNo)
                .writerNo(userNo)
                .stars(ratings[i])
                .content(contents[i])
                .build();
            reviewRepository.save(r);
        }

        // 6. 더미 캘린더 일정 데이터 삽입
        String[][] calEvents = {
            {"서울중앙지법 제3호 법정 변론기일", "2026-02-24", "#3b82f6"},
            {"의뢰인 대면 상담",               "2026-02-26", "#10b981"},
            {"소장 제출 마감",                 "2026-03-05", "#f97316"},
            {"1심 선고 기일",                  "2026-03-12", "#ef4444"},
            {"항소심 준비 회의",               "2026-03-20", "#8b5cf6"}
        };

        for (String[] ev : calEvents) {
            CalendarEvent ce = CalendarEvent.builder()
                .lawyerNo(lawyerNo)
                .userNo(lawyerNo)
                .title(ev[0])
                .startDate(ev[1])
                .colorCode(ev[2])
                .build();
            calendarRepository.save(ce);
        }

        return ResultVO.ok("SEED-SUCCESS",
            String.format("더미 데이터 삽입 완료! (lawyerNo=%d, 상담 5건, 후기 4건, 일정 5건)", lawyerNo));
    }
}