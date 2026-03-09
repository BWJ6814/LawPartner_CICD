package com.example.backend_main.HSH.service;

import com.example.backend_main.BWJ.BoardRepository;
import com.example.backend_main.common.entity.*;
import com.example.backend_main.common.repository.*;
import com.example.backend_main.common.spec.AccessLogSpecification;
import com.example.backend_main.common.util.Aes256Util;
import com.example.backend_main.common.util.HashUtil;
import com.example.backend_main.dto.Board;
import com.example.backend_main.dto.HSH_DTO.AccessLogResponseDTO;
import com.example.backend_main.dto.HSH_DTO.UserJoinRequestDTO;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final AccessLogRepository accessLogRepository;
    private final Aes256Util aes256Util;
    private final PasswordEncoder passwordEncoder;
    private final HashUtil hashUtil;
    private final BlacklistIpRepository blacklistIpRepository;
    private final LawyerInfoRepository lawyerInfoRepository;
    private final BannedWordRepository bannedWordRepository;
    private final BoardRepository boardRepository;

    // ==================================================================================
    // 👤 회원 관리
    // ==================================================================================

    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        return userRepository.findAllByStatusCodeNot("S99").stream()
                .map(user -> {
                    try {
                        String decryptedEmail = aes256Util.decrypt(user.getEmail());
                        String decryptedPhone = aes256Util.decrypt(user.getPhone());
                        return User.builder()
                                .userNo(user.getUserNo())
                                .userId(user.getUserId())
                                .userNm(user.getUserNm())
                                .nickNm(user.getNickNm())
                                .email(decryptedEmail)
                                .phone(decryptedPhone)
                                .roleCode(user.getRoleCode())
                                .statusCode(user.getStatusCode())
                                .joinDt(user.getJoinDt())
                                .build();
                    } catch (Exception e) {
                        // 복호화 실패 시 암호화된 원본 대신 안내 텍스트로 대체
                        // → 관리자 화면에 깨진 글자가 노출되는 문제 방지
                        log.error("🚨 [복호화 실패] User.No {}번", user.getUserNo());
                        return User.builder()
                                .userNo(user.getUserNo())
                                .userId(user.getUserId())
                                .userNm(user.getUserNm())
                                .nickNm(user.getNickNm())
                                .email("(복호화 실패)")
                                .phone("(복호화 실패)")
                                .roleCode(user.getRoleCode())
                                .statusCode(user.getStatusCode())
                                .joinDt(user.getJoinDt())
                                .build();
                    }
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateUserStatus(String userId, String targetStatusCode, String reason, String currentAdminId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

        String oldStatus = user.getStatusCode();

        if ("S03".equals(targetStatusCode) && "ROLE_SUPER_ADMIN".equals(user.getRoleCode())) {
            throw new IllegalArgumentException("슈퍼 관리자 계정은 시스템 보호를 위해 정지할 수 없습니다.");
        }

        user.setStatusCode(targetStatusCode);

        if ("S01".equals(targetStatusCode)) {
            if ("ROLE_ASSOCIATE".equals(user.getRoleCode())) {
                user.setRoleCode("ROLE_LAWYER");
                lawyerInfoRepository.findById(user.getUserNo()).ifPresent(LawyerInfo::approve);
                log.info("🎉 [변호사 승인] 관리자[{}]에 의해 회원[{}]의 권한이 ROLE_LAWYER로 승격되었습니다. 사유: {}",
                        currentAdminId, user.getUserId(), reason);
            } else if ("S03".equals(oldStatus)) {
                log.info("🔄 [계정 복구] 관리자[{}]에 의해 정지 처리되었던 회원[{}]이 정상 활동으로 복구되었습니다. 사유: {}",
                        currentAdminId, user.getUserId(), reason);
            }
        } else if ("S03".equals(targetStatusCode)) {
            log.warn("🚨 [계정 정지] 회원[{}]이 관리자[{}]에 의해 강제 정지(블랙리스트) 처리되었습니다. 사유: {}",
                    user.getUserId(), currentAdminId, reason);
        }

        log.info("🛡️ [회원 상태 변경 완료] 실행 관리자: {}, 대상 회원: {}, 상태: {} -> {}, 사유: {}",
                currentAdminId, userId, oldStatus, targetStatusCode, reason);
    }

    @Transactional
    public void updateUserRole(String targetUserId, String roleCode, String reason, String currentAdminId) {
        User targetUser = userRepository.findByUserId(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("대상 회원을 찾을 수 없습니다."));

        String oldRole = targetUser.getRoleCode();

        if ("ROLE_SUPER_ADMIN".equals(roleCode) || "ROLE_SUPER_ADMIN".equals(oldRole)) {
            throw new AccessDeniedException("슈퍼 관리자 권한은 시스템에서 직접 조작할 수 없습니다.");
        }

        targetUser.setRoleCode(roleCode);

        log.info("🛡️ [회원 권한 변경 완료] 실행 관리자: {}, 대상 회원: {}, 권한: {} -> {}, 사유: {}",
                currentAdminId, targetUserId, oldRole, roleCode, reason);
    }

    // throws Exception 제거 — checked exception을 내부에서 unchecked로 변환
    @Transactional
    public void createSubAdmin(UserJoinRequestDTO joinDto, String currentAdminId) {

        // 1. 요청자 슈퍼 관리자 확인
        User currentAdmin = userRepository.findByUserId(currentAdminId)
                .orElseThrow(() -> new IllegalArgumentException("접근 권한이 없습니다."));

        if (!"ROLE_SUPER_ADMIN".equals(currentAdmin.getRoleCode())) {
            throw new IllegalArgumentException("하위 관리자 생성 권한이 없습니다. (슈퍼 관리자만 가능)");
        }

        // 2. 아이디 중복 체크
        if (userRepository.existsByUserId(joinDto.getUserId())) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }

        // 3. PII 암호화 — checked exception을 IllegalStateException으로 변환
        // (사용자 입력 오류가 아닌 시스템 내부 오류이므로 IllegalStateException 사용)
        String encEmail, encPhone, emailHash, phoneHash;
        try {
            encEmail = aes256Util.encrypt(joinDto.getEmail());
            encPhone = aes256Util.encrypt(joinDto.getPhone());
            emailHash = hashUtil.generateHash(joinDto.getEmail());
            phoneHash = hashUtil.generateHash(joinDto.getPhone());
        } catch (Exception e) {
            log.error("🚨 [암호화 실패] 관리자 생성 중 암호화 오류 발생", e);
            throw new IllegalStateException("개인정보 암호화 처리 중 오류가 발생했습니다.");
        }

        // 4. 하위 관리자 엔티티 생성 및 저장
        User subAdmin = User.builder()
                .userId(joinDto.getUserId())
                .userPw(passwordEncoder.encode(joinDto.getUserPw()))
                .userNm(joinDto.getUserNm())
                .email(encEmail)
                .phone(encPhone)
                .emailHash(emailHash)
                .phoneHash(phoneHash)
                .roleCode("ROLE_OPERATOR")
                .statusCode("S01")
                .build();

        userRepository.save(subAdmin);

        log.info("✅ [관리자 생성 완료] Admin[{}] created by SuperAdmin[{}]",
                subAdmin.getUserId(), currentAdmin.getUserId());
    }

    // ==================================================================================
    // 📋 로그 관리
    // ==================================================================================

    @Transactional(readOnly = true)
    public Page<AccessLogResponseDTO> getAccessLogs(int page, int size, String type) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("regDt").descending());
        Page<AccessLog> logPage = "ERROR".equals(type)
                ? accessLogRepository.findByStatusCodeGreaterThanEqual(400, pageable)
                : accessLogRepository.findAll(pageable);
        return logPage.map(AccessLogResponseDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<AccessLogResponseDTO> searchAccessLogs(int page, int size, String startDate, String endDate,
                                                       String keywordType, String keyword, String statusType) {
        Pageable pageable = PageRequest.of(page, size);
        Specification<AccessLog> spec = AccessLogSpecification.searchLog(startDate, endDate, keywordType, keyword, statusType);
        return accessLogRepository.findAll(spec, pageable).map(AccessLogResponseDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<AccessLogResponseDTO> getRecentThreats() {
        return accessLogRepository.findTop5ByStatusCodeGreaterThanEqualOrderByRegDtDesc(400)
                .stream()
                .map(AccessLogResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public void downloadAccessLogExcel(HttpServletResponse response) throws IOException {
        SXSSFWorkbook workbook = new SXSSFWorkbook(100);
        try {
            Sheet sheet = workbook.createSheet("보안 감사 로그");

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            Row headerRow = sheet.createRow(0);
            String[] headers = {"로그번호", "추적ID", "IP주소", "요청URL", "상태코드", "수행시간(ms)", "발생일시", "에러내용"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 4000);
            }

            List<AccessLog> logs = accessLogRepository.findAll();
            int rowNum = 1;
            for (AccessLog logData : logs) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(logData.getLogNo());
                row.createCell(1).setCellValue(logData.getTraceId());
                row.createCell(2).setCellValue(logData.getReqIp());
                row.createCell(3).setCellValue(logData.getReqUri());
                row.createCell(4).setCellValue(logData.getStatusCode() != null ? logData.getStatusCode() : 0);
                row.createCell(5).setCellValue(logData.getExecTime() != null ? logData.getExecTime() : 0);
                row.createCell(6).setCellValue(logData.getRegDt().toString());
                row.createCell(7).setCellValue(logData.getErrorMsg() != null ? logData.getErrorMsg() : "");
            }

            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=\"security_logs.xlsx\"");
            workbook.write(response.getOutputStream());

        } catch (Exception e) {
            log.error("🚨 [엑셀 다운로드 실패]", e);
            throw new IOException("엑셀 생성 중 오류가 발생했습니다.");
        } finally {
            workbook.dispose();
            workbook.close();
        }
    }

    // ==================================================================================
    // 📊 대시보드 통계
    // ==================================================================================

    public Map<String, Object> getAdminSummary() {
        Map<String, Object> summary = new HashMap<>();

        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        List<User> allUsers = userRepository.findAll();
        long totalUsersToday = allUsers.size();
        long newUsersToday = allUsers.stream()
                .filter(u -> u.getJoinDt() != null && u.getJoinDt().toLocalDate().isEqual(today))
                .count();
        long newUsersYesterday = allUsers.stream()
                .filter(u -> u.getJoinDt() != null && u.getJoinDt().toLocalDate().isEqual(yesterday))
                .count();
        long totalUsersYesterday = totalUsersToday - newUsersToday;

        summary.put("totalUsers", totalUsersToday);
        summary.put("totalUsersGrowth", calculateGrowth(totalUsersToday, totalUsersYesterday));
        summary.put("newUsersToday", newUsersToday);
        summary.put("newUsersGrowth", calculateGrowth(newUsersToday, newUsersYesterday));

        List<AccessLog> allLogs = accessLogRepository.findAll();
        long visitorsToday = allLogs.stream()
                .filter(l -> l.getRegDt() != null && l.getRegDt().toLocalDate().isEqual(today))
                .count();
        long visitorsYesterday = allLogs.stream()
                .filter(l -> l.getRegDt() != null && l.getRegDt().toLocalDate().isEqual(yesterday))
                .count();
        summary.put("todayVisitors", visitorsToday);
        summary.put("visitorsGrowth", calculateGrowth(visitorsToday, visitorsYesterday));

        long threatsToday = allLogs.stream()
                .filter(l -> l.getStatusCode() != null && l.getStatusCode() >= 400
                        && l.getRegDt() != null && l.getRegDt().toLocalDate().isEqual(today))
                .count();
        long threatsYesterday = allLogs.stream()
                .filter(l -> l.getStatusCode() != null && l.getStatusCode() >= 400
                        && l.getRegDt() != null && l.getRegDt().toLocalDate().isEqual(yesterday))
                .count();
        summary.put("securityThreats", threatsToday);
        summary.put("threatsGrowth", calculateGrowth(threatsToday, threatsYesterday));
        summary.put("pendingLawyers", allUsers.stream().filter(u -> "S02".equals(u.getStatusCode())).count());

        return summary;
    }

    public List<Map<String, Object>> getDailyVisitStats(int days) {
        if (days < 2) days = 2;

        LocalDateTime startDate = LocalDateTime.now().minusDays(days - 1);
        List<Map<String, Object>> userStats = userRepository.findDailySignupStats(startDate);
        List<Map<String, Object>> logStats = accessLogRepository.findDailyVisitorStats(startDate);

        Map<String, Map<String, Object>> mergedMap = new TreeMap<>();
        for (int i = days - 1; i >= 0; i--) {
            String date = LocalDateTime.now().minusDays(i).toLocalDate().toString();
            Map<String, Object> data = new HashMap<>();
            data.put("date", date);
            data.put("visitors", 0L);
            data.put("users", 0L);
            mergedMap.put(date, data);
        }

        for (Map<String, Object> stat : logStats) {
            Object dateObj = stat.getOrDefault("date", stat.get("DATE"));
            Object countObj = stat.getOrDefault("count", stat.get("COUNT"));
            String date = String.valueOf(dateObj);
            if (mergedMap.containsKey(date)) mergedMap.get(date).put("visitors", countObj);
        }

        for (Map<String, Object> stat : userStats) {
            Object dateObj = stat.getOrDefault("date", stat.get("DATE"));
            Object countObj = stat.getOrDefault("count", stat.get("COUNT"));
            String date = String.valueOf(dateObj);
            if (mergedMap.containsKey(date)) mergedMap.get(date).put("users", countObj);
        }

        return new ArrayList<>(mergedMap.values());
    }

    private String calculateGrowth(long current, long previous) {
        if (previous == 0) return current > 0 ? "+100%" : "0%";
        double growth = ((double) (current - previous) / previous) * 100;
        return String.format("%s%.1f%%", growth >= 0 ? "+" : "", growth);
    }

    // ==================================================================================
    // 🚨 IP 블랙리스트 관리
    // ==================================================================================

    // ✅ [추가] 컨트롤러에서 Repository 직접 호출하던 것을 Service로 이동
    @Transactional(readOnly = true)
    public List<BlacklistIp> getAllBlacklist() {
        return blacklistIpRepository.findAll();
    }

    @Transactional
    public void addBlacklist(String ip, String reason, String adminId) {
        if (blacklistIpRepository.existsById(ip)) {
            throw new IllegalArgumentException("이미 차단된 IP입니다.");
        }

        User admin = userRepository.findByUserId(adminId)
                .orElseThrow(() -> new IllegalArgumentException("관리자 정보를 찾을 수 없습니다."));

        BlacklistIp blacklistIp = BlacklistIp.builder()
                .ipAddress(ip)
                .reason(reason)
                .adminNo(admin.getUserNo())
                .blockDt(LocalDateTime.now())
                .build();

        blacklistIpRepository.save(blacklistIp);
    }

    @Transactional
    public void removeBlacklist(String ip) {
        BlacklistIp target = blacklistIpRepository.findById(ip)
                .orElseThrow(() -> new IllegalArgumentException("차단 목록에 없는 IP입니다."));
        blacklistIpRepository.delete(target);
    }

    // ==================================================================================
    // 🔤 금지어 관리
    // ==================================================================================

    @Transactional
    public void addBannedWord(String word, String reason, String currentAdminId) {
        if (bannedWordRepository.existsByWord(word)) {
            throw new IllegalArgumentException("이미 등록된 금지어입니다.");
        }

        User admin = userRepository.findByUserId(currentAdminId)
                .orElseThrow(() -> new IllegalArgumentException("관리자 정보 없음"));

        BannedWord newWord = BannedWord.builder()
                .word(word)
                .adminNo(admin.getUserNo())
                .build();

        bannedWordRepository.save(newWord);
        log.info("🛡️ [금지어 등록 완료] [{}] by Admin: {} / 사유: {}", word, currentAdminId, reason);
    }

    // ✅ [추가] 컨트롤러에서 Repository 직접 호출하던 것을 Service로 이동
    @Transactional
    public void deleteBannedWord(Long wordNo) {
        if (!bannedWordRepository.existsById(wordNo)) {
            throw new IllegalArgumentException("존재하지 않는 금지어입니다.");
        }
        bannedWordRepository.deleteById(wordNo);
        log.info("🛡️ [금지어 삭제 완료] wordNo: {}", wordNo);
    }

    // ==================================================================================
    // 📝 게시글 관리
    // ==================================================================================

    // ✅ [추가] 컨트롤러에서 Repository 직접 호출하던 것을 Service로 이동
    @Transactional(readOnly = true)
    public List<Board> getAllBoards() {
        return boardRepository.findAll();
    }

    @Transactional
    public void toggleBoardBlind(Long boardNo, String reason, String currentAdminId) {
        Board board = boardRepository.findById(boardNo)
                .orElseThrow(() -> new IllegalArgumentException("게시글이 존재하지 않습니다."));

        String currentBlind = board.getBlindYn() != null ? board.getBlindYn() : "N";
        String nextStatus = "Y".equals(currentBlind) ? "N" : "Y";
        board.setBlindYn(nextStatus);

        log.warn("🚨 [콘텐츠 차단 로그] 게시글 No.{}: {} 사유: {} (By 관리자: {})",
                boardNo, "Y".equals(nextStatus) ? "차단" : "해제", reason, currentAdminId);
    }
}