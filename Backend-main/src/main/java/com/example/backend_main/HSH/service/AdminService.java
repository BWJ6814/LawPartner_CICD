package com.example.backend_main.HSH.service;

import com.example.backend_main.BWJ.BoardRepository;
import com.example.backend_main.common.annotation.Masking;
import com.example.backend_main.HSH.dto.CreateOperatorRequestDto;
import com.example.backend_main.common.util.PasswordUtil;
import com.example.backend_main.common.entity.*;
import com.example.backend_main.common.exception.CustomException;
import com.example.backend_main.common.exception.ErrorCode;
import com.example.backend_main.common.repository.*;
import com.example.backend_main.common.security.IpBlacklistFilter;
import com.example.backend_main.common.spec.AccessLogSpecification;
import com.example.backend_main.common.util.HashUtil;
import com.example.backend_main.dto.Board;
import com.example.backend_main.dto.HSH_DTO.AccessLogResponseDTO;
import com.example.backend_main.dto.HSH_DTO.UserJoinRequestDto;
import com.example.backend_main.dto.HSH_DTO.UserListDto;
import jakarta.persistence.criteria.Predicate;
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
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    /** Docker 기본 TZ가 UTC일 때 LocalDate.now()가 한국 날짜와 하루 어긋나 차트만 0으로 나오는 문제 방지 */
    private static final ZoneId DASHBOARD_ZONE = ZoneId.of("Asia/Seoul");

    private final UserRepository userRepository;
    private final AccessLogRepository accessLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final HashUtil hashUtil;
    private final BlacklistIpRepository blacklistIpRepository;
    private final LawyerInfoRepository lawyerInfoRepository;
    private final BannedWordRepository bannedWordRepository;
    private final BoardRepository boardRepository;
    private final IpBlacklistFilter ipBlacklistFilter;
    private final AdminAuditRepository adminAuditRepository;
    private final com.example.backend_main.HSH.service.MailService mailService;
    private final JdbcTemplate jdbcTemplate;

    // ✅ Aes256Util 의존성 제거 — JPA Converter가 자동 암호화/복호화 처리

    // ==================================================================================
    // 👤 회원 관리
    // ==================================================================================

    @Transactional(readOnly = true)
    @Masking(fields = {"phone", "email"})
    public List<UserListDto> getAllUsers() {
        return userRepository.findAllByStatusCodeNot("S99").stream()
                .map(user -> UserListDto.builder()
                        .userNo(user.getUserNo())
                        .userId(user.getUserId())
                        .userNm(user.getUserNm())
                        .nickNm(user.getNickNm())
                        .email(user.getEmail())      // Converter가 자동 복호화된 평문 반환
                        .phone(user.getPhone())      // Converter가 자동 복호화된 평문 반환
                        .roleCode(user.getRoleCode())
                        .statusCode(user.getStatusCode())
                        .joinDt(user.getJoinDt())
                        .profileImg(user.getProfileImg())
                        .build())
                .collect(Collectors.toList());
    }

    // ==================================================================================
    // 👤 회원 상태 및 권한 관리
    // ==================================================================================

    @Transactional
    public void updateUserStatus(String userId, String targetStatusCode, String reason, String currentAdminId) {

        // 1. 대상 유저 및 관리자 조회
        User targetUser = userRepository.findByUserId(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.DATA_NOT_FOUND, "존재하지 않는 회원입니다."));

        User admin = userRepository.findByUserId(currentAdminId)
                .orElseThrow(() -> new CustomException(ErrorCode.DATA_NOT_FOUND, "관리자 정보를 찾을 수 없습니다."));

        String oldStatus = targetUser.getStatusCode();

        // 슈퍼 관리자 계정 보호
        if ("S03".equals(targetStatusCode) && "ROLE_SUPER_ADMIN".equals(targetUser.getRoleCode())) {
            throw new CustomException(ErrorCode.ACCESS_DENIED, "슈퍼 관리자 계정은 시스템 보호를 위해 정지할 수 없습니다.");
        }

        // 2. 상태 변경 (Dirty Checking)
        targetUser.setStatusCode(targetStatusCode);
        String actionDetail = "상태 변경: " + oldStatus + " -> " + targetStatusCode;

        if ("S01".equals(targetStatusCode)) {
            if ("ROLE_ASSOCIATE".equals(targetUser.getRoleCode())) {
                targetUser.setRoleCode("ROLE_LAWYER");
                lawyerInfoRepository.findById(targetUser.getUserNo()).ifPresent(LawyerInfo::approve);
                actionDetail = "변호사 승인 (ROLE_ASSOCIATE -> ROLE_LAWYER)";
            } else if ("S03".equals(oldStatus)) {
                actionDetail = "계정 정지 해제 (복구)";
            }
        } else if ("S03".equals(targetStatusCode)) {
            actionDetail = "계정 강제 정지 처리";
        }

        // 3. 감사 로그 저장
        AdminAudit auditLog = AdminAudit.builder()
                .adminNo(admin.getUserNo())
                .adminId(currentAdminId)
                .actionType("UPDATE_USER_STATUS")
                .targetInfo("대상자 ID: " + userId + " | " + actionDetail)
                .reason(reason)
                .build();

        adminAuditRepository.save(auditLog);

        log.info("🛡️ [회원 상태 변경 완료] 실행: {}, 대상: {}, 상태: {} -> {}, 사유: {}",
                currentAdminId, userId, oldStatus, targetStatusCode, reason);
    }

    @Transactional
    public void updateUserRole(String targetUserId, String roleCode, String reason, String currentAdminId) {

        // 1. 대상 유저 및 관리자 조회
        User targetUser = userRepository.findByUserId(targetUserId)
                .orElseThrow(() -> new CustomException(ErrorCode.DATA_NOT_FOUND, "대상 회원을 찾을 수 없습니다."));

        User admin = userRepository.findByUserId(currentAdminId)
                .orElseThrow(() -> new CustomException(ErrorCode.DATA_NOT_FOUND, "관리자 정보를 찾을 수 없습니다."));

        String oldRole = targetUser.getRoleCode();

        // 슈퍼 관리자 권한 보호
        if ("ROLE_SUPER_ADMIN".equals(roleCode) || "ROLE_SUPER_ADMIN".equals(oldRole)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED, "슈퍼 관리자 권한은 시스템에서 직접 조작할 수 없습니다.");
        }

        // 2. 권한 변경 (Dirty Checking)
        targetUser.setRoleCode(roleCode);

        // 3. 감사 로그 저장
        AdminAudit auditLog = AdminAudit.builder()
                .adminNo(admin.getUserNo())
                .adminId(currentAdminId)
                .actionType("UPDATE_USER_ROLE")
                .targetInfo("대상자 ID: " + targetUserId + " | 권한 변경: " + oldRole + " -> " + roleCode)
                .reason(reason)
                .build();

        adminAuditRepository.save(auditLog);

        log.info("🛡️ [회원 권한 변경 완료] 실행: {}, 대상: {}, 권한: {} -> {}, 사유: {}",
                currentAdminId, targetUserId, oldRole, roleCode, reason);
    }

    @Transactional
    public void createSubAdmin(CreateOperatorRequestDto dto, String currentAdminId) {

        // 1. 요청자 슈퍼 관리자 확인
        User currentAdmin = userRepository.findByUserId(currentAdminId)
                .orElseThrow(() -> new CustomException(ErrorCode.DATA_NOT_FOUND, "접근 권한이 없습니다."));

        if (!"ROLE_SUPER_ADMIN".equals(currentAdmin.getRoleCode())) {
            throw new CustomException(ErrorCode.ACCESS_DENIED, "하위 관리자 생성 권한이 없습니다. (슈퍼 관리자만 가능)");
        }

        // 2. 아이디 중복 체크
        if (userRepository.existsByUserId(dto.getUserId())) {
            throw new CustomException(ErrorCode.DUPLICATE_DATA, "이미 사용 중인 아이디입니다.");
        }

        // 3. 해시값 생성 (검색용)
        String emailHash = hashUtil.generateHash(dto.getEmail());
        String phoneHash = hashUtil.generateHash(dto.getPhone());

        // 4. 임시 비밀번호 생성 및 암호화
        String tempPassword = PasswordUtil.generateTempPassword();
        String encodedPw = passwordEncoder.encode(tempPassword);

        // 5. 하위 관리자 엔티티 생성 및 저장
        User subAdmin = User.builder()
                .userId(dto.getUserId())
                .userPw(encodedPw)
                .userNm(dto.getUserNm())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .emailHash(emailHash)
                .phoneHash(phoneHash)
                .roleCode("ROLE_OPERATOR")
                .statusCode("S01")
                .nickNm("관리자_" + dto.getUserNm()+"입니다.")
                .pwChangeRequired("Y")
                .build();

        userRepository.save(subAdmin);
        userRepository.updatePwChangeRequiredToY(subAdmin.getUserNo());

        String email = subAdmin.getEmail();
        mailService.sendTempPasswordMail(email, tempPassword);

        log.info("✅ [관리자 생성 완료] Admin[{}] created by SuperAdmin[{}] (PW_CHANGE_REQUIRED=Y)",
                subAdmin.getUserId(), currentAdmin.getUserId());
    }

    // ==================================================================================
    // 📋 로그 관리
    // ==================================================================================

    @Transactional(readOnly = true)
    public Page<AccessLogResponseDTO> getAccessLogs(int page, int size, String type) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("regDt").descending());
        Page<AccessLog> logPage = "ERROR".equals(type)
                ? accessLogRepository.findThreatAccessLogs(pageable)
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
        return accessLogRepository.findRecentThreats(PageRequest.of(0, 5))
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
            workbook.close();
        }
    }

    // ==================================================================================
    // 📊 대시보드 통계 (성능 최적화 버전)
    // ==================================================================================

    public Map<String, Object> getAdminSummary() {
        Map<String, Object> summary = new HashMap<>();

        // 오늘·어제 = 서비스 기준(한국) 달력 — JVM TZ(UTC)와 DB 날짜(CAST AS DATE) 불일치 방지
        LocalDate today = LocalDate.now(DASHBOARD_ZONE);
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime todayEnd = today.plusDays(1).atStartOfDay().minusNanos(1);
        LocalDateTime yesterdayStart = today.minusDays(1).atStartOfDay();
        LocalDateTime yesterdayEnd = today.atStartOfDay().minusNanos(1);

        // 1. 회원 수 통계 (DB 집계 쿼리 사용)
        long totalUsersToday = userRepository.count();
        long newUsersToday = userRepository.countByJoinDtBetween(todayStart, todayEnd);
        long newUsersYesterday = userRepository.countByJoinDtBetween(yesterdayStart, yesterdayEnd);
        long totalUsersYesterday = totalUsersToday - newUsersToday; // 어제 기준 총원

        summary.put("totalUsers", totalUsersToday);
        summary.put("totalUsersGrowth", calculateGrowth(totalUsersToday, totalUsersYesterday));
        summary.put("newUsersToday", newUsersToday);
        summary.put("newUsersGrowth", calculateGrowth(newUsersToday, newUsersYesterday));

        // 2. 방문자 수 통계 (IP 기준 중복 제거 - Unique Visitors)
        long visitorsToday = accessLogRepository.countDistinctIpByRegDtBetween(todayStart, todayEnd);
        long visitorsYesterday = accessLogRepository.countDistinctIpByRegDtBetween(yesterdayStart, yesterdayEnd);

        summary.put("todayVisitors", visitorsToday);
        summary.put("visitorsGrowth", calculateGrowth(visitorsToday, visitorsYesterday));

        // 3. 보안 위협 통계 (HTTP 4xx/5xx 또는 컨트롤러 예외가 기록된 접근)
        long threatsToday = accessLogRepository.countThreatsByRegDtBetween(todayStart, todayEnd);
        long threatsYesterday = accessLogRepository.countThreatsByRegDtBetween(yesterdayStart, yesterdayEnd);

        summary.put("securityThreats", threatsToday);
        summary.put("threatsGrowth", calculateGrowth(threatsToday, threatsYesterday));

        // 4. 승인 대기 변호사 수
        summary.put("pendingLawyers", userRepository.countByStatusCode("S02"));

        return summary;
    }

    /** 네이티브 쿼리 결과의 날짜가 java.sql.Date/Timestamp 등으로 오면 toString이 yyyy-MM-dd와 달라 병합이 실패함 → 앞 10자만 사용 */
    private static String normalizeChartDateKey(Object dateObj) {
        if (dateObj == null) return "";
        String s = String.valueOf(dateObj).trim();
        if (s.length() >= 10 && s.charAt(4) == '-' && s.charAt(7) == '-') {
            return s.substring(0, 10);
        }
        return s;
    }

    private static long toLongCount(Object countObj) {
        if (countObj == null) return 0L;
        if (countObj instanceof Number n) return n.longValue();
        try {
            return Long.parseLong(String.valueOf(countObj));
        } catch (NumberFormatException e) {
            return 0L;
        }
    }

    /**
     * 일별 방문/가입 추이. DATE_FORMAT+GROUP BY 환경·드라이버에 따라 실패할 수 있어 CAST(DATE) + queryForList 사용.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getDailyVisitStats(int days) {
        if (days < 2) days = 2;

        LocalDate today = LocalDate.now(DASHBOARD_ZONE);
        LocalDate startDay = today.minusDays(days - 1);
        // JPA와 동일하게 DATETIME은 타임존 없는 wall-clock으로 저장됨 → Instant/Timestamp가 아닌 LocalDateTime으로 바인딩해야 범위 비교가 맞음
        LocalDateTime rangeStart = startDay.atStartOfDay();

        Map<String, Map<String, Object>> mergedMap = new TreeMap<>();
        for (int i = days - 1; i >= 0; i--) {
            String date = today.minusDays(i).toString();
            Map<String, Object> data = new HashMap<>();
            data.put("date", date);
            data.put("visitors", 0L);
            data.put("users", 0L);
            mergedMap.put(date, data);
        }

        // 소문자 테이블명: Linux + lower_case_table_names=0 환경에서 대문자만 쓰면 SQL 실패 → catch 후 전부 0으로 보임
        String sqlLog = "SELECT CAST(REG_DT AS DATE) AS day_key, COUNT(DISTINCT REQ_IP) AS cnt "
                + "FROM tb_access_log WHERE REG_DT >= ? "
                + "GROUP BY CAST(REG_DT AS DATE)";
        String sqlUser = "SELECT CAST(JOIN_DT AS DATE) AS day_key, COUNT(*) AS cnt "
                + "FROM tb_user WHERE JOIN_DT >= ? "
                + "GROUP BY CAST(JOIN_DT AS DATE)";

        List<Map<String, Object>> logRows;
        List<Map<String, Object>> userRows;
        try {
            logRows = jdbcTemplate.queryForList(sqlLog, rangeStart);
            userRows = jdbcTemplate.queryForList(sqlUser, rangeStart);
            log.info("일별 통계 SQL 행 수: access_log={}, tb_user={}", logRows.size(), userRows.size());
        } catch (DataAccessException e) {
            log.error("일별 통계 SQL 실패 (tb_access_log / tb_user): {}", e.getMostSpecificCause().getMessage(), e);
            return new ArrayList<>(mergedMap.values());
        }

        for (Map<String, Object> row : logRows) {
            Object dayObj = mapGetIgnoreCase(row, "day_key");
            Object cntObj = mapGetIgnoreCase(row, "cnt");
            if (dayObj == null) continue;
            String date = normalizeChartDateKey(dayObj);
            if (mergedMap.containsKey(date)) {
                mergedMap.get(date).put("visitors", toLongCount(cntObj));
            }
        }
        for (Map<String, Object> row : userRows) {
            Object dayObj = mapGetIgnoreCase(row, "day_key");
            Object cntObj = mapGetIgnoreCase(row, "cnt");
            if (dayObj == null) continue;
            String date = normalizeChartDateKey(dayObj);
            if (mergedMap.containsKey(date)) {
                mergedMap.get(date).put("users", toLongCount(cntObj));
            }
        }

        return new ArrayList<>(mergedMap.values());
    }

    private static Object mapGetIgnoreCase(Map<String, Object> row, String key) {
        if (row == null || key == null) return null;
        for (Map.Entry<String, Object> e : row.entrySet()) {
            if (e.getKey() != null && e.getKey().equalsIgnoreCase(key)) {
                return e.getValue();
            }
        }
        return null;
    }

    private String calculateGrowth(long current, long previous) {
        if (previous == 0) return current > 0 ? "+100%" : "0%";
        double growth = ((double) (current - previous) / previous) * 100;
        return String.format("%s%.1f%%", growth >= 0 ? "+" : "", growth);
    }

    // ==================================================================================
    // 🚨 IP 블랙리스트 관리
    // ==================================================================================

    @Transactional(readOnly = true)
    public List<BlacklistIp> getAllBlacklist() {
        return blacklistIpRepository.findAll();
    }

    @Transactional
    public void addBlacklist(String ip, String reason, String adminId) {
        if (ip == null || ip.isBlank()) {
            throw new CustomException(ErrorCode.INVALID_INPUT, "IP 주소는 필수입니다.");
        }
        if (reason == null || reason.isBlank()) {
            throw new CustomException(ErrorCode.INVALID_INPUT, "차단 사유는 필수입니다.");
        }

        if (blacklistIpRepository.existsById(ip)) {
            // ✅ IllegalArgumentException → CustomException 통일
            throw new CustomException(ErrorCode.DUPLICATE_DATA, "이미 차단된 IP입니다.");
        }

        User admin = userRepository.findByUserId(adminId)
                .orElseThrow(() -> new CustomException(ErrorCode.DATA_NOT_FOUND, "관리자 정보를 찾을 수 없습니다."));

        BlacklistIp blacklistIp = BlacklistIp.builder()
                .ipAddress(ip)
                .reason(reason)
                .adminNo(admin.getUserNo())
                .blockDt(LocalDateTime.now())
                .build();

        blacklistIpRepository.save(blacklistIp);
        log.info("🚨 [IP 차단 완료] IP: {}, 사유: {}, 관리자: {}", ip, reason, adminId);
        ipBlacklistFilter.refreshCacheNow();
    }

    @Transactional
    public void removeBlacklist(String ip, String reason) {
        // ✅ reason 파라미터 추가 (기존 누락) — AdminController에서도 함께 전달 필요
        BlacklistIp target = blacklistIpRepository.findById(ip)
                .orElseThrow(() -> new CustomException(ErrorCode.DATA_NOT_FOUND, "차단 목록에 없는 IP입니다."));

        blacklistIpRepository.delete(target);
        log.info("✅ [IP 차단 해제 완료] IP: {}, 사유: {}", ip, reason);
        ipBlacklistFilter.refreshCacheNow();
    }

    // ==================================================================================
    // 🔤 금지어 관리
    // ==================================================================================

    @Transactional
    public void addBannedWord(String word, String reason, String currentAdminId) {
        if (bannedWordRepository.existsByWord(word)) {
            // ✅ IllegalArgumentException → CustomException 통일
            throw new CustomException(ErrorCode.DUPLICATE_DATA, "이미 등록된 금지어입니다.");
        }

        User admin = userRepository.findByUserId(currentAdminId)
                .orElseThrow(() -> new CustomException(ErrorCode.DATA_NOT_FOUND, "관리자 정보를 찾을 수 없습니다."));

        BannedWord newWord = BannedWord.builder()
                .word(word)
                .adminNo(admin.getUserNo())
                .reason(reason)
                .build();

        bannedWordRepository.save(newWord);
        log.info("🛡️ [금지어 등록 완료] [{}] by Admin: {} / 사유: {}", word, currentAdminId, reason);
    }

    @Transactional
    public void deleteBannedWord(Long wordNo) {
        if (!bannedWordRepository.existsById(wordNo)) {
            // ✅ IllegalArgumentException → CustomException 통일
            throw new CustomException(ErrorCode.DATA_NOT_FOUND, "존재하지 않는 금지어입니다.");
        }
        bannedWordRepository.deleteById(wordNo);
        log.info("🛡️ [금지어 삭제 완료] wordNo: {}", wordNo);
    }

    @Transactional(readOnly = true)
    public List<BannedWord> getAllBannedWords() {
        return bannedWordRepository.findAll();
    }

    // ==================================================================================
    // 📝 게시글 관리
    // ==================================================================================

    /** 관리자 콘텐츠 보안: 키워드(제목 부분일치·글번호·작성자번호)·블라인드·카테고리 코드 부분일치·페이징 */
    @Transactional(readOnly = true)
    public Page<Board> searchBoardsForAdmin(String keyword, String blindYn, String category, Pageable pageable) {
        Specification<Board> spec = adminBoardSpecification(keyword, blindYn, category);
        return boardRepository.findAll(spec, pageable);
    }

    private Specification<Board> adminBoardSpecification(String keyword, String blindYn, String category) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(blindYn) && !"ALL".equalsIgnoreCase(blindYn.trim())) {
                String b = blindYn.trim().toUpperCase(Locale.ROOT);
                if ("Y".equals(b) || "N".equals(b)) {
                    predicates.add(cb.equal(root.get("blindYn"), b));
                }
            }
            if (StringUtils.hasText(category)) {
                predicates.add(cb.like(root.get("categoryCode"), "%" + category.trim() + "%"));
            }
            if (StringUtils.hasText(keyword)) {
                String k = keyword.trim();
                List<Predicate> ors = new ArrayList<>();
                ors.add(cb.like(cb.lower(root.get("title")), "%" + k.toLowerCase(Locale.ROOT) + "%"));
                try {
                    long num = Long.parseLong(k);
                    if (num >= 0) {
                        ors.add(cb.equal(root.get("boardNo"), num));
                        ors.add(cb.equal(root.get("writerNo"), num));
                    }
                } catch (NumberFormatException ignored) {
                    // 제목 LIKE 만 사용
                }
                predicates.add(cb.or(ors.toArray(new Predicate[0])));
            }
            if (predicates.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    @Transactional
    public void toggleBoardBlind(Long boardNo, String reason, String currentAdminId) {
        Board board = boardRepository.findById(boardNo)
                .orElseThrow(() -> new CustomException(ErrorCode.DATA_NOT_FOUND, "게시글이 존재하지 않습니다."));

        String currentBlind = board.getBlindYn() != null ? board.getBlindYn() : "N";
        String nextStatus = "Y".equals(currentBlind) ? "N" : "Y";
        board.setBlindYn(nextStatus);

        log.warn("🚨 [콘텐츠 차단 로그] 게시글 No.{}: {} 사유: {} (By 관리자: {})",
                boardNo, "Y".equals(nextStatus) ? "차단" : "해제", reason, currentAdminId);
    }


}