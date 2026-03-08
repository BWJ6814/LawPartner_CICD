package com.example.backend_main.HSH.controller;


import com.example.backend_main.HSH.service.AdminService;
import com.example.backend_main.common.annotation.ActionLog;

import com.example.backend_main.common.entity.BlacklistIp;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.repository.BlacklistIpRepository;
import com.example.backend_main.common.security.CustomUserDetails; // ★ 최적화용
import com.example.backend_main.common.vo.ResultVO;
import com.example.backend_main.dto.AccessLogResponseDTO;
import com.example.backend_main.dto.UserJoinRequestDTO;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // ★ 권한 체크
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import java.security.Principal;



// 페이징 처리를 위한 핵심 클래스들
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
// 동적 쿼리(검색)을 위한 JPA Specification
import org.springframework.data.jpa.domain.Specification;
// 검색 규칙 클래스
import com.example.backend_main.common.spec.AccessLogSpecification;
// 엔티티 및 DTO
import com.example.backend_main.common.entity.AccessLog;
import com.example.backend_main.dto.AccessLogResponseDTO;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/*

@RequestMapping("/api/admin") : 관리자 전용 구역으로 들어오는 주소는 /api/admin이라고 설정..!

- 회원 관리, 로그 다운로드, 관리자 계정 생성 등 수행
- 모든 API는 SecurityConfig에서 1차, @PreAuthorize에서 2차 검증
*/
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {
    // 블랙리스트 의존성 추가
    private final BlacklistIpRepository blacklistIpRepository;
    private final AdminService adminService;


    // [전체 화원 목록 조회] [ADM-02]
    // 관리자가 전체 시민 명부를 확인하는 기능
    // ResultVO<List<User>> : ResultVO라는 큰 상자 안에, 유저 여러 명의 정보가 담긴 List를 넣어서 보내겠다!
    // 리액트에서는 이 상자를 받아 success가 true인지 확인하고, 안에 든 유저 리스트를 화면의 표(Table)에 뿌려주기..!
    @GetMapping("/users")
    public ResultVO<List<User>> getAllUsers() {
        // 서비스에게 "암호 해독해서 회원 목록 가져와!" 라고 명령하기
        List<User> usersList = adminService.getAllUsers();
        // 가공된 데이터를 표준 객체(ResultVO)에 담아서 보내기..
        return ResultVO.ok("전체 회원 목록을 성공적으로 불러왔습니다.", usersList);
    }

    /*
        [회원 상태 변경] - ADM-02/ADM-03
        특정 회원을 정지(S02), 변호사를 승인할 때 사용...
        나중에 AdminService에 로직 추가하여 완성할 예정
    */
    @PutMapping("/user/status")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')") // 슈퍼 관리자, 일반 관리자
    @ActionLog(action = "CHANGE_STATUS", target = "TB_USER") // 감시 로그 기록
    public ResultVO<String> changeUserStatus(@RequestBody Map<String, String> requestBody,
                                             Principal principal) { // ★ 1. 범용 Principal 객체 추가

        // 🚨 S급 방어 로직: 로그인 정보가 없으면 튕기지 않고 우아하게 에러 반환
        if (principal == null) {
            return ResultVO.fail("AUTH-401", "로그인 정보가 유효하지 않습니다. 다시 로그인해 주세요.");
        }

        // 1. 필수 파라미터 추출 (사유 포함)
        String userId = requestBody.get("userId");
        String statusCode = requestBody.get("statusCode");
        String reason = requestBody.get("reason"); // 프론트에서 보낸 상세 사유 낚아채기

        // 2. S급 보안 검증: 사유가 없으면 로직 진행 자체를 차단 (ADM-02 준수)
        if (userId == null || statusCode == null || reason == null || reason.trim().isEmpty()) {
            return ResultVO.fail("PARAM-ERROR", "상태 변경 사유는 필수 입력 사항입니다.");
        }

        try {
            // ★ 2. 안전하게 현재 실행 중인 관리자 아이디 추출
            String currentAdminId = principal.getName();

            // ★ 3. 비즈니스 로직 수행 (관리자 ID와 사유도 같이 넘겨줌!)
            adminService.changeUserStatus(userId, statusCode, reason, currentAdminId);

            // 성공 응답 (성공 시 AOP가 'reason'을 포함해 감사 로그 저장)
            return ResultVO.ok("회원 상태가 성공적으로 변경되었습니다.", null);

        } catch (IllegalArgumentException e) {
            return ResultVO.fail("BAD-REQUEST", e.getMessage());
        } catch (Exception e) {
            log.error("회원 상태 변경 중 오류 - TraceID: {}", MDC.get("TRACE_ID"), e);
            return ResultVO.fail("SYS-ERROR", "시스템 오류가 발생했습니다.");
        }
    }

    /*
    [하위 관리자 생성]
    - @ActionLog 적용 -> "누가 생성했는가?"를 자동 기록하게 처리
    - ★ 슈퍼 관리자(SUPER_ADMIN)만 가능
    - CustomUserDetails를 사용해 DB 재조회 없이 PK 추출 (성능 최적화)
    */
    @PostMapping("/create-operator")
    @PreAuthorize("hasRole('ROLE_SUPER_ADMIN')") // ★ 2중 보안 (슈퍼 관리자만!)
    @ActionLog(action = "CREATE_OPERATOR", target = "TB_USER")
    public ResultVO<String> createOperator(@RequestBody UserJoinRequestDTO joinDto,
                                           Principal principa) {

        // 🚨 방어 로직: 인증 정보가 날아갔을 경우 튕기지 않고 우아하게 실패 메시지 반환
        if (principal == null) {
            return ResultVO.fail("AUTH-401", "로그인 정보가 유효하지 않습니다. 다시 로그인해 주세요.");
        }

        try {
            // [Pro Level 최적화]
            // 로그인 시 저장해둔 CustomUserDetails에서 PK(userNo)를 바로 꺼냄
            // 불필요한 DB 조회(SELECT)를 방지함
            String currentAdminId = principal.getName();

            // 서비스 호출
            adminService.createSubAdmin(joinDto, currentAdminNo);

            return ResultVO.ok("하위 관리자(운영자)가 성공적으로 생성되었습니다.", null);

        } catch (SecurityException e) {
            log.warn("🚨 권한 없는 관리자 생성 시도: AdminID={}", userDetails.getUsername());
            // ★ fail("메시지") -> fail("코드", "메시지")
            return ResultVO.fail("AUTH-FORBIDDEN", "권한 오류: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResultVO.fail("BAD-INPUT", "입력 오류: " + e.getMessage());
        } catch (Exception e) {
            log.error("관리자 생성 중 시스템 오류", e);
            return ResultVO.fail("SYS-ERROR", "시스템 오류가 발생했습니다.");
        }
    }

    /*
    보안 감사 로그 목록 조회 (화면 Grid용) - 5주차 계획
    - 엑셀이 아닌, JSON 데이터로 로그 리스트를 반환합니다.
    */
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

        //  컨트롤러가 직접 레포지토리를 만지지 않고, 서비스에게 요청합니다.
        Page<AccessLogResponseDTO> logs = adminService.searchAccessLogs(page, size, startDate, endDate, keywordType, keyword, statusType);

        return ResultVO.ok("로그 조회 성공", logs);
    }

    // 그래프(차트)용 데이터를 만드는 전용 창구
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN','ROLE_OPERATOR')")
    public ResultVO<Map<String, Object>> getAdminSummary() {
        Map<String, Object> summary = adminService.getAdminSummary();
        return ResultVO.ok("요약 데이터를 성공적으로 불러왔습니다.", summary);
    }

    // 대시보드 최근 보안 위협 로그 전용 창구
    @GetMapping("/logs/threats")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_OPERATOR')")
    public ResultVO<List<AccessLogResponseDTO>> getRecentThreats() {
        List<AccessLogResponseDTO> threats = adminService.getRecentThreats();
        return ResultVO.ok("최신 보안 위협 로그를 성공적으로 불러왔습니다.", threats);
    }

    /*
     [보안 감사 로그 엑셀 다운로드] (SXSSF 방식)
     - @ActionLog: 다운로드 이력 자동 저장
     - 대용량 데이터도 메모리 오류 없이 다운로드 가능
     */
    @GetMapping("/logs/download")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_OPERATOR')") // 관리자급 이상 접근 가능
    @ActionLog(action = "DOWNLOAD_EXCEL", target = "TB_ACCESS_LOG")
    public void downloadLogs(HttpServletResponse response,
                             // 프론트에서 ?reason=감사제출용 이라고 보내면 이리로 쏙 들어옵니다.
                             // reason을 파라미터에 적어둔 이유 : AOP를 위한 바구니 역할
                             //
                             @RequestParam(value = "reason", required = true) String reason)
            throws IOException {
        adminService.downloadAccessLogExcel(response);
    }

    /*
    [대시보드 통계] 일별 접속자 수 조회 API
    - 차트 라이브러리(Recharts 등)에 넣을 데이터 제공
    */
    @GetMapping("/status/daily")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN','ROLE_OPERATOR')")
    public ResultVO<List<Map<String, Object>>> getDailyStats(
            @RequestParam(defaultValue = "7") int days) { // days 추가!

        List<Map<String, Object>> stats = adminService.getDailyVisitStats(days);
        return ResultVO.ok("통계 데이터를 성공적으로 불러왔습니다.", stats);
    }

    // ==========================================
    // 🚨 IP 블랙리스트 관리 API
    // ==========================================

    // 1. 블랙리스트 전체 조회
    // - HTTP 상태 코드: 200 OK
    // - 권한: 운영자(OPERATOR) 이상 열람 가능
    @GetMapping("/blacklist")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResponseEntity<ResultVO<List<BlacklistIp>>> getBlacklist() {
        // 단순 전체 조회는 컨트롤러에서 Repository를 직접 호출해도 무방합니다.
        List<BlacklistIp> list = blacklistIpRepository.findAll();

        // 🟢 성공 응답: HTTP 200 + 비즈니스 성공 데이터
        return ResponseEntity.ok(ResultVO.ok(list));
    }

    // 2. 특정 IP 차단하기
    @PostMapping("/blacklist")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    @ActionLog(action = "IP 블랙리스트 추가", target = "보안 시스템")
    public ResponseEntity<ResultVO<Void>> addBlacklist(
            @RequestBody Map<String, String> payload,
            Principal principal) {

        // 🚨 S급 방어 로직: principal 객체가 null인지 확인
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ResultVO.fail("AUTH-401", "로그인 정보가 유효하지 않습니다. 다시 로그인해 주세요."));
        }

        try {
            // principal.getName()을 통해 사용자 ID(username/userId)를 안전하게 가져옵니다.
            adminService.addBlacklist(payload.get("ip"), payload.get("reason"), principal.getName());
            return ResponseEntity.ok(ResultVO.ok("IP가 차단되었습니다.", null));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ResultVO.fail("BL-400", e.getMessage()));
        }
    }

    // 3. 특정 IP 차단 해제하기
    @DeleteMapping("/blacklist/{ip}")
    @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    @ActionLog(action = "IP 블랙리스트 해제", target = "보안 시스템")
    public ResponseEntity<ResultVO<Void>> removeBlacklist(@PathVariable String ip, @RequestParam String reason) {
        try {
            // ★ 마찬가지로 서비스에게 삭제를 지시합니다.
            adminService.removeBlacklist(ip);
            return ResponseEntity.ok(ResultVO.ok("IP 차단이 해제되었습니다.", null));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ResultVO.fail("BL-404", e.getMessage()));
        }
    }
}
