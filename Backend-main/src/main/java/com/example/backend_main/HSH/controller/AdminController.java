package com.example.backend_main.HSH.controller;


import com.example.backend_main.HSH.service.AdminService;
import com.example.backend_main.common.annotation.ActionLog;
import com.example.backend_main.common.entity.AccessLog;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.repository.AccessLogRepository;
import com.example.backend_main.common.security.CustomUserDetails; // ★ 최적화용
import com.example.backend_main.common.vo.ResultVO;
import com.example.backend_main.dto.UserJoinRequestDTO;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize; // ★ 권한 체크
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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

    private final AdminService adminService;
    private final AccessLogRepository accessLogRepository;

    // [전체 화원 목록 조회] [ADM-02]
    // 관리자가 전체 시민 명부를 확인하는 기능
    // ResultVO<List<User>> : ResultVO라는 큰 상자 안에, 유저 여러 명의 정보가 담긴 List를 넣어서 보내겠다!
    // 리액트에서는 이 상자를 받아 success가 true인지 확인하고, 안에 든 유저 리스트를 화면의 표(Table)에 뿌려주기..!
    @GetMapping("/users")
    public ResultVO<List<User>> getAllUsers(){
        // 서비스에게 "암호 해독해서 회원 목록 가져와!" 라고 명령하기
        List<User> usersList = adminService.getAllUsers();
        // 가공된 데이터를 표준 객체(ResultVO)에 담아서 보내기..
        return ResultVO.ok("전체 회원 목록을 성공적으로 불러왔습니다.",usersList);
    }

    /*
        [회원 상태 변경] - ADM-02/ADM-03
        특정 회원을 정지(S02), 변호사를 승인할 때 사용...
        나중에 AdminService에 로직 추가하여 완성할 예정
    */
    @PutMapping("/user/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')") // 슈퍼 관리자, 일반 리자
    @ActionLog(action = "CHANGE_STATUS", target = "TB_USER") // 감시 로그 기록
    public ResultVO<String> changeUserStatus(@RequestBody Map<String, String> requestBody) {
        String userId = requestBody.get("userId");
        String statusCode = requestBody.get("statusCode");

        if (userId == null || statusCode == null) {
            // ResultVO.fail(String code, String message) 사용
            return ResultVO.fail("PARAM-ERROR", "필수 파라미터가 누락되었습니다.");
        }

        try {
            adminService.changeUserStatus(userId, statusCode);
            return ResultVO.ok("회원 상태가 성공적으로 변경되었습니다.",null);
        } catch (IllegalArgumentException e) {
            return ResultVO.fail("BAD-REQUEST", e.getMessage());
        } catch (Exception e) {
            log.error("회원 상태 변경 중 오류", e);
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
    @PreAuthorize("hasRole('SUPER_ADMIN')") // ★ 2중 보안 (슈퍼 관리자만!)
    @ActionLog(action = "CREATE_OPERATOR", target = "TB_USER")
    public ResultVO<String> createOperator(@RequestBody UserJoinRequestDTO joinDto,
                                           @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            // [Pro Level 최적화]
            // 로그인 시 저장해둔 CustomUserDetails에서 PK(userNo)를 바로 꺼냄
            // 불필요한 DB 조회(SELECT)를 방지함
            Long currentAdminNo = userDetails.getUserNo();

            // 서비스 호출
            adminService.createSubAdmin(joinDto, currentAdminNo);

            return ResultVO.ok("하위 관리자(운영자)가 성공적으로 생성되었습니다.",null);

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
    public ResultVO<List<AccessLog>> getAccessLogs() {
        // 원래는 페이징(Pageable) 처리를 해야 하지만, 일단 전체 리스트로 MVP 구현
        List<AccessLog> logs = accessLogRepository.findAll();
        return ResultVO.ok("로그 목록을 성공적으로 불러왔습니다.", logs);
    }

    /*
     [보안 감사 로그 엑셀 다운로드] (SXSSF 방식)
     - @ActionLog: 다운로드 이력 자동 저장
     - 대용량 데이터도 메모리 오류 없이 다운로드 가능
     */
    @GetMapping("/logs/download")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'OPERATOR')") // 관리자급 이상 접근 가능
    @ActionLog(action = "DOWNLOAD_EXCEL", target = "TB_ACCESS_LOG")
    public void downloadLogs(HttpServletResponse response) throws IOException {
        adminService.downloadAccessLogExcel(response);
    }

    /*
    [대시보드 통계] 일별 접속자 수 조회 API
    - 차트 라이브러리(Recharts 등)에 넣을 데이터 제공
    */
    @GetMapping("/status/daily")
    public ResultVO<List<Map<String, Object>>> getDailyStats(){
        List<Map<String, Object>> stats = adminService.getDailyVisitStats();
        return ResultVO.ok("통계 데이터를 성공적으로 불러왔습니다.",stats);
    }
}
