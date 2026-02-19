package com.example.backend_main.BWJ;

import com.example.backend_main.dto.Board;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface BoardRepository extends JpaRepository<Board, Long> {

    // 1. 전체 목록 최신순
    List<Board> findAllByOrderByRegDtDesc();

    // 2. [복구됨] 특정 작성자의 최신글 5개
    List<Board> findTop5ByWriterNoOrderByRegDtDesc(Long writerNo);

    // 3. 실제 TB_REVIEW 테이블 컬럼에 맞춘 Native Query (후기 등록용)
    @Modifying
    @Transactional
    @Query(value = "INSERT INTO TB_REVIEW (LAWYER_NO, WRITER_NO, WRITER_NM, STARS, CONTENT, CATEGORY, REG_DT) " +
            "VALUES (:lawyerNo, :writerNo, :writerNm, :stars, :content, :category, SYSDATE)", nativeQuery = true)
    void insertReviewNative(
            @Param("lawyerNo") Long lawyerNo,
            @Param("writerNo") Long writerNo,
            @Param("writerNm") String writerNm,
            @Param("stars") Integer stars,
            @Param("content") String content,
            @Param("category") String category);
}