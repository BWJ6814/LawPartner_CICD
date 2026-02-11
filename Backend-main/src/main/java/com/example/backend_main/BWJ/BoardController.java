package com.example.backend_main.BWJ;

// Entity 관련 Import (패키지 경로 확인 필요)

// DTO 관련 Import
import com.example.backend_main.dto.Board;
import com.example.backend_main.dto.BoardDetailDto;

// Repository 관련 Import

import com.example.backend_main.dto.BoardReply;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

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

        Board board = Board.builder()
                .title((String) data.get("title"))
                .content((String) data.get("content"))
                .categoryCode(categoryString)
                .writerNo(1L) // 로그인 기능 없으므로 1번 사용자로 고정
                .build();

        boardRepository.save(board);
        return "SUCCESS";
    }

    // 2. 글 목록 조회 (기존 코드 유지)
    @GetMapping
    public List<Board> getBoardList() {
        return boardRepository.findAllByOrderByRegDtDesc();
    }

    // ==========================================
    // ▼ [새로 추가된 기능] 상세 조회 & 답변 등록
    // ==========================================

    // 3. 게시글 상세 조회 (+ 댓글 목록 포함)
    @GetMapping("/{id}")
    public BoardDetailDto getBoardDetail(@PathVariable Long id) {
        // (1) 게시글 찾기 (없으면 에러)
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("게시글이 존재하지 않습니다. id=" + id));

        // (2) 해당 글의 댓글(답변) 목록 찾기
        List<BoardReply> replies = boardReplyRepository.findAllByBoardNoOrderByRegDtAsc(id);

        // (3) Entity -> DTO 변환 (화면에 뿌려줄 형태로 가공)
        return BoardDetailDto.builder()
                .id(board.getBoardNo())
                .category(board.getCategoryCode())
                .title(board.getTitle())
                .content(board.getContent())
                .writerId(board.getWriterNo())
                // 닉네임은 DB 조인 대신 임시로 "사용자+번호"로 표시
                .writerName("사용자" + board.getWriterNo())
                // 날짜 포맷 (YYYY-MM-DD)
                .date(board.getRegDt().toString().substring(0, 10))
                // 댓글 리스트 변환
                .replies(replies.stream().map(r -> BoardDetailDto.ReplyDto.builder()
                        .replyId(r.getReplyNo())
                        .content(r.getContent())
                        .lawyerId(r.getWriterNo())
                        .lawyerName("변호사" + r.getWriterNo()) // 임시 변호사 이름
                        .selectionYn(r.getSelectionYn())
                        .date(r.getRegDt().toString().substring(0, 16)) // YYYY-MM-DD HH:mm 까지 자름
                        .build()).collect(Collectors.toList()))
                .build();
    }

    // 4. 답변(댓글) 등록 - 변호사 전용
    @PostMapping("/{id}/replies")
    public String createReply(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        BoardReply reply = BoardReply.builder()
                .boardNo(id)
                .content((String) data.get("content"))
                // ★ 중요: 현재 로그인한 변호사 ID를 넣어야 함 (테스트용으로 3번 고정)
                .writerNo(3L)
                .build();

        boardReplyRepository.save(reply);
        return "SUCCESS";
    }
}