package com.example.backend_main.KimMinSu;

import com.example.backend_main.dto.GeneralMyPageDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/mypage")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class GeneralMyPageController {

    private final GeneralMyPageService myPageService;

    @GetMapping("/general")
    public ResponseEntity<GeneralMyPageDTO> getGeneralDashboard(
            @RequestHeader(value = "Authorization", required = false) String token
    ) {
        // 원래는 토큰에서 userNo를 꺼내야 하지만,
        // 지금은 테스트를 위해 임시로 1번 유저라고 가정합니다.
        Long userNo = 1L;

        System.out.println("마이페이지 데이터 요청 들어옴! UserNo: " + userNo);

        GeneralMyPageDTO data = myPageService.getDashboardData(userNo);

        return ResponseEntity.ok(data);
    }
}
