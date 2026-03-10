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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "http://localhost:3000") // 리액트 허용
public class AiChatController {

    @Autowired
    private AiChatLogRepository aiChatLogRepository;

    @Autowired
    private AiChatRoomRepository aiChatRoomRepository;

    @Autowired
    private UserRepository userRepository;

    // 파이썬 서버 주소
    private final String PYTHON_SERVER_URL = "http://localhost:8000/chat";

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

        // 1. 파이썬 서버에 질문 전송
        RestTemplate restTemplate = new RestTemplate();
        Map<String, String> pythonRequest = new HashMap<>();
        pythonRequest.put("question", question);

        try {
            // 파이썬으로부터 응답 받기 (JSON -> Map 변환)
            Map<String, Object> pythonResponse = restTemplate.postForObject(PYTHON_SERVER_URL, pythonRequest, Map.class);

            String answer = (String) pythonResponse.get("answer");
            List<String> relatedCases = (List<String>) pythonResponse.get("related_cases");

            AiChatRoom room = null;
            if (roomNo != null) {
                room = aiChatRoomRepository.findById(roomNo).orElse(null);
                if (room != null) {
                    room.touchLastChat(question);
                    room.ensureTitleMaxLength(200);
                    aiChatRoomRepository.save(room);
                }
            }

            User user = null;
            if (userNo != null) {
                user = userRepository.findById(userNo).orElse(null);
            }

            // 2. 오라클 DB에 저장
            AiChatLog log = AiChatLog.builder()
                    .room(room)
                    .user(user)
                    .question(question)
                    .answer(answer)
                    .tokenUsage(0L)
                    .build();
            aiChatLogRepository.save(log);

            // 3. 리액트에 결과 반환 (답변 + 관련 판례)
            Map<String, Object> finalResponse = new HashMap<>();
            finalResponse.put("answer", answer);
            finalResponse.put("related_cases", relatedCases);
            finalResponse.put("roomNo", roomNo);

            return ResponseEntity.ok(finalResponse);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("AI 서버 연결 실패: " + e.getMessage());
        }
    }
}