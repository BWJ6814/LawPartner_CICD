package com.example.backend_main.BWJ;

import com.example.backend_main.dto.AiChatLog;
import lombok.Data;
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

    // 파이썬 서버 주소
    private final String PYTHON_SERVER_URL = "http://localhost:8000/chat";

    @PostMapping("/consult")
    public ResponseEntity<?> consult(@RequestBody Map<String, String> payload) {
        String question = payload.get("question");
        String userId = payload.getOrDefault("userId", "GUEST"); // 로그인 안 했으면 GUEST

        // 1. 파이썬 서버에 질문 전송
        RestTemplate restTemplate = new RestTemplate();
        Map<String, String> pythonRequest = new HashMap<>();
        pythonRequest.put("question", question);

        try {
            // 파이썬으로부터 응답 받기 (JSON -> Map 변환)
            Map<String, Object> pythonResponse = restTemplate.postForObject(PYTHON_SERVER_URL, pythonRequest, Map.class);

            String answer = (String) pythonResponse.get("answer");
            List<String> relatedCases = (List<String>) pythonResponse.get("related_cases");

            // 2. 오라클 DB에 저장
            AiChatLog log = new AiChatLog();
            log.setUserId(userId);
            log.setQuestion(question);
            log.setAnswer(answer);
            aiChatLogRepository.save(log);

            // 3. 리액트에 결과 반환 (답변 + 관련 판례)
            Map<String, Object> finalResponse = new HashMap<>();
            finalResponse.put("answer", answer);
            finalResponse.put("related_cases", relatedCases);

            return ResponseEntity.ok(finalResponse);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("AI 서버 연결 실패: " + e.getMessage());
        }
    }
}