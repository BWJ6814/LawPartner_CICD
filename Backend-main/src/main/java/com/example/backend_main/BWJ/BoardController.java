package com.example.backend_main.BWJ;

// Entity 관련 Import (패키지 경로 확인 필요)

// DTO 관련 Import
import com.example.backend_main.dto.Board;
import com.example.backend_main.dto.BoardDetailDto;

// Repository 관련 Import

import com.example.backend_main.dto.BoardReply;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000") // 리액트 포트 허용
public class BoardController {

    private final BoardRepository boardRepository;
    private final BoardReplyRepository boardReplyRepository; // [추가] 댓글 처리를 위해 주입

    // 1. 글 등록 (기존 코드 유지)
    @PostMapping
    public String createBoard(@RequestBody Map<String, Object> data) {
        // 프론트에서 넘어온 categories 배열을 콤마 문자열로 변환
        List<String> cats = (List<String>) data.get("categories");
        String categoryString = String.join(",", cats);
        Long userNo = Long.parseLong(data.get("userNo").toString());

        Board board = Board.builder()
                .title((String) data.get("title"))
                .content((String) data.get("content"))
                .categoryCode(categoryString)
                .writerNo(userNo)
                .build();

        boardRepository.save(board);
        return "SUCCESS";
    }

    // 2. 글 목록 조회 (기존 코드 유지)
    @GetMapping
    public List<Board> getBoardList() {
        return boardRepository.findAllByOrderByRegDtDesc();
    }


    // BoardController.java에 추가

    // 3. 글 상세보기 (게시글 정보 + 답변 리스트)
    @GetMapping("/{id}")
    public Map<String, Object> getBoardDetail(@PathVariable("id") Long id) {
        // 1. 게시글 본문 가져오기
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        // 2. 해당 게시글의 답변(Reply) 리스트 가져오기 (Repository에 별도 생성 필요)
        // List<BoardReply> replies = boardReplyRepository.findByBoardNoOrderByRegDtAsc(id);

        // 3. 결과 합치기 (실무에서는 DTO를 쓰지만 이해를 돕기 위해 Map 사용)
        Map<String, Object> result = new HashMap<>();
        result.put("boardNo", board.getBoardNo());
        result.put("title", board.getTitle());
        result.put("content", board.getContent());
        result.put("categoryCode", board.getCategoryCode());
        result.put("writerNo", board.getWriterNo());
        result.put("regDt", board.getRegDt());

        // 임시 데이터 (답변 리포지토리 연결 전 확인용)
        // result.put("replies", replies);

        return result;
    }

    // 4. 답변 등록 API
    @PostMapping("/{id}/replies")
    public String createReply(@PathVariable("id") Long boardId, @RequestBody Map<String, Object> data) {
        // 답변 저장 로직 (BoardReply 엔티티 필요)
        return "SUCCESS";
    }

}