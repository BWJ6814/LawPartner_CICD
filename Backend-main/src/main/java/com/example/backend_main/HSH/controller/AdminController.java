package com.example.backend_main.HSH.controller;

import com.example.backend_main.HSH.service.AdminService;
import com.example.backend_main.common.annotation.ActionLog;
import com.example.backend_main.common.entity.BlacklistIp;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.security.CustomUserDetails;
import com.example.backend_main.common.vo.ResultVO;
import com.example.backend_main.dto.*;
import com.example.backend_main.dto.HSH_DTO.*;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.security.Principal;
import java.util.List;
import java.util.Map;

/*
 * [AdminController]
 * - 모든 예외는 GlobalExceptionHandler가 처리 → 컨트롤러에 try-catch 없음
 * - Security 필터가 인증을 보장 → null 체크 없음
 * - 컨트롤러 역할: 요청 받기 → @Valid 형식 검증 → 서비스 호출 → 응답 반환
 * - 응답 타입: ResultVO 로 통일 (ResponseEntity 혼용 제거)
 * - Repository 직접 호출 없음 → 모든 데이터 접근은 AdminService 경유
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    // ✅ Repository 의존성 전부 제거 — 모든 데이터 접근은 Service 경유
    private final AdminService adminService;

    // ==================================================================================
    // 👤 회원 관리
    // ==================================================================================

    @GetMapping("/users")
    public ResultVO<List<User>> getAllUsers() {
        return ResultVO.ok("전체 회원 목록을 성공적으로 불러왔습니다.", adminService.getAllUsers());
    }

    @PutMapping("/user/status")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    @ActionLog(action = "UPDATE_USER_STATUS", target = "TB_USER")
    public ResultVO<Void> updateUserStatus(
            @Valid @RequestBody UserStatusUpdateDto dto,
            Principal principal) {
        adminService.updateUserStatus(dto.getUserId(), dto.getStatusCode(), dto.getReason(), principal.getName());
        return ResultVO.ok("회원 상태가 성공적으로 변경되었습니다.", null);
    }

    @PutMapping("/user/role")
    @PreAuthorize("hasRole('ROLE_SUPER_ADMIN')")
    @ActionLog(action = "UPDATE_USER_ROLE", target = "TB_USER")
    public ResultVO<Void> updateUserRole(
            @Valid @RequestBody UserRoleUpdateDto dto,
            Principal principal) {
        adminService.updateUserRole(dto.getUserId(), dto.getRoleCode(), dto.getReason(), principal.getName());
        return ResultVO.ok("회원 권한이 성공적으로 변경되었습니다.", null);
    }

    @PostMapping("/create-operator")
    @PreAuthorize("hasRole('ROLE_SUPER_ADMIN')")
    @ActionLog(action = "CREATE_OPERATOR", target = "TB_USER")
    public ResultVO<String> createOperator(
            @Valid @RequestBody UserJoinRequestDTO joinDto,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        adminService.createSubAdmin(joinDto, userDetails.getUserId());
        return ResultVO.ok("하위 관리자(운영자)가 성공적으로 생성되었습니다.", null);
    }

    // ==================================================================================
    // 📋 로그 관리
    // ==================================================================================

    @GetMapping("/logs")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_OPERATOR')")
    public ResultVO<Page<AccessLogResponseDTO>> getAccessLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String keywordType,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "ALL") String statusType) {
        return ResultVO.ok("로그 조회 성공",
                adminService.searchAccessLogs(page, size, startDate, endDate, keywordType, keyword, statusType));
    }

    @GetMapping("/logs/download")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_OPERATOR')")
    @ActionLog(action = "DOWNLOAD_EXCEL", target = "TB_ACCESS_LOG")
    public void downloadLogs(
            HttpServletResponse response,
            @RequestParam String reason) throws IOException {
        adminService.downloadAccessLogExcel(response);
    }

    @GetMapping("/logs/threats")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_OPERATOR')")
    public ResultVO<List<AccessLogResponseDTO>> getRecentThreats() {
        return ResultVO.ok("최신 보안 위협 로그를 성공적으로 불러왔습니다.", adminService.getRecentThreats());
    }

    // ==================================================================================
    // 📊 대시보드 통계
    // ==================================================================================

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_OPERATOR')")
    public ResultVO<Map<String, Object>> getAdminSummary() {
        return ResultVO.ok("요약 데이터를 성공적으로 불러왔습니다.", adminService.getAdminSummary());
    }

    @GetMapping("/status/daily")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_OPERATOR')")
    public ResultVO<List<Map<String, Object>>> getDailyStats(
            @RequestParam(defaultValue = "7") int days) {
        return ResultVO.ok("통계 데이터를 성공적으로 불러왔습니다.", adminService.getDailyVisitStats(days));
    }

    // ==================================================================================
    // 🚨 IP 블랙리스트 관리
    // ==================================================================================

    @GetMapping("/blacklist")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResultVO<List<BlacklistIp>> getBlacklist() {
        // ✅ blacklistIpRepository.findAll() → Service로 이동
        return ResultVO.ok(adminService.getAllBlacklist());
    }

    @PostMapping("/blacklist")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    @ActionLog(action = "IP 블랙리스트 추가", target = "보안 시스템")
    public ResultVO<Void> addBlacklist(
            @RequestBody Map<String, String> payload,
            Principal principal) {
        adminService.addBlacklist(payload.get("ip"), payload.get("reason"), principal.getName());
        return ResultVO.ok("IP가 차단되었습니다.", null);
    }

    @DeleteMapping("/blacklist/{ip}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    @ActionLog(action = "IP 블랙리스트 해제", target = "보안 시스템")
    public ResultVO<Void> removeBlacklist(
            @PathVariable String ip,
            @RequestParam String reason) {
        adminService.removeBlacklist(ip);
        return ResultVO.ok("IP 차단이 해제되었습니다.", null);
    }

    // ==================================================================================
    // 🔤 금지어 관리
    // ==================================================================================

    @PostMapping("/banned-words")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    @ActionLog(action = "ADD_BANNED_WORD", target = "TB_BANNED_WORD")
    public ResultVO<Void> addBannedWord(
            @Valid @RequestBody BannedWordDto dto,
            Principal principal) {
        adminService.addBannedWord(dto.getWord(), dto.getReason(), principal.getName());
        return ResultVO.ok("금지어가 등록되었습니다.", null);
    }

    @DeleteMapping("/banned-words/{wordNo}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    @ActionLog(action = "DELETE_BANNED_WORD", target = "TB_BANNED_WORD")
    public ResultVO<Void> deleteBannedWord(@PathVariable Long wordNo) {
        // ✅ bannedWordRepository.deleteById() → Service로 이동
        adminService.deleteBannedWord(wordNo);
        return ResultVO.ok("금지어가 삭제되었습니다.", null);
    }

    // ==================================================================================
    // 📝 게시글 관리
    // ==================================================================================

    @GetMapping("/boards")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_OPERATOR')")
    public ResultVO<List<Board>> getAllBoards() {
        // ✅ boardRepository.findAll() → Service로 이동
        return ResultVO.ok(adminService.getAllBoards());
    }

    @PutMapping("/board/blind")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_OPERATOR')")
    @ActionLog(action = "TOGGLE_BLIND", target = "TB_BOARD")
    public ResultVO<Void> toggleBoardBlind(
            @Valid @RequestBody BoardBlindDto dto,
            Principal principal) {
        adminService.toggleBoardBlind(dto.getBoardNo(), dto.getReason(), principal.getName());
        return ResultVO.ok("게시글 상태가 변경되었습니다.", null);
    }
}