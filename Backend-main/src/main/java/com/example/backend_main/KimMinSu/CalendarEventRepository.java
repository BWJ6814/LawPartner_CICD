package com.example.backend_main.KimMinSu;

import com.example.backend_main.common.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {
    // 캘린더에 뿌릴 '내 일정'을 전부 가져오는 명령어
    List<CalendarEvent> findByUserNo(Long userNo);
}