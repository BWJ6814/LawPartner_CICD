package com.example.backend_main.dto.HSH_DTO;

import com.example.backend_main.dto.Board;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 관리자 게시글 목록(검색·페이징) 응답
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminBoardListResponse {
    private List<Board> content;
    private long totalElements;
    private int totalPages;
    private int page;
    private int size;
}
