package com.example.backend_main.dto;

import lombok.Data;

import java.util.List;

@Data
public class GeneralMyPageDTO {

    // 1. 사용자 정보
    private String userName;

    // 2. 통계 (상단 카드)
    private int recentReplyCount;
    private int requestCount;
    private Integer daysLeft;

    // 3. 최근 상담 요청 현황 (테이블)
    private List<ConsultationItemDTO> recentConsultations;

    // 4. 최근 내 게시글
    private List<MyBoardDTO> recentPosts;

    // 5. 캘린더 일정
    private List<CalendarEventDTO> calendarEvents;

    @Data
    public static class ConsultationItemDTO {
        private String lawyerName;     // 상담자(변호사) 이름
        private String category;       // 카테고리 (교통사고 등)
        private String status;         // 진행 상태
        private String regDate;        // 접수 날짜 (YYYY-MM-DD)
    }

    @Data
    public static class MyBoardDTO {
        private Long boardNo;
        private String title;
        private String regDate;
        private int replyCount;
    }

    @Data
    public static class CalendarEventDTO {
        private String title;
        private String date;  // YYYY-MM-DD
        private String color; // 색상 코드
    }


}

