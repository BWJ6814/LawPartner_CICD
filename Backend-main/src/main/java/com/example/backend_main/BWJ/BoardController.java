package com.example.backend_main.BWJ;

// DTO 관련 Import
import com.example.backend_main.dto.Board;
import com.example.backend_main.dto.BoardDetailDto;
import com.example.backend_main.dto.BoardReply;

// User Repository 관련 Import (경로가 맞는지 확인해 주세요)
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.common.entity.User;

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
    private final BoardReplyRepository boardReplyRepository;

    // [추가됨] 글 작성자의 닉네임을 조회하기 위해 UserRepository 주입
    private final UserRepository userRepository;

    // 1. 글 등록 (닉네임 공개 여부 처리 추가)
    @PostMapping
    public String createBoard(@RequestBody Map<String, Object> data) {
        // 프론트에서 넘어온 categories 배열을 콤마 문자열로 변환
        List<String> cats = (List<String>) data.get("categories");
        String categoryString = String.join(",", cats);
        Long userNo = Long.parseLong(data.get("userNo").toString());

        // [추가됨] 프론트엔드에서 보낸 isNicknameVisible 값을 확인하여 'Y' 또는 'N' 문자열로 변환합니다.
        Boolean isVisible = (Boolean) data.get("isNicknameVisible");
        String nicknameVisibleYn = (isVisible != null && isVisible) ? "Y" : "N";

        Board board = Board.builder()
                .title((String) data.get("title"))
                .content((String) data.get("content"))
                .categoryCode(categoryString)
                .writerNo(userNo)
                .nicknameVisibleYn(nicknameVisibleYn) // 공개여부 데이터 세팅
                .build();

        boardRepository.save(board);
        return "SUCCESS";
    }

    // 2. 글 목록 조회 (작성자 닉네임 세팅 추가)
    @GetMapping
    public List<Board> getBoardList() {
        // 우선 데이터베이스에서 게시글 목록을 최신순으로 가져옵니다.
        List<Board> boards = boardRepository.findAllByOrderByRegDtDesc();

        // [추가됨] 게시글마다 작성자 번호(writerNo)를 이용해 유저 정보를 찾고, Transient 필드에 닉네임을 넣어줍니다.
        for (Board board : boards) {
            userRepository.findById(board.getWriterNo()).ifPresent(user -> {
                // ※ user.getUserNm() 부분이 실제 User 엔티티의 닉네임 Getter 메서드와 동일한지 확인해 주세요!
                board.setUserNickname(user.getUserNm());
            });
        }

        return boards;
    }

    // 3. 글 상세보기 (기존 유지)
    @GetMapping("/{id}")
    public Map<String, Object> getBoardDetail(@PathVariable("id") Long id) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        Map<String, Object> result = new HashMap<>();
        result.put("boardNo", board.getBoardNo());
        result.put("title", board.getTitle());
        result.put("content", board.getContent());
        result.put("categoryCode", board.getCategoryCode());
        result.put("writerNo", board.getWriterNo());
        result.put("regDt", board.getRegDt());

        // 상세보기에서도 닉네임이 필요하다면 아래 코드를 활용하세요!
        // result.put("nicknameVisibleYn", board.getNicknameVisibleYn());
        // userRepository.findById(board.getWriterNo()).ifPresent(user -> result.put("userNickname", user.getUserNm()));

        return result;
    }

    // 4. 답변 등록 API (기존 유지)
    @PostMapping("/{id}/replies")
    public String createReply(@PathVariable("id") Long boardId, @RequestBody Map<String, Object> data) {
        return "SUCCESS";
    }
}