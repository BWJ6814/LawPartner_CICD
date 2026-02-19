
package com.example.backend_main.HSH.service;

import com.example.backend_main.common.entity.AccessLog;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.repository.AccessLogRepository;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.common.util.Aes256Util;
import com.example.backend_main.common.util.HashUtil; // 해시 유틸
import com.example.backend_main.dto.UserJoinRequestDTO;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*; // Excel 관련
import org.apache.poi.xssf.streaming.SXSSFWorkbook; // 대용량 Excel
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // 트랜잭션

import java.io.IOException;
import java.util.List;
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
        // .stream() : 글겅온 데이터 뭉치를 한 명씩 차례대로 처리할 수 있는 [흐름] 상태로 만들기
        return userRepository.findAll().stream()
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
                        log.error("복호화 오류 발생: User.No {}",user.getUserNo());
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

        // 2. 상태 변경 (Setter 사용)
        user.setStatusCode(targetStatusCode);

        // 3. [비즈니스 로직] 승인(S02) 처리 시 권한 승격
        // 기존 권한이 ROLE_USER인 경우에만 ROLE_LAWYER로 올려줌..(이미 관리잠녀 건드리지 않음)
        if ("S02".equals(targetStatusCode) && "ROLE_USER".equals(user.getRoleCode())) {
            user.setRoleCode("ROLE_LAWYER");
            log.info("🎉 회원[{}]의 권한이 변호사(ROLE_LAWYER)로 승격되었습니다.", user.getUserId());
        }

        // JPA의 Dirty Checking으로 인해 save를 호출하지 않아도 트랜잭션 종료 시 자동 업데이트되지만,
        // 명시적으로 작성하는 것이 가독성에 좋습니다.
        userRepository.save(user);

        log.info("🔧 회원[{}] 상태 변경 완료: {} -> {}", user.getUserId(), user.getStatusCode(), targetStatusCode);
    }

}

