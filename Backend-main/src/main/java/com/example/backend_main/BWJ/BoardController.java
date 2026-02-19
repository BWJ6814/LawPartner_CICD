package com.example.backend_main.BWJ;

import com.example.backend_main.dto.Board;
import com.example.backend_main.dto.BoardReply;
import com.example.backend_main.common.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class BoardController {

    private final BoardRepository boardRepository;
    private final BoardReplyRepository boardReplyRepository;
    private final UserRepository userRepository;

    @PostMapping
    public String createBoard(@RequestBody Map<String, Object> data) {
        List<String> cats = (List<String>) data.get("categories");
        String categoryString = String.join(",", cats);
        Long userNo = Long.parseLong(data.get("userNo").toString());

        Boolean isVisible = (Boolean) data.get("isNicknameVisible");
        String nicknameVisibleYn = (isVisible != null && isVisible) ? "Y" : "N";

        Board board = Board.builder()
                .title((String) data.get("title"))
                .content((String) data.get("content"))
                .categoryCode(categoryString)
                .writerNo(userNo)
                .replyCnt(0)
                .matchYn("N")
                .nicknameVisibleYn(nicknameVisibleYn)
                .build();

        boardRepository.save(board);
        return "SUCCESS";
    }

    @GetMapping
    public List<Board> getBoardList() {
        List<Board> boards = boardRepository.findAllByOrderByRegDtDesc();
        for (Board board : boards) {
            userRepository.findById(board.getWriterNo()).ifPresent(user -> board.setNickNm(user.getNickNm()));
            if (board.getReplyCnt() == null) board.setReplyCnt(0);
        }
        return boards;
    }

    @GetMapping("/{id}")
    public Map<String, Object> getBoardDetail(@PathVariable("id") Long id) {
        Board board = boardRepository.findById(id).orElseThrow();

        Map<String, Object> result = new HashMap<>();
        result.put("boardNo", board.getBoardNo());
        result.put("title", board.getTitle());
        result.put("content", board.getContent());
        result.put("categoryCode", board.getCategoryCode());
        result.put("writerNo", board.getWriterNo());
        result.put("regDt", board.getRegDt());
        result.put("matchYn", board.getMatchYn());

        if ("Y".equals(board.getNicknameVisibleYn())) {
            userRepository.findById(board.getWriterNo()).ifPresent(u -> result.put("nickNm", u.getNickNm()));
        } else {
            result.put("nickNm", "익명 질문자");
        }

        List<BoardReply> replies = boardReplyRepository.findByBoardNo(id);
        List<Map<String, Object>> replyList = replies.stream().map(reply -> {
            Map<String, Object> map = new HashMap<>();
            map.put("replyNo", reply.getReplyNo());
            map.put("content", reply.getContent());
            map.put("regDt", reply.getRegDt());
            map.put("lawyerNo", reply.getWriterNo());

            userRepository.findById(reply.getWriterNo()).ifPresent(lawyer -> {
                map.put("lawyerNm", lawyer.getNickNm());
            });
            return map;
        }).collect(Collectors.toList());

        result.put("replies", replyList);

        return result;
    }

    @PostMapping("/{id}/replies")
    public String createReply(@PathVariable("id") Long boardId, @RequestBody Map<String, Object> data) {
        Board board = boardRepository.findById(boardId).orElseThrow();
        if ("Y".equals(board.getMatchYn())) return "FAIL";

        Long lawyerNo = Long.parseLong(data.get("lawyerNo").toString());

        BoardReply reply = BoardReply.builder()
                .boardNo(boardId)
                .writerNo(lawyerNo)
                .content((String) data.get("content"))
                .selectionYn("N")
                .build();
        boardReplyRepository.save(reply);

        board.setReplyCnt((board.getReplyCnt() == null ? 0 : board.getReplyCnt()) + 1);
        boardRepository.save(board);

        return "SUCCESS";
    }

    // [수정됨] 카테고리 제거 및 REPLY_NO 처리
    @PostMapping("/{id}/reviews")
    public String createReview(@PathVariable("id") Long boardId, @RequestBody Map<String, Object> data) {
        Long lawyerNo = Long.parseLong(data.get("lawyerNo").toString());
        Long writerNo = Long.parseLong(data.get("writerNo").toString());
        String writerNm = (String) data.get("writerNm");
        Integer stars = Integer.parseInt(data.get("stars").toString());
        String content = (String) data.get("content");
        Long replyNo = Long.parseLong(data.get("replyNo").toString()); // 프론트에서 넘어온 답변 번호

        // DB에 저장!
        boardRepository.insertReviewNative(lawyerNo, writerNo, writerNm, stars, content, replyNo);
        return "SUCCESS";
    }

    @PutMapping("/{id}/match")
    public String completeMatch(@PathVariable("id") Long id) {
        Board board = boardRepository.findById(id).orElseThrow();
        board.setMatchYn("Y");
        boardRepository.save(board);
        return "SUCCESS";
    }

    @PutMapping("/{id}")
    public String updateBoard(@PathVariable("id") Long id, @RequestBody Map<String, Object> data) {
        Board board = boardRepository.findById(id).orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        board.setTitle((String) data.get("title"));
        board.setContent((String) data.get("content"));
        boardRepository.save(board);
        return "SUCCESS";
    }

    @DeleteMapping("/{id}")
    @Transactional
    public String deleteBoard(@PathVariable("id") Long id) {
        List<BoardReply> replies = boardReplyRepository.findByBoardNo(id);
        if (!replies.isEmpty()) {
            boardReplyRepository.deleteAll(replies);
        }
        boardRepository.deleteById(id);
        return "SUCCESS";
    }
}