package com.example.backend_main.BWJ;

import com.example.backend_main.dto.AiChatLog;
import com.example.backend_main.common.entity.AiChatRoom;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.repository.AiChatRoomRepository;
import com.example.backend_main.common.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = {"http://192.168.0.43:3000", "http://localhost:3000"}) // 리액트 허용
public class AiChatController {

    @Autowired
    private AiChatLogRepository aiChatLogRepository;

    @Autowired
    private AiChatRoomRepository aiChatRoomRepository;

    @Autowired
    private UserRepository userRepository;

    // 파이썬 서버 주소
    private final String PYTHON_SERVER_URL = "http://192.168.0.43:8000/chat";
    private final String PYTHON_SUMMARIZE_URL = "http://192.168.0.43:8000/summarize-consult";

    @PostMapping("/rooms")
    public ResponseEntity<?> createRoom(@RequestBody Map<String, Object> payload) {
        Object userNoObj = payload.get("userNo");
        Long userNo = userNoObj == null ? null : Long.valueOf(String.valueOf(userNoObj));

        User user = null;
        if (userNo != null) {
            user = userRepository.findById(userNo).orElse(null);
        }

        AiChatRoom room = AiChatRoom.builder()
                .user(user)
                .title(null)
                .lastQuestion(null)
                .build();

        AiChatRoom saved = aiChatRoomRepository.save(room);
        Map<String, Object> res = new HashMap<>();
        res.put("roomNo", saved.getRoomNo());
        res.put("title", saved.getTitle());
        return ResponseEntity.ok(res);
    }

    @GetMapping("/rooms")
    public ResponseEntity<?> listRooms(@RequestParam("userNo") Long userNo) {
        List<AiChatRoom> rooms = aiChatRoomRepository.findByUserNoOrderByRecent(userNo);
        List<Map<String, Object>> result = rooms.stream().map(r -> {
            Map<String, Object> m = new HashMap<>();
            m.put("roomNo", r.getRoomNo());
            m.put("title", r.getTitle());
            m.put("lastQuestion", r.getLastQuestion());
            m.put("lastChatDt", r.getLastChatDt());
            return m;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/rooms/{roomNo}/logs")
    public ResponseEntity<?> getRoomLogs(@PathVariable("roomNo") Long roomNo) {
        List<AiChatLog> logs = aiChatLogRepository.findByRoom_RoomNoOrderByLogNoAsc(roomNo);
        List<Map<String, Object>> result = logs.stream().map(l -> {
            Map<String, Object> m = new HashMap<>();
            m.put("question", l.getQuestion());
            m.put("answer", l.getAnswer());
            m.put("regDt", l.getRegDt());
            // RELATED_CASES(CLOB)에 직렬화되어 저장된 판례들을 다시 List<String>으로 풀어서 전달
            String relatedCasesStr = l.getRelatedCases();
            List<String> relatedCases = (relatedCasesStr == null || relatedCasesStr.isBlank())
                    ? List.of()
                    : Arrays.asList(relatedCasesStr.split("\\n\\n"));
            m.put("relatedCases", relatedCases);
            return m;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/consult")
    public ResponseEntity<?> consult(@RequestBody Map<String, Object> payload) {
        String question = payload.get("question") == null ? null : String.valueOf(payload.get("question"));
        Object roomNoObj = payload.get("roomNo");
        Long roomNo = roomNoObj == null ? null : Long.valueOf(String.valueOf(roomNoObj));
        Object userNoObj = payload.get("userNo");
        Long userNo = userNoObj == null ? null : Long.valueOf(String.valueOf(userNoObj));
        Object disableRagObj = payload.get("disableRag");
        Boolean disableRag = disableRagObj == null ? null : Boolean.valueOf(String.valueOf(disableRagObj));

        // 1. 파이썬 서버에 질문 전송
        RestTemplate restTemplate = new RestTemplate();
        Map<String, Object> pythonRequest = new HashMap<>();
        pythonRequest.put("question", question);
        // 프론트에서 disableRag 플래그가 온 경우 파이썬 서버로 그대로 전달
        if (disableRag != null) {
            pythonRequest.put("disable_rag", disableRag);
        }

        try {
            // 파이썬으로부터 응답 받기 (JSON -> Map 변환)
            Map<String, Object> pythonResponse = restTemplate.postForObject(PYTHON_SERVER_URL, pythonRequest, Map.class);

            String answer = (String) pythonResponse.get("answer");
            List<String> relatedCases = (List<String>) pythonResponse.get("related_cases");

            User user = null;
            if (userNo != null) {
                user = userRepository.findById(userNo).orElse(null);
            }

            AiChatRoom room;
            if (roomNo != null) {
                room = aiChatRoomRepository.findById(roomNo).orElse(null);
                if (room != null) {
                    room.touchLastChat(question);
                    // 오라클 컬럼이 200 BYTE 이므로, 한글 등 멀티바이트 문자열까지 고려해
                    // 여유 있게 60자까지만 제목으로 사용
                    room.ensureTitleMaxLength(60);
                    room = aiChatRoomRepository.save(room);
                } else {
                    room = null;
                }
            } else {
                // 첫 질문 시 방 생성 (질문 내용으로 제목/최근질문 설정)
                // 오라클 VARCHAR2(200 BYTE)를 안전하게 맞추기 위해, 한글/이모지 등을 고려해
                // 최대 60자까지만 제목으로 저장
                String title = null;
                if (question != null) {
                    String trimmed = question.trim();
                    title = trimmed.length() > 60 ? trimmed.substring(0, 60) : trimmed;
                }
                room = AiChatRoom.builder()
                        .user(user)
                        .title(title)
                        .lastQuestion(question)
                        .lastChatDt(LocalDateTime.now())
                        .build();
                room = aiChatRoomRepository.save(room);
            }

            // 2. 오라클 DB에 저장 (TB_AI_CHAT_LOG)
            AiChatLog log = AiChatLog.builder()
                    .room(room)
                    .user(user)
                    .question(question)
                    .answer(answer)
                    .relatedCases(relatedCases == null || relatedCases.isEmpty()
                            ? null
                            : String.join("\n\n", relatedCases))
                    .tokenUsage(0L)
                    .build();
            aiChatLogRepository.save(log);

            // 3. 리액트에 결과 반환 (답변 + 관련 판례 + roomNo)
            Map<String, Object> finalResponse = new HashMap<>();
            finalResponse.put("answer", answer);
            finalResponse.put("related_cases", relatedCases);
            finalResponse.put("roomNo", room != null ? room.getRoomNo() : null);

            return ResponseEntity.ok(finalResponse);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("AI 서버 연결 실패: " + e.getMessage());
        }
    }

    /** 상담내용으로 글쓰기: 대화 내역을 파이썬 LLM으로 변호사 상담용 제목·본문으로 정리 */
    @PostMapping("/summarize-consult")
    public ResponseEntity<?> summarizeConsult(@RequestBody Map<String, Object> payload) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> messages = (List<Map<String, Object>>) payload.get("messages");
            if (messages == null) {
                return ResponseEntity.badRequest().body("messages 필드가 필요합니다.");
            }
            Map<String, Object> pythonRequest = new HashMap<>();
            pythonRequest.put("messages", messages);
            Map<String, Object> pythonResponse = restTemplate.postForObject(
                    PYTHON_SUMMARIZE_URL, pythonRequest, Map.class);
            return ResponseEntity.ok(pythonResponse != null ? pythonResponse : new HashMap<>());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("상담 정리 요청 실패: " + e.getMessage());
        }
    }
}