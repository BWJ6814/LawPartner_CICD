package com.example.backend_main.KY.dto;

import lombok.Data;

import java.util.List;

/*
 [LawyerDashboardDTO]
 변호사 대시보드 API 응답용 DTO
*/
@Data
public class LawyerDashboardDTO {

    // ========== 후기 관련 ==========

    @Data
    public static class ReviewDTO {
        private Long reviewNo;
        private String writerNm;   // 작성자 이름
        private Integer stars;      // 별점
        private String content;     // 후기 내용
        private String category;    // 카테고리
        private String regDate;     // 등록일 (yyyy-MM-dd)
    }

    // ========== 상담 관련 ==========

    @Data
    public static class ConsultationDTO {
        private Long consultNo;
        private String clientNm;    // 의뢰인 이름
        private String category;    // 카테고리
        private String statusCode;  // 상태코드 (C01:대기, C02:상담중, C03:소송진행중, C04:완료)
        private String statusLabel; // 상태 표시 (대기, 상담중, 소송 진행중, 완료)
        private String regDate;     // 접수일 (yyyy-MM-dd)
    }
}
