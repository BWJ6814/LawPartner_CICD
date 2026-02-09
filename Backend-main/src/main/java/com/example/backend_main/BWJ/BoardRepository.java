package com.example.backend_main.BWJ;

import com.example.backend_main.dto.Board;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BoardRepository extends JpaRepository<Board, Long> {
    // 최신순 정렬해서 가져오기
    List<Board> findAllByOrderByRegDtDesc();
}