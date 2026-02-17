package com.example.backend_main.HSH.service;

import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.common.util.Aes256Util;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;            // 회원 정보 DB
    private final AccessLogRepository accessLogRepository;  // 로그 정보 DB
    private final Aes256Util aes256Util;                    // PII 전용 암호기
    
    // [화면 조회용] 회왼 목록 조회 API
    // 모든 회원 목록을 가져오는 함수 정의하기
    // List<User> : 여러 명의 유저 정보를 리스트 형태의 묶음으로 반환처리.. - JSON 데이터 반환
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
        SXSSFWorkbook wrokbook = new SXSSFWorkbook(100);

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



}
