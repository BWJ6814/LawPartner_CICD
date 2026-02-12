package com.example.backend_main.KimMinSu;

import com.example.backend_main.dto.GeneralMyPageDTO;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class GeneralMyPageService {

    public GeneralMyPageDTO getDashboardData(Long userNo) {
        // 1. 빈 DTO 생성
        GeneralMyPageDTO dto = new GeneralMyPageDTO();

        // 2. 기본 정보 채우기 (나중엔 DB에서 조회: userRepository.findById(userNo))
        dto.setUserName("김길동"); // 로그인한 유저 이름

        // 3. 통계 카드 채우기
        dto.setRecentReplyCount(5); // 최근 답글
        dto.setRequestCount(1);     // 최근 상담 요청
        dto.setDaysLeft(3);         // 다음 예약까지 남은 일수

        // 4. 최근 상담 요청 현황 (리스트) 만들기
        List<GeneralMyPageDTO.ConsultationItemDTO> consultList = new ArrayList<>();

        GeneralMyPageDTO.ConsultationItemDTO item1 = new GeneralMyPageDTO.ConsultationItemDTO();
        item1.setLawyerName("박신드 변호사");
        item1.setCategory("교통사고");
        item1.setStatus("상담중");
        item1.setRegDate("2026-02-11");
        consultList.add(item1);

        dto.setRecentConsultations(consultList);

        // 5. 최근 내 게시글 (리스트) 만들기
        List<GeneralMyPageDTO.MyBoardDTO> postList = new ArrayList<>();

        GeneralMyPageDTO.MyBoardDTO post1 = new GeneralMyPageDTO.MyBoardDTO();
        post1.setBoardNo(1L);
        post1.setTitle("전세 사기 관련 문의드립니다.");
        post1.setRegDate("2026-02-10");
        post1.setReplyCount(2);
        postList.add(post1);

        dto.setRecentPosts(postList);

        // 6. 캘린더 일정 (리스트) 만들기
        List<GeneralMyPageDTO.CalendarEventDTO> eventList = new ArrayList<>();

        GeneralMyPageDTO.CalendarEventDTO event1 = new GeneralMyPageDTO.CalendarEventDTO();
        event1.setTitle("교통사고 1차 공판");
        event1.setDate("2026-02-15");
        event1.setColor("#3b82f6"); // 파란색
        eventList.add(event1);

        dto.setCalendarEvents(eventList);

        // 7. 꽉 채운 DTO 반환
        return dto;
    }
}
