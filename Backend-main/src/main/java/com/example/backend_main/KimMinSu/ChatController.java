package com.example.backend_main.KimMinSu;

import com.example.backend_main.common.security.JwtTokenProvider;
import com.example.backend_main.common.vo.ResultVO;
import com.example.backend_main.dto.ChatMessageDTO;
import com.example.backend_main.dto.ChatRequestDTO;
import com.example.backend_main.dto.ChatRoomDTO;
import lombok.RequiredArgsConstructor;
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
    @PostMapping("/room/request")
    public ResultVO<String> requestChat(
            @RequestHeader("Authorization") String token,
            @RequestBody ChatRequestDTO dto // lawyerNo를 담은 DTO
    ){
        Long userNo = jwtTokenProvider.getUserNoFromToken(token.substring(7));
        String roomId = chatService.requestChat(userNo, dto.getLawyerNo());
        return ResultVO.ok("상담 요청 완료! 변호사 수락을 기다려주세요.", roomId);
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
}
