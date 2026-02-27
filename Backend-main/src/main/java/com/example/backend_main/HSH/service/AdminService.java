
package com.example.backend_main.HSH.service;

import com.example.backend_main.common.entity.AccessLog;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.repository.AccessLogRepository;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.common.spec.AccessLogSpecification;
import com.example.backend_main.common.util.Aes256Util;
import com.example.backend_main.common.util.HashUtil; // 해시 유틸
import com.example.backend_main.dto.UserJoinRequestDTO;
import com.example.backend_main.dto.AccessLogResponseDTO;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*; // Excel 관련
import org.apache.poi.xssf.streaming.SXSSFWorkbook; // 대용량 Excel
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // 트랜잭션
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;            // 회원 정보 DB
    private final AccessLogRepository accessLogRepository;  // 로그 정보 DB
    private final Aes256Util aes256Util;                    // PII 전용 암호기
    private final PasswordEncoder passwordEncoder;          // 비밀번호 암호기
    private final HashUtil hashUtil;                        // 단방향 해시 처리 (검색용)

    // [화면 조회용] 회왼 목록 조회 API
    // 모든 회원 목록을 가져오는 함수 정의하기
    // List<User> : 여러 명의 유저 정보를 리스트 형태의 묶음으로 반환처리.. - JSON 데이터 반환
    @Transactional(readOnly = true)
    public List<User> getAllUsers() {

        // userRepository.findAll() : DB의 TB_USER 테이블에 있는 모든 데이터를 싹 긁어오기
        // .stream() : 긁어온 데이터 뭉치를 한 명씩 차례대로 처리할 수 있는 [흐름] 상태로 만들기
        return userRepository.findAllByStatusCodeNot("S99").stream()
                // .map(user -> {...} ) : 흐름 속의 유저 한 명(user)을 꺼내서 원하는 모양으로 변신시키기
                .map(user -> {
                    try {
                        // 관리자가 볼 수 있게 이메일과 전화번호 복호화
                        // cryptoUtil.decrypt(...) : DB에 잠겨있던 이메일과 전화번호를 해독기에 넣어서
                        // 읽을 수 있는 글자로 변환!
                        String decryptedEmail = aes256Util.decrypt(user.getEmail());
                        String decryptedPhone = aes256Util.decrypt(user.getPhone());

                        // 복호화된 정보를 담은 새로운 객체 생성 (보안상 DTO 변환 추천)
                        // User.builder() : 해독된 정보를 새로 담아서 [조립] 하기
                        // 원래 데이터는 그대로 두고, 관리자 화면에 보여줄 '깨끗한 데이터'를 새로 만드는 과정
                        return User.builder()
                                .userNo(user.getUserNo())           // 번호 그대로
                                .userId(user.getUserId())           // 아이디 그대로
                                .userNm(user.getUserNm())           // 이름 그대로
                                .nickNm(user.getNickNm())           // 유저 닉네임 그대로
                                .email(decryptedEmail)              // [중요] 해독된 이메일
                                .phone(decryptedPhone)              // [중요] 해독된 휴대폰 번호
                                .roleCode(user.getRoleCode())       // 권한 코드 그대로
                                .statusCode(user.getStatusCode())   // 계정 상태 그대로
                                .joinDt(user.getJoinDt())           // 회원 가입 날짜 그대로
                                .build();                           // 조립 완료..!
                    } catch (Exception e) {
                        // 실패 시 암호화된 상태로 반환
                        // catch : 혹시라도 해독 중에 에러가 나면 프로그램이 멈추지 않게 방어하기..!
                        // 에러가 나면 그냥 원래의(암호화된) 유저 정보를 그대로 보내주기
                        log.error("복호화 오류 발생: User.No {}번 ",user.getUserNo());
                        return user;
                    }
                })
                // .collect(Collectors.toList()) : 한 명씩 변신시킨 유저들을 다시 하나의 리스트로 예쁘게 모으기
                .collect(Collectors.toList());
    }

    // [엑셀 다운로드용] 보안 감사 로그 엑셀 다운로드 (SXSSF 방식)
    // 리액트에서 '엑셀 다운로드' 버튼 클릭 시 호출
    // 특징 : 메모리 사용량을 최소화하여 대용량 처리 가능
    @Transactional(readOnly = true)
    public void downloadAccessLogExcel(HttpServletResponse response) throws IOException {
        // 핵심!!! : 메모리에 100행만 유지, 나머지는 임시 파일로 기록하기 (OOM 방지)
        SXSSFWorkbook workbook = new SXSSFWorkbook(100);

        try {
            Sheet sheet = workbook.createSheet("보안 감사 로그");

            // 헤더 스타일 (회색 배경, 굵은 글씨)
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            // 헤더 생성
            Row headerRow = sheet.createRow(0);
            String[] headers = {"로그번호", "추적ID", "IP주소", "요청URL", "상태코드", "수행시간(ms)", "발생일시", "에러내용"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 4000);
            }

            // 데이터 조회 (로그 전체)
            List<AccessLog> logs = accessLogRepository.findAll();

            // 데이터 채우기
            int rowNum = 1;
            for (AccessLog logData : logs) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(logData.getLogNo());
                row.createCell(1).setCellValue(logData.getTraceId());
                row.createCell(2).setCellValue(logData.getReqIp());
                row.createCell(3).setCellValue(logData.getReqUri());
                // Null 처리 (DB에 값이 없을 수도 있으므로 안전하게)
                row.createCell(4).setCellValue(logData.getStatusCode() != null ? logData.getStatusCode() : 0);
                row.createCell(5).setCellValue(logData.getExecTime() != null ? logData.getExecTime() : 0);
                row.createCell(6).setCellValue(logData.getRegDt().toString());
                row.createCell(7).setCellValue(logData.getErrorMsg() != null ? logData.getErrorMsg() : "");
            }

            // 컨텐츠 타입 설정 (브라우저가 엑셀 파일임을 인식하도록)
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=\"security_logs.xlsx\"");

            // 클라이언트로 전송
            workbook.write(response.getOutputStream());

        } catch (Exception e) {
            log.error("엑셀 다운로드 실패", e);
            throw new IOException("엑셀 생성 중 오류가 발생했습니다.");
        } finally {
            // ★ 중요: 서버에 생성된 임시 파일 삭제 (디스크 공간 확보)
            workbook.dispose();
            workbook.close();
        }
    }

    /*
    [슈퍼 관리자 전용] 하위 관리자 생성 로직
    */
    @Transactional
    public void createSubAdmin(UserJoinRequestDTO joinDto, Long currentAdminNo) throws Exception{

        // 1. 요청자가 진짜 슈퍼 관리자인지 DB에서 다시 확인하기(철통 보안)!!
        User currentAdmin = userRepository.findById(currentAdminNo)
                .orElseThrow(() -> new IllegalArgumentException("접근 권한이 없습니다."));

        // 슈퍼 관리자가 아닐 경우 즉시 차단하기.
        // DB에 ROLE_SUPER_ADMIN을 가진 계정 하나 만들기
        if (!"ROLE_SUPER_ADMIN".equals(currentAdmin.getRoleCode())){
            throw new SecurityException("하위 관리자 생성 권한이 없습니다. (슈퍼 관리자만 가능)");
        }

        // 2. 아이디 중복 체크 하기
        if(userRepository.existsByUserId(joinDto.getUserId())) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }

        // 3. PII(개인정보) 암호화 (이메일/전화번호)
        String encEmail = aes256Util.encrypt(joinDto.getEmail());
        String encPhone = aes256Util.encrypt(joinDto.getPhone());

        // 4. 검색용 해시값 생성하기
        String emailHash = hashUtil.generateHash(joinDto.getEmail());
        String phoneHash = hashUtil.generateHash(joinDto.getPhone());

        // 5. 하위 관리자(Operator) 엔티티 생성하기
        User subAdmin = User.builder()
                .userId(joinDto.getUserId())
                .userPw(passwordEncoder.encode(joinDto.getUserPw()))    // 비밀번호는 암호화
                .userNm(joinDto.getUserNm())
                .email(encEmail)
                .phone(encPhone)
                .emailHash(emailHash)
                .phoneHash(phoneHash)
                .roleCode("ROLE_OPERATOR")                              // 운영자
                .statusCode("S01")                                      // 상태 정상 처리
                .build();

        userRepository.save(subAdmin);

        log.info("✅ 관리자 생성 완료: Admin[{}] created by SuperAdmin[{}]", subAdmin.getUserId(), currentAdmin.getUserId());

    }

    @Transactional
    public void changeUserStatus(String userId, String targetStatusCode) {
        // 1. 대상 회원 찾기
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

        String oldStatus = user.getStatusCode(); // 변경 전 상태 기억

        // ====================================================================
        // 🛡️ [보안 방어 로직] 최고 관리자는 절대 강제 정지(S03) 불가!
        // ====================================================================
        if ("S03".equals(targetStatusCode)) {
            if ("ROLE_SUPER_ADMIN".equals(user.getRoleCode())) {
                throw new IllegalArgumentException("슈퍼 관리자 계정은 시스템 보호를 위해 정지할 수 없습니다.");
            }
        }


        // 2. 상태 변경 (Setter 사용)
        user.setStatusCode(targetStatusCode);

        // 3. [비즈니스 로직 완벽 연동]
        if ("S01".equals(targetStatusCode)) {
            // 케이스 A: [변호사 승인] 준회원(ROLE_ASSOCIATE) -> 정상(S01) 변경 시
            if ("ROLE_ASSOCIATE".equals(user.getRoleCode())) {
                user.setRoleCode("ROLE_LAWYER");
                log.info("🎉 [변호사 승인] 회원[{}]의 권한이 ROLE_LAWYER로 완벽하게 승격되었습니다.", user.getUserId());
            }
            // 케이스 B: [계정 복구] 기존에 정지(S03)였던 유저를 정상(S01)으로 돌릴 때
            else if ("S03".equals(oldStatus)) {
                log.info("🔄 [계정 복구] 블랙리스트/정지 처리되었던 회원[{}]이 정상 활동으로 복구되었습니다.", user.getUserId());
            }
        }
        else if ("S03".equals(targetStatusCode)) {
            // 케이스 C: [블랙리스트 / 강제 정지]
            log.warn("🚨 [계정 정지] 회원[{}]이 관리자에 의해 강제 정지(블랙리스트) 처리되었습니다.", user.getUserId());
            // (추후 확장 포인트: 정지되는 순간 이 유저의 RefreshToken을 DB에서 삭제해버리면, 즉시 로그아웃 시킬 수 있습니다!)
        }


        // JPA의 Dirty Checking으로 인해 save를 호출하지 않아도 트랜잭션 종료 시 자동 업데이트되지만,
        // 명시적으로 작성하는 것이 가독성에 좋습니다.
        userRepository.save(user);

        log.info("🔧 회원[{}] 상태 변경 완료: {} -> {}", user.getUserId(), oldStatus, targetStatusCode);
    }

    // [대시보드용] 일별 접속자 수 통계 조회하기
    public List<Map<String, Object>> getDailyVisitStats(int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days - 1);

        // 1. DB 조회 (파라미터로 계산된 startDate 넘기기)
        List<Map<String, Object>> userStats = userRepository.findDailySignupStats(startDate);
        List<Map<String, Object>> logStats = accessLogRepository.findDailyVisitorStats(startDate);

        // 2. 날짜별로 데이터 합치기 (Key: 날짜String, Value: Map)
        Map<String, Map<String, Object>> mergedMap = new TreeMap<>(); // 날짜 정렬을 위해 TreeMap 사용

        // 3. 최근 7일 날짜를 미리 0으로 세팅 (데이터 없는 날도 0으로 나와야 차트가 안 끊김)
        // X축 날짜 생성 (days 만큼 반복)
        for (int i = days - 1; i >= 0; i--) {
            String date = LocalDateTime.now().minusDays(i).toLocalDate().toString();
            Map<String, Object> data = new HashMap<>();
            data.put("date", date);
            data.put("visitors", 0L);
            data.put("users", 0L);
            mergedMap.put(date, data);
        }

        // 4. 방문자 수 채우기
        for (Map<String, Object> stat : logStats) {
            // DB가 "date"로 줄지 "DATE"로 줄지 모르니 둘 다 체크!
            Object dateObj = stat.get("date");
            if (dateObj == null) dateObj = stat.get("DATE"); // 대문자 체크

            Object countObj = stat.get("count");
            if (countObj == null) countObj = stat.get("COUNT"); // 대문자 체크

            String date = String.valueOf(dateObj);
            if (mergedMap.containsKey(date)) {
                mergedMap.get(date).put("visitors", countObj);
            }
        }

        // 5. 가입자 수 채우기 (대소문자 방어 코드 적용)
        for (Map<String, Object> stat : userStats) {
            Object dateObj = stat.get("date");
            if (dateObj == null) dateObj = stat.get("DATE");

            Object countObj = stat.get("count");
            if (countObj == null) countObj = stat.get("COUNT");

            String date = String.valueOf(dateObj);
            if (mergedMap.containsKey(date)) {
                mergedMap.get(date).put("users", countObj);
            }
        }

        return new ArrayList<>(mergedMap.values());
    }

    // [보안 감사 로그 조회 - 페이징 & DTO 변환 적용]
    @Transactional(readOnly = true)
    public Page<AccessLogResponseDTO> getAccessLogs(int page, int size,String type) {
        // 1. 최신순으로 정렬하여 페이지 단위로 가져올 준비
        Pageable pageable = PageRequest.of(page, size, Sort.by("regDt").descending());

        // 2. DB에서 Entity 형태로 페이징 조회
        Page<AccessLog> logPage;
        // ★ type이 ERROR이면 400 이상인 로그만 검색
        if ("ERROR".equals(type)) {
            logPage = accessLogRepository.findByStatusCodeGreaterThanEqual(400, pageable);
        } else {
            logPage = accessLogRepository.findAll(pageable);
        }
        // 3. Page 객체의 map()을 사용하여 내부의 Entity들을 모두 DTO로 포장하기
        return logPage.map(AccessLogResponseDTO :: fromEntity);
    }

    @Transactional(readOnly = true)
    public List<AccessLogResponseDTO> getRecentThreats() {
        // 400번대 이상의 에러 로그 중 최신 5개만 가져오기
        return accessLogRepository.findTop5ByStatusCodeGreaterThanEqualOrderByRegDtDesc(400)
                .stream()
                .map(AccessLogResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }


    public Map<String, Object> getAdminSummary() {
        Map<String, Object> summary = new HashMap<>();

        // 1. 기준 날짜 (오늘/어제) 설정
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        // 2. 전체 회원 데이터 로드 (User)
        List<User> allUsers = userRepository.findAll();
        long totalUsersToday = allUsers.size();

        // 어제까지의 총 회원 수 계산을 위해 '오늘 가입자' 필터링
        long newUsersToday = allUsers.stream()
                .filter(u -> u.getJoinDt() != null && u.getJoinDt().toLocalDate().isEqual(today))
                .count();
        long newUsersYesterday = allUsers.stream()
                .filter(u -> u.getJoinDt() != null && u.getJoinDt().toLocalDate().isEqual(yesterday))
                .count();

        // 총 회원 수 증감률 (전체 인원 대비 오늘 가입 비중)
        long totalUsersYesterday = totalUsersToday - newUsersToday;
        summary.put("totalUsers", totalUsersToday);
        summary.put("totalUsersGrowth", calculateGrowth(totalUsersToday, totalUsersYesterday));

        // 신규 가입자 증감률 (오늘 가입 vs 어제 가입)
        summary.put("newUsersToday", newUsersToday);
        summary.put("newUsersGrowth", calculateGrowth(newUsersToday, newUsersYesterday));

        // 3. 로그 데이터 로드 (AccessLog)
        List<AccessLog> allLogs = accessLogRepository.findAll();

        // 접속자 수 (오늘 vs 어제)
        long visitorsToday = allLogs.stream()
                .filter(l -> l.getRegDt() != null && l.getRegDt().toLocalDate().isEqual(today))
                .count();
        long visitorsYesterday = allLogs.stream()
                .filter(l -> l.getRegDt() != null && l.getRegDt().toLocalDate().isEqual(yesterday))
                .count();
        summary.put("todayVisitors", visitorsToday);
        summary.put("visitorsGrowth", calculateGrowth(visitorsToday, visitorsYesterday));

        // 보안 위협 (오늘 4xx/5xx 에러 vs 어제)
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

        // 승인 대기 (이건 단순 숫자만)
        summary.put("pendingLawyers", allUsers.stream().filter(u -> "S02".equals(u.getStatusCode())).count());

        return summary;
    }

    // 증감률 계산 보조 메서드
    private String calculateGrowth(long current, long previous) {
        if (previous == 0) return current > 0 ? "+100%" : "0%";
        double growth = ((double) (current - previous) / previous) * 100;
        return String.format("%s%.1f%%", growth >= 0 ? "+" : "", growth);
    }

    // 시스템 감사 로그 검색 및 페이징 처리
    @Transactional(readOnly = true)
    public Page<AccessLogResponseDTO> searchAccessLogs(int page,
                                                       int size,
                                                       String startDate,
                                                       String endDate,
                                                       String keywordType,
                                                       String keyword,
                                                       String statusType) {

        // 1. 페이징 설정
        Pageable pageable = PageRequest.of(page, size);

        // 2. 검색 조건 설정
        Specification<AccessLog> spec = AccessLogSpecification.searchLog(startDate, endDate, keywordType, keyword, statusType);

        // 3. 레퍼지토리 조회 및 DTO 변환
        return accessLogRepository.findAll(spec, pageable)
                .map(AccessLogResponseDTO::fromEntity);

    }


}

