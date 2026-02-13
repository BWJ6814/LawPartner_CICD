package com.example.backend_main.KimMinSu;

import com.example.backend_main.BWJ.BoardRepository;
import com.example.backend_main.common.entity.CalendarEvent;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.dto.Board;
import com.example.backend_main.dto.GeneralMyPageDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor // ★ DB 관리자들을 데려오기 위해 필수!
public class GeneralMyPageService {

    private final UserRepository userRepository;
    private final BoardRepository boardRepository;

    // ★ 방금 만든 캘린더 관리자 추가!
    private final CalendarEventRepository calendarEventRepository;

    public GeneralMyPageDTO getDashboardData(Long userNo) {
        GeneralMyPageDTO dto = new GeneralMyPageDTO();

        // 1. [DB 연동] 유저 이름 가져오기
        User user = userRepository.findById(userNo)
                .orElseThrow(() -> new RuntimeException("해당 유저를 찾을 수 없습니다."));
        dto.setUserName(user.getUserNm());

        // 2. 통계 카드 (아직 관련 테이블이 미완성이면 일단 0으로 세팅)
        dto.setRecentReplyCount(0);
        dto.setRequestCount(0);
        dto.setDaysLeft(null);

        // 3. 최근 상담 (추후 상담 테이블 만들어지면 연동, 지금은 빈 배열)
        dto.setRecentConsultations(new ArrayList<>());

        // 4. [DB 연동] 최근 내 게시판 목록 가져오기 (방금 1단계에서 만든 명령어 사용)
        List<Board> myBoards = boardRepository.findTop5ByWriterNoOrderByRegDtDesc(userNo);

        List<GeneralMyPageDTO.MyBoardDTO> postList = myBoards.stream().map(board -> {
            GeneralMyPageDTO.MyBoardDTO postDTO = new GeneralMyPageDTO.MyBoardDTO();
            postDTO.setBoardNo(board.getBoardNo());
            postDTO.setTitle(board.getTitle());
            // 날짜 형식 예쁘게 변환
            if(board.getRegDt() != null) {
                postDTO.setRegDate(board.getRegDt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
            }
            postDTO.setReplyCount(0); // 추후 답글 개수 연동
            return postDTO;
        }).collect(Collectors.toList());

        dto.setRecentPosts(postList);

        // 5. 캘린더 일정 (추후 연동, 일단 빈 배열)
        List<CalendarEvent> myEvents = calendarEventRepository.findByUserNo(userNo);

        List<GeneralMyPageDTO.CalendarEventDTO> eventList = myEvents.stream().map(event -> {
            GeneralMyPageDTO.CalendarEventDTO calDTO = new GeneralMyPageDTO.CalendarEventDTO();
            calDTO.setTitle(event.getTitle());
            calDTO.setDate(event.getStartDate()); // FullCalendar가 인식하는 'date' 속성
            calDTO.setColor(event.getColorCode());
            return calDTO;
        }).collect(Collectors.toList());

        dto.setCalendarEvents(eventList);

        return dto;
    }
}