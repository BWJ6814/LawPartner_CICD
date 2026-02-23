package com.example.backend_main.BWJ;

import com.example.backend_main.dto.Board;
import com.example.backend_main.dto.BoardReply;
import com.example.backend_main.dto.BoardFile;
import com.example.backend_main.common.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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
    private final BoardFileRepository boardFileRepository;

    // [1] 게시글 등록 (파일 업로드 포함)
    @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public String createBoard(
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam("categories") String categoryString,
            @RequestParam("userNo") Long userNo,
            @RequestParam("isNicknameVisible") Boolean isVisible,
            @RequestParam(value = "files", required = false) List<MultipartFile> files) {

        // 닉네임 공개 여부 처리
        String nicknameVisibleYn = (isVisible != null && isVisible) ? "Y" : "N";

        // 게시글 객체 생성 및 저장
        Board board = Board.builder()
                .title(title)
                .content(content)
                .categoryCode(categoryString)
                .writerNo(userNo)
                .replyCnt(0)
                .matchYn("N")
                .nicknameVisibleYn(nicknameVisibleYn)
                .build();

        boardRepository.save(board); // DB 저장 (ID 자동 생성)
        Long generatedBoardNo = board.getBoardNo();

        // 파일 정보 DB 저장
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                BoardFile boardFile = BoardFile.builder()
                        .boardNo(generatedBoardNo)
                        .originName(file.getOriginalFilename())
                        .saveName(file.getOriginalFilename()) // 실제 운영 시 UUID 권장
                        .build();
                boardFileRepository.save(boardFile);
            }
        }

        return "SUCCESS";
    }

    // [2] 게시글 목록 조회
    @GetMapping
    public List<Board> getBoardList() {
        List<Board> boards = boardRepository.findAllByOrderByRegDtDesc();
        for (Board board : boards) {
            userRepository.findById(board.getWriterNo()).ifPresent(user -> board.setNickNm(user.getNickNm()));
            if (board.getReplyCnt() == null) board.setReplyCnt(0);
        }
        return boards;
    }

    // [3] 게시글 상세 조회 (댓글 및 파일 목록 포함)
    @GetMapping("/{id}")
    public Map<String, Object> getBoardDetail(@PathVariable("id") Long id) {
        Board board = boardRepository.findById(id).orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        Map<String, Object> result = new HashMap<>();
        result.put("boardNo", board.getBoardNo());
        result.put("title", board.getTitle());
        result.put("content", board.getContent());
        result.put("categoryCode", board.getCategoryCode());
        result.put("writerNo", board.getWriterNo());
        result.put("regDt", board.getRegDt());
        result.put("matchYn", board.getMatchYn());

        // 작성자 닉네임 처리
        if ("Y".equals(board.getNicknameVisibleYn())) {
            userRepository.findById(board.getWriterNo()).ifPresent(u -> result.put("nickNm", u.getNickNm()));
        } else {
            result.put("nickNm", "익명 질문자");
        }

        // 첨부 파일 목록 가져오기
        List<BoardFile> boardFiles = boardFileRepository.findByBoardNo(id);
        result.put("files", boardFiles);

        // 답변(댓글) 목록 처리
        List<BoardReply> replies = boardReplyRepository.findByBoardNo(id);
        List<Map<String, Object>> replyList = replies.stream().map(reply -> {
            Map<String, Object> map = new HashMap<>();
            map.put("replyNo", reply.getReplyNo());
            map.put("content", reply.getContent());
            map.put("regDt", reply.getRegDt());
            map.put("lawyerNo", reply.getWriterNo());
            userRepository.findById(reply.getWriterNo()).ifPresent(lawyer -> map.put("lawyerNm", lawyer.getNickNm()));
            return map;
        }).collect(Collectors.toList());

        result.put("replies", replyList);
        return result;
    }

    // [4] 답변 등록
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

    // [5] 리뷰 등록
    @PostMapping("/{id}/reviews")
    public String createReview(@PathVariable("id") Long boardId, @RequestBody Map<String, Object> data) {
        Long lawyerNo = Long.parseLong(data.get("lawyerNo").toString());
        Long writerNo = Long.parseLong(data.get("writerNo").toString());
        String writerNm = (String) data.get("writerNm");
        Integer stars = Integer.parseInt(data.get("stars").toString());
        String content = (String) data.get("content");
        Long replyNo = Long.parseLong(data.get("replyNo").toString());

        boardRepository.insertReviewNative(lawyerNo, writerNo, writerNm, stars, content, replyNo);
        return "SUCCESS";
    }

    // [6] 매칭 완료
    @PutMapping("/{id}/match")
    public String completeMatch(@PathVariable("id") Long id) {
        Board board = boardRepository.findById(id).orElseThrow();
        board.setMatchYn("Y");
        boardRepository.save(board);
        return "SUCCESS";
    }

    // [7] 게시글 수정
    @PutMapping("/{id}")
    public String updateBoard(@PathVariable("id") Long id, @RequestBody Map<String, Object> data) {
        Board board = boardRepository.findById(id).orElseThrow();
        board.setTitle((String) data.get("title"));
        board.setContent((String) data.get("content"));
        boardRepository.save(board);
        return "SUCCESS";
    }

    // [8] 게시글 삭제
    @DeleteMapping("/{id}")
    @Transactional
    public String deleteBoard(@PathVariable("id") Long id) {
        List<BoardReply> replies = boardReplyRepository.findByBoardNo(id);
        if (!replies.isEmpty()) boardReplyRepository.deleteAll(replies);
        boardRepository.deleteById(id);
        return "SUCCESS";
    }
}