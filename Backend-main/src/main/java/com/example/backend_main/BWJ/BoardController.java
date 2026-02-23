package com.example.backend_main.BWJ;

import com.example.backend_main.dto.Board;
import com.example.backend_main.dto.BoardReply;
import com.example.backend_main.dto.BoardFile;
import com.example.backend_main.common.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriUtils;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.charset.StandardCharsets;
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

        try { // 파일 저장 중 에러가 날 수 있으니 try-catch로 감싸줍니다.

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

            boardRepository.save(board);
            Long generatedBoardNo = board.getBoardNo();

            // 파일 처리 로직 시작
            if (files != null && !files.isEmpty()) {
                String projectPath = System.getProperty("user.dir");
                String directoryPath = projectPath + "\\src\\main\\resources\\static\\files";

                File directory = new File(directoryPath);
                if (!directory.exists()) directory.mkdirs();

                for (MultipartFile file : files) {
                    if (file.isEmpty()) continue;

                    String originalFileName = file.getOriginalFilename();

                    // [핵심] 중복되지 않는 파일명 찾기 (예: 중복되면 "파일명(1).ext" 형식으로 생성)
                    File destFile = new File(directoryPath, originalFileName);
                    String finalFileName = originalFileName;

                    // 만약 파일이 이미 존재한다면?
                    if (destFile.exists()) {
                        // 파일명과 확장자 분리 (예: test.txt -> test / .txt)
                        int dotIndex = originalFileName.lastIndexOf(".");
                        String baseName = (dotIndex == -1) ? originalFileName : originalFileName.substring(0, dotIndex);
                        String extension = (dotIndex == -1) ? "" : originalFileName.substring(dotIndex);

                        int count = 1;
                        // 파일이 존재하지 않을 때까지 숫자 (1), (2)... 를 붙여봅니다.
                        while (destFile.exists()) {
                            finalFileName = baseName + "(" + count + ")" + extension;
                            destFile = new File(directoryPath, finalFileName);
                            count++;
                        }
                    }

                    // 1. [실제 저장] 결정된 최종 파일명으로 저장합니다.
                    file.transferTo(destFile);

                    // 2. [DB 저장] DB에는 실제 저장된 물리적인 경로를 넣어야 다운로드가 됩니다.
                    BoardFile boardFile = BoardFile.builder()
                            .boardNo(generatedBoardNo)
                            .originName(originalFileName) // 사용자가 올린 원래 이름
                            .saveName(finalFileName)      // 실제로 저장된 중복 방지된 이름
                            .filePath(destFile.getAbsolutePath()) // 👈 이 절대 경로가 중요해요!
                            .build();
                    boardFileRepository.save(boardFile);
                }
            }
            return "SUCCESS";
        } catch (IOException e) {
            e.printStackTrace();
            return "FAIL";
        }
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

    // [추가할 코드] 파일 다운로드 API
    @GetMapping("/download/{fileNo}")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long fileNo) throws MalformedURLException {
        // 1. 다운로드할 파일을 DB에서 찾아옵니다.
        BoardFile fileEntity = boardFileRepository.findById(fileNo).orElse(null);

        if (fileEntity == null) {
            return ResponseEntity.notFound().build(); // 파일이 없으면 404 에러 반환
        }

        // 2. 실제 파일이 저장된 경로를 가져옵니다. (createBoard에서 저장한 경로와 같아야 합니다)
        // 주의: 저장할 때 사용한 경로 설정과 일치해야 파일을 찾을 수 있습니다.
        String savePath = fileEntity.getFilePath();

        // 3. 파일 리소스(실제 파일 데이터)를 생성합니다.
        UrlResource resource = new UrlResource("file:" + savePath);

        // 4. 다운로드 시 파일 이름이 깨지지 않도록 인코딩합니다.
        String encodedUploadFileName = UriUtils.encode(fileEntity.getOriginName(), StandardCharsets.UTF_8);
        String contentDisposition = "attachment; filename=\"" + encodedUploadFileName + "\"";

        // 5. 브라우저에게 파일을 반환합니다.
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                .body(resource);
    }

    // [9] 답변 수정 (추가됨)
    @PutMapping("/replies/{replyId}")
    public String updateReply(@PathVariable Long replyId, @RequestBody Map<String, Object> data) {
        BoardReply reply = boardReplyRepository.findById(replyId)
                .orElseThrow(() -> new RuntimeException("답변을 찾을 수 없습니다."));

        String content = (String) data.get("content");
        reply.setContent(content);
        boardReplyRepository.save(reply);
        return "SUCCESS";
    }

    // [10] 답변 삭제 (추가됨)
    @DeleteMapping("/replies/{replyId}")
    @Transactional // 삭제 시 관련된 데이터 처리를 안전하게 하기 위해 추가
    public String deleteReply(@PathVariable Long replyId) {
        BoardReply reply = boardReplyRepository.findById(replyId)
                .orElseThrow(() -> new RuntimeException("답변을 찾을 수 없습니다."));

        // 게시글의 댓글 수(replyCnt)를 1 줄여줍니다.
        Board board = boardRepository.findById(reply.getBoardNo()).orElseThrow();
        if (board.getReplyCnt() > 0) {
            board.setReplyCnt(board.getReplyCnt() - 1);
            boardRepository.save(board);
        }

        boardReplyRepository.delete(reply);
        return "SUCCESS";
    }
}