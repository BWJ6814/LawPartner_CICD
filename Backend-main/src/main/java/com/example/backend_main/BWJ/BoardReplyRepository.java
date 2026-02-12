package com.example.backend_main.BWJ;

import com.example.backend_main.dto.BoardReply;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BoardReplyRepository extends JpaRepository<BoardReply, Long> {
    // 특정 게시글의 댓글 목록 조회 (작성일순)
    List<BoardReply> findAllByBoardNoOrderByRegDtAsc(Long boardNo);
}