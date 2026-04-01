package com.example.backend_main.KimMinSu;

import com.example.backend_main.common.exception.CustomException;
import com.example.backend_main.common.repository.NotificationRepository;
import com.example.backend_main.common.security.JwtTokenProvider;
import com.example.backend_main.common.vo.ResultVO;
import com.example.backend_main.dto.ChatMessageDTO;
import com.example.backend_main.dto.ChatRequestDTO;
import com.example.backend_main.dto.ChatRoomDTO;
import com.example.backend_main.dto.ChatRoomRequestResultDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final JwtTokenProvider jwtTokenProvider;
    private final NotificationRepository notificationRepository;


    // 1. 의뢰인이 상담 요청 (POST)
    @PostMapping("/request")
    public ResponseEntity<ChatRoomRequestResultDTO> requestChat(
            @RequestHeader("Authorization") String token,
            @RequestBody ChatRequestDTO dto) { // DTO 안에 userNo, lawyerNo 있음

        // 1. 토큰 까서 유저 번호 확인 (생략)

        // 2. 대기/진행 방이 있으면 재사용, 없을 때만 생성·알림
        ChatRoomRequestResultDTO result = chatService.requestOrReuseActiveConsultationRoom(dto.getUserNo(), dto.getLawyerNo());

        return ResponseEntity.ok(result);
    }

    /** 기존 채팅방에 대한 1:1 채팅 요청 알림 전송 (전문가찾기/상담게시판에서 방 생성 후 호출) */
    @PostMapping("/room/notify")
    public ResultVO<Void> notifyChatRequest(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, Object> body) {
        Long myUserNo = jwtTokenProvider.getUserNoFromAuthorizationHeader(token);
        if (myUserNo == null) return ResultVO.fail("AUTH-401", "인증이 필요합니다.");
        String roomId = body.get("roomId") != null ? body.get("roomId").toString() : null;
        Long userNo = body.get("userNo") != null ? Long.valueOf(body.get("userNo").toString()) : null;
        Long lawyerNo = body.get("lawyerNo") != null ? Long.valueOf(body.get("lawyerNo").toString()) : null;
        if (roomId == null || userNo == null || lawyerNo == null) {
            return ResultVO.fail("BAD_REQUEST", "roomId, userNo, lawyerNo가 필요합니다.");
        }
        if (!myUserNo.equals(userNo)) return ResultVO.fail("AUTH-403", "의뢰인만 알림을 보낼 수 있습니다.");
        chatService.sendChatRequestNotificationsForRoom(roomId, userNo, lawyerNo);
        return ResultVO.ok("알림 전송 완료", null);
    }

    // 2. 변호사가 상담 수락 (Put)
    @PutMapping("/room/accept/{roomId}")
    public ResultVO<Void> acceptChat(
            @PathVariable String roomId,
            @RequestHeader("Authorization") String token
    ){
        Long lawyerNo = jwtTokenProvider.getUserNoFromAuthorizationHeader(token);
        if (lawyerNo == null) return ResultVO.fail("AUTH-401", "인증이 필요합니다.");
        chatService.acceptChat(roomId, lawyerNo);
        return ResultVO.ok("상담 수락 완료!", null);
    }

    // 채팅방 읽음 처리 (unreadCount 초기화)
    @PostMapping("/room/{roomId}/read")
    public ResultVO<Void> markRoomAsRead(
            @PathVariable String roomId,
            @RequestHeader("Authorization") String token) {
        Long userNo = jwtTokenProvider.getUserNoFromAuthorizationHeader(token);
        if (userNo == null) return ResultVO.fail("AUTH-401", "인증이 필요합니다.");
        notificationRepository.markAllReadByUserNoAndRoomId(userNo, roomId);
        return ResultVO.ok("읽음 처리 완료", null);
    }

    // @MessageMapping("/chat/message")은 /pub/chat/message로 온 메시지를 가로챔
    @MessageMapping("/chat/message")
    public void message(@Payload ChatMessageDTO msg, Principal principal) {
        if (principal == null) {
            log.warn("[WebSocket] 메시지 수신 — 인증(Principal) 없음. roomId={}", msg != null ? msg.getRoomId() : null);
            return;
        }
        try {
            chatService.saveMessage(msg);
            messagingTemplate.convertAndSend("/sub/chat/room/" + msg.getRoomId(), msg);
        } catch (CustomException e) {
            String detail = e.getMessage();
            if (detail == null || detail.isBlank()) {
                detail = e.getErrorCode().getMessage();
            }
            Map<String, String> error = Map.of(
                    "code", e.getErrorCode().getCode(),
                    "message", detail
            );
            // 알림(/sub/user/{userNo}/notification)과 동일하게 userNo 기준 직접 브로드캐스트.
            // convertAndSendToUser(/user/queue/errors)는 Principal 이름과 구독이 어긋나 토스트가 안 뜨는 경우가 있음.
            Long senderNo = msg != null ? msg.getSenderNo() : null;
            if (senderNo != null) {
                messagingTemplate.convertAndSend("/sub/user/" + senderNo + "/errors", error);
            } else {
                messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/errors", error);
            }
        } catch (Exception e) {
            log.error("[WebSocket] 채팅 메시지 처리 실패. roomId={}, user={}",
                    msg != null ? msg.getRoomId() : null, principal.getName(), e);
            Map<String, String> error = Map.of(
                    "code", "SYSTEM_ERROR",
                    "message", "메시지 전송 중 오류가 발생했습니다."
            );
            Long senderNo = msg != null ? msg.getSenderNo() : null;
            if (senderNo != null) {
                messagingTemplate.convertAndSend("/sub/user/" + senderNo + "/errors", error);
            } else {
                messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/errors", error);
            }
        }
    }


    @GetMapping("/rooms")
    public ResultVO<List<ChatRoomDTO>> getRooms(@RequestHeader("Authorization") String token) {
        Long myUserNo = jwtTokenProvider.getUserNoFromAuthorizationHeader(token);
        if (myUserNo == null) return ResultVO.fail("AUTH-401", "인증이 필요합니다.");
        return ResultVO.ok("내 채팅방 목록 조회 성공", chatService.getMyChatRooms(myUserNo));
    }

    // 과거 채팅 내역 불러오기 (size 있으면 페이지네이션: 최신 size개, before 있으면 그 이전 size개)
    @GetMapping("/history/{roomId}")
    public ResultVO<List<ChatMessageDTO>> getChatHistory(
            @PathVariable("roomId") String roomId,
            @RequestHeader("Authorization") String token,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String before
    ) {
        Long userNo = jwtTokenProvider.getUserNoFromAuthorizationHeader(token);
        if (userNo == null) return ResultVO.fail("AUTH-401", "인증이 필요합니다.");

        if (size != null && size > 0) {
            java.time.LocalDateTime beforeDt = null;
            if (before != null && !before.isEmpty()) {
                try {
                    beforeDt = java.time.LocalDateTime.parse(before);
                } catch (Exception ignored) { }
            }
            List<ChatMessageDTO> history = chatService.getChatHistoryPaged(roomId, userNo, size, beforeDt);
            return ResultVO.ok("과거 채팅 내역 조회 성공", history);
        }
        List<ChatMessageDTO> history = chatService.getChatHistory(roomId, userNo);
        return ResultVO.ok("과거 채팅 내역 조회 성공", history);
    }

    // [초심자 핵심] 채팅 파일 업로드는 소켓이 아니라 무조건 HTTP POST로 처리해야 서버가 안 뻗는다.
    @PostMapping("/files")
    public ResultVO<String> uploadChatFile(
            @RequestHeader("Authorization") String token,
            @RequestParam("roomId") String roomId,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file
    ) {
        Long senderNo = jwtTokenProvider.getUserNoFromAuthorizationHeader(token);
        if (senderNo == null) return ResultVO.fail("AUTH-401", "인증이 필요합니다.");
        chatService.uploadChatFile(roomId, senderNo, file);
        return ResultVO.ok("파일 업로드 완료", null);
    }

    @GetMapping("/files/download/{fileName}")
    public ResponseEntity<org.springframework.core.io.Resource> downloadChatFile(
            @PathVariable String fileName,
            @RequestParam(defaultValue = "false") boolean isDownload) {
        return chatService.downloadChatFile(fileName, isDownload);
    }

    // 1. 상담 종료 (변호사 전용)
    @PutMapping("/room/close/{roomId}")
    public ResultVO<Void> closeChat(
            @PathVariable String roomId,
            @RequestHeader("Authorization") String token
    ){
        Long lawyerNo = jwtTokenProvider.getUserNoFromAuthorizationHeader(token);
        if (lawyerNo == null) return ResultVO.fail("AUTH-401", "인증이 필요합니다.");
        chatService.closeChat(roomId, lawyerNo);
        return ResultVO.ok("상담이 종료되었습니다.", null);
    }

    // 상담 종료 후 의뢰인이 변호사 리뷰 작성
    @PostMapping("/room/{roomId}/review")
    public ResultVO<Void> submitReview(
            @PathVariable String roomId,
            @RequestHeader("Authorization") String token,
            @RequestBody java.util.Map<String, Object> body
    ) {
        Long userNo = jwtTokenProvider.getUserNoFromAuthorizationHeader(token);
        if (userNo == null) return ResultVO.fail("AUTH-401", "인증이 필요합니다.");
        Object r = body.get("rating");
        Object c = body.get("content");
        double rating = r instanceof Number ? ((Number) r).doubleValue() : Double.parseDouble(String.valueOf(r));
        String content = c != null ? c.toString() : "";
        try {
            chatService.submitReview(roomId, userNo, rating, content);
            return ResultVO.ok("리뷰가 등록되었습니다.", null);
        } catch (RuntimeException e) {
            return ResultVO.fail("BAD_REQUEST", e.getMessage());
        }
    }

    // 2. 캘린더 일정 확정 (의뢰인이 수락 누를 때 호출) — 요청자가 해당 방 참여자인지 검증
    @PostMapping("/calendar/confirm")
    public ResultVO<Void> confirmSchedule(
            @RequestHeader("Authorization") String token,
            @RequestBody java.util.Map<String, String> payload
    ) {
        Long userNo = jwtTokenProvider.getUserNoFromAuthorizationHeader(token);
        if (userNo == null) return ResultVO.fail("AUTH-401", "인증이 필요합니다.");
        String roomId = payload.get("roomId");
        String dateStr = payload.get("date");
        try {
            chatService.confirmSchedule(roomId, dateStr, userNo);
            return ResultVO.ok("일정이 캘린더에 추가되었습니다.", null);
        } catch (IllegalArgumentException e) {
            return ResultVO.fail("BAD_REQUEST", e.getMessage());
        } catch (RuntimeException e) {
            return ResultVO.fail("FORBIDDEN", e.getMessage());
        }
    }

    @PostMapping("/calendar/reject")
    public ResultVO<Void> rejectSchedule(
            @RequestHeader("Authorization") String token,
            @RequestBody java.util.Map<String, String> payload
    ) {
        Long userNo = jwtTokenProvider.getUserNoFromAuthorizationHeader(token);
        if (userNo == null) return ResultVO.fail("AUTH-401", "인증이 필요합니다.");
        String roomId = payload.get("roomId");
        String dateStr = payload.get("date");
        String reason = payload.get("reason");
        try {
            chatService.rejectSchedule(roomId, dateStr, reason, userNo);
            return ResultVO.ok("일정이 거절되었습니다.", null);
        } catch (RuntimeException e) {
            return ResultVO.fail("BAD_REQUEST", e.getMessage());
        }
    }

}
