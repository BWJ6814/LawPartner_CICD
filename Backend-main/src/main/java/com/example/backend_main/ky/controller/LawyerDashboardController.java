package com.example.backend_main.ky.controller;

import com.example.backend_main.ky.dto.LawyerDashboardDTO;
import com.example.backend_main.ky.service.LawyerDashboardService;
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
    private final JwtTokenProvider       jwtTokenProvider;

    // ── 후기 목록 ──────────────────────────────────────────────
    // GET /api/lawyer/dashboard/reviews
    @GetMapping("/reviews")
    public ResultVO<List<LawyerDashboardDTO.ReviewDTO>> getReviews(
            @RequestHeader("Authorization") String token) {
        return ResultVO.ok("후기 목록 조회 성공", dashboardService.getReviews(extractUserNo(token)));
    }

    // ── 상담(채팅방) 목록 ──────────────────────────────────────
    // GET /api/lawyer/dashboard/consultations
    @GetMapping("/consultations")
    public ResultVO<List<LawyerDashboardDTO.ConsultationDTO>> getConsultations(
            @RequestHeader("Authorization") String token) {
        return ResultVO.ok("상담 목록 조회 성공", dashboardService.getConsultations(extractUserNo(token)));
    }

    // ── 통계 ───────────────────────────────────────────────────
    // GET /api/lawyer/dashboard/stats
    @GetMapping("/stats")
    public ResultVO<LawyerDashboardDTO.StatsDTO> getStats(
            @RequestHeader("Authorization") String token) {
        return ResultVO.ok("통계 조회 성공", dashboardService.getStats(extractUserNo(token)));
    }

    // ── 일정 조회 ──────────────────────────────────────────────
    // GET /api/lawyer/dashboard/calendars
    @GetMapping("/calendars")
    public ResultVO<List<LawyerDashboardDTO.CalendarDTO>> getCalendars(
            @RequestHeader("Authorization") String token) {
        return ResultVO.ok("일정 조회 성공", dashboardService.getCalendars(extractUserNo(token)));
    }

    // ── 일정 추가 ──────────────────────────────────────────────
    // POST /api/lawyer/dashboard/calendars
    @PostMapping("/calendars")
    public ResultVO<LawyerDashboardDTO.CalendarDTO> addCalendar(
            @RequestHeader("Authorization") String token,
            @RequestBody LawyerDashboardDTO.CalendarRequest req) {
        return ResultVO.ok("일정 추가 성공", dashboardService.addCalendar(extractUserNo(token), req));
    }

    // ── 일정 수정 ──────────────────────────────────────────────
    // PATCH /api/lawyer/dashboard/calendars/{eventNo}
    @PatchMapping("/calendars/{eventNo}")
    public ResultVO<Void> updateCalendar(
            @RequestHeader("Authorization") String token,
            @PathVariable Long eventNo,
            @RequestBody java.util.Map<String, String> body) {
        dashboardService.updateCalendar(extractUserNo(token), eventNo, body.get("title"), body.get("startDate"));
        return ResultVO.ok("일정 수정 성공", null);
    }

    // ── 일정 삭제 ──────────────────────────────────────────────
    // DELETE /api/lawyer/dashboard/calendars/{eventNo}
    @DeleteMapping("/calendars/{eventNo}")
    public ResultVO<Void> deleteCalendar(
            @RequestHeader("Authorization") String token,
            @PathVariable Long eventNo) {
        dashboardService.deleteCalendar(extractUserNo(token), eventNo);
        return ResultVO.ok("일정 삭제 성공", null);
    }

    // ── 상담 진행 상태 변경 ─────────────────────────────────────
    // PATCH /api/lawyer/dashboard/consultations/{roomId}/status
    @PatchMapping("/consultations/{roomId}/status")
    public ResultVO<Void> updateConsultationStatus(
            @RequestHeader("Authorization") String token,
            @PathVariable String roomId,
            @RequestBody java.util.Map<String, String> body) {
        dashboardService.updateConsultationStatus(extractUserNo(token), roomId, body.get("progressCode"));
        return ResultVO.ok("상태 변경 성공", null);
    }

    // ── 토큰에서 userNo 추출 ────────────────────────────────────
    private Long extractUserNo(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        return jwtTokenProvider.getUserNoFromToken(token);
    }
}
