package com.example.backend_main.KimMinSu;

import com.example.backend_main.common.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; // ★ 추가
import org.springframework.data.repository.query.Param; // ★ 추가
import java.util.List;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {
    // 캘린더에 뿌릴 '내 일정'을 전부 가져오는 명령어
    // [수정] 메서드 이름(findByUserNo)과 파라미터 개수(3개)가 맞지 않아 에러가 발생했었습니다.
    // @Query를 사용하여 start와 end가 startDate 조회에 쓰인다는 것을 명시해줍니다.
    // 오류가 나서 명시적으로 @Param을 사용했습니다아아~ - 추후에 사용하실 때, 이걸 원상복구 하셔도 무관합니당!
    @Query("SELECT c FROM CalendarEvent c WHERE c.userNo = :userNo AND c.startDate BETWEEN :start AND :end")
    List<CalendarEvent> findByUserNo(@Param("userNo") Long userNo, @Param("start") String start, @Param("end") String end);

    List<CalendarEvent> findByUserNoAndStartDateBetween(Long userNo, String start, String end);
}