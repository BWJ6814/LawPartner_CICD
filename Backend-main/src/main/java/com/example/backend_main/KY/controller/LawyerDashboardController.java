package com.example.backend_main.KY.controller;

import com.example.backend_main.KY.dto.LawyerDashboardDTO;
import com.example.backend_main.KY.service.LawyerDashboardService;
import com.example.backend_main.common.security.JwtTokenProvider;
import com.example.backend_main.common.vo.ResultVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lawyer/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class LawyerDashboardController {

    private final LawyerDashboardService dashboardService;
    private final JwtTokenProvider jwtTokenProvider;

    // ========== 후기 목록 조회 ==========
    // GET /api/lawyer/dashboard/reviews
    @GetMapping("/reviews")
    public ResultVO<List<LawyerDashboardDTO.ReviewDTO>> getReviews(
            @RequestHeader(value = "Authorization") String token
    ) {
        Long userNo = extractUserNo(token);
        List<LawyerDashboardDTO.ReviewDTO> reviews = dashboardService.getReviews(userNo);
        return ResultVO.ok("후기 목록 조회 성공", reviews);
    }

    // ========== 상담 목록 조회 ==========
    // GET /api/lawyer/dashboard/consultations
    @GetMapping("/consultations")
    public ResultVO<List<LawyerDashboardDTO.ConsultationDTO>> getConsultations(
            @RequestHeader(value = "Authorization") String token
    ) {
        Long userNo = extractUserNo(token);
        List<LawyerDashboardDTO.ConsultationDTO> consultations = dashboardService.getConsultations(userNo);
        return ResultVO.ok("상담 목록 조회 성공", consultations);
    }

    // ========== 토큰에서 userNo 추출 ==========
    private Long extractUserNo(String token) {
        String actualToken = token;
        if (token != null && token.startsWith("Bearer ")) {
            actualToken = token.substring(7);
        }
        return jwtTokenProvider.getUserNoFromToken(actualToken);
    }
}
