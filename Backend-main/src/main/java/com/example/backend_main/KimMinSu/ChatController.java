package com.example.backend_main.KimMinSu;

import com.example.backend_main.common.security.JwtTokenProvider;
import com.example.backend_main.common.vo.ResultVO;
import com.example.backend_main.dto.ChatMessageDTO;
import com.example.backend_main.dto.ChatRequestDTO;
import com.example.backend_main.dto.ChatRoomDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final JwtTokenProvider jwtTokenProvider; // 토큰에서 번호 뽑기


    // 1. 의뢰인이 상담 요청 (POST)
    @PostMapping("/request")
    public ResponseEntity<String> requestChat(
            @RequestHeader("Authorization") String token,
            @RequestBody ChatRequestDTO dto) { // DTO 안에 userNo, lawyerNo 있음

        // 1. 토큰 까서 유저 번호 확인 (생략)

        // 2. ChatService의 방 생성 로직 호출 (여기에 알림 쏘는 로직이 들어있음!)
        String roomId = chatService.requestChat(dto.getUserNo(), dto.getLawyerNo());

        return ResponseEntity.ok(roomId);
    }


    // 2. 변호사가 상담 수락 (Put)
    @PutMapping("/room/accept/{roomId}")
    public ResultVO<Void> acceptChat(
            @PathVariable String roomId,
            @RequestHeader("Authorization") String token
    ){
        Long lawyerNo = jwtTokenProvider.getUserNoFromToken(token.substring(7));
        chatService.acceptChat(roomId, lawyerNo);
        return ResultVO.ok("상담 수락 완료!", null);
    }

    // @MessageMapping("/chat/message")은 /pub/chat/message로 온 메시지를 가로챔
    @MessageMapping("/chat/message")
    public void message(ChatMessageDTO msg){
        // 1. 받은 메시지를 DB에 저장
        chatService.saveMessage(msg);
        // 2. 해당 방을 구독 중인 (/sub/chat/room/{roomId}) 사람들에게 메시지 뿌리기
        messagingTemplate.convertAndSend("/sub/chat/room/"+msg.getRoomId(), msg);
    }


    @GetMapping("/rooms")
    public ResultVO<List<ChatRoomDTO>> getRooms(@RequestHeader("Authorization") String token) {
        Long myUserNo = jwtTokenProvider.getUserNoFromToken(token.substring(7));
        return ResultVO.ok("내 채팅방 목록 조회 성공", chatService.getMyChatRooms(myUserNo));
    }

    // 과거 채팅 내역 불러오기
    @GetMapping("/history/{roomId}")
    public ResultVO<List<ChatMessageDTO>> getChatHistory(
            @PathVariable("roomId") String roomId,
            @RequestHeader("Authorization") String token
    ) {
        // (선택) 토큰 까서 이 방에 입장할 권한이 있는 유저인지 검증하는 로직 추가하면 완벽함
        Long userNo = jwtTokenProvider.getUserNoFromToken(token.substring(7));

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
        Long senderNo = jwtTokenProvider.getUserNoFromToken(token.substring(7));
        chatService.uploadChatFile(roomId, senderNo, file);
        return ResultVO.ok("파일 업로드 완료", null);
    }

    @GetMapping("/files/download/{fileName}")
    public ResponseEntity<org.springframework.core.io.Resource> downloadChatFile(
            @PathVariable String fileName,
            @RequestParam(defaultValue = "false") boolean isDownload) {
        return chatService.downloadChatFile(fileName, isDownload);
    }
}
