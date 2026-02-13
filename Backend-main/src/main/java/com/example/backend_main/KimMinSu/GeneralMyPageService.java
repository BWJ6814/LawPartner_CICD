package com.example.backend_main.KimMinSu;

import com.example.backend_main.common.Mapper.GeneralMyPageMapper;
import com.example.backend_main.dto.GeneralMyPageDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor // final 필드 생성자 주입
public class GeneralMyPageService {

    private final GeneralMyPageMapper myPageMapper; // 매퍼 주입

    public GeneralMyPageDTO getDashboardData(Long userNo) {
        // 1. 빈 DTO 생성
        GeneralMyPageDTO dto = new GeneralMyPageDTO();

        // 2. DB에서 유저 이름 조회
        String userName = myPageMapper.getUserName(userNo);
        dto.setUserName(userName != null ? userName : "알 수 없음");

        // 3. 통계 데이터 조회
        dto.setRecentReplyCount(myPageMapper.getRecentReplyCount(userNo));
        dto.setRequestCount(myPageMapper.getRequestCount(userNo));

        // *남은 일수는 로직이 복잡하므로 일단 DB에서 캘린더 이벤트를 가져와서 Java에서 계산하거나 0으로 설정
        dto.setDaysLeft(0);

        // 4. 최근 상담 리스트 조회
        List<GeneralMyPageDTO.ConsultationItemDTO> consultList = myPageMapper.getRecentConsultations(userNo);
        dto.setRecentConsultations(consultList);

        // 5. 최근 게시글 조회
        List<GeneralMyPageDTO.MyBoardDTO> postList = myPageMapper.getRecentPosts(userNo);
        dto.setRecentPosts(postList);

        // 6. 캘린더 일정 조회
        List<GeneralMyPageDTO.CalendarEventDTO> eventList = myPageMapper.getCalendarEvents(userNo);
        dto.setCalendarEvents(eventList);

        return dto;
    }
}