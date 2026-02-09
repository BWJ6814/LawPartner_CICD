package com.example.backend_main.BWJ;


import com.example.backend_main.dto.Board;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class BoardController {

    private final BoardRepository boardRepository;

    // 1. 글 등록
    @PostMapping
    public String createBoard(@RequestBody Map<String, Object> data) {
        // 프론트에서 넘어온 categories 배열을 콤마 문자열로 변환 (예: ["부동산","임대차"] -> "부동산,임대차")
        List<String> cats = (List<String>) data.get("categories");
        String categoryString = String.join(",", cats);

        Board board = Board.builder()
                .title((String) data.get("title"))
                .content((String) data.get("content"))
                .categoryCode(categoryString)
                .writerNo(1L) // ★ 중요: 로그인 기능 없으므로 1번 사용자로 고정
                .build();

        boardRepository.save(board);
        return "SUCCESS";
    }

    // 2. 글 목록 조회
    @GetMapping
    public List<Board> getBoardList() {
        return boardRepository.findAllByOrderByRegDtDesc();
    }
}