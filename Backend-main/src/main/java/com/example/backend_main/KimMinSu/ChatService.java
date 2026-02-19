package com.example.backend_main.KimMinSu;

import com.example.backend_main.common.entity.ChatMessage;
import com.example.backend_main.common.entity.ChatRoom;
import com.example.backend_main.common.repository.ChatMessageRepository;
import com.example.backend_main.common.repository.ChatRoomRepository;
import com.example.backend_main.dto.ChatMessageDTO;
import com.example.backend_main.dto.ChatRoomDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;

    // 1. 의뢰인이 상담 요청 (받은 생기지만 대기 상태)
    @Transactional
    public String requestChat(Long userNo, Long lawyerNo){
        String roomId = UUID.randomUUID().toString(); // 랜덤 방 ID 생성
        ChatRoom room = ChatRoom.builder()
                .roomId(roomId)
                .userNo(userNo)
                .lawyerNo(lawyerNo)
                .progressCode("ST01") // 팩트 : 처음엔 '대기' 상태로 박기
                .build();
        chatRoomRepository.save(room);
        return roomId;
    }

    // 메시지 저장 로직
    @Transactional
    public void saveMessage(ChatMessageDTO dto){
        ChatMessage msg = ChatMessage.builder()
                .roomId(dto.getRoomId())
                .senderNo(dto.getSenderNo())
                .message(dto.getMessage())
                .msgType(dto.getMsgType() != null ? dto.getMsgType() : "TEXT")
                .fileUrl(dto.getFileUrl())
                .build();
        chatMessageRepository.save(msg);

    }

    // 이전 채팅 내역 조회
    public List<ChatMessageDTO> getChatHistory(String roomId){
        return chatMessageRepository.findByRoomIdOrderBySendDtAsc(roomId).stream()
                .map(msg -> ChatMessageDTO.builder()
                        .roomId(msg.getRoomId())
                        .senderNo(msg.getSenderNo())
                        .message(msg.getMessage())
                        .msgType(msg.getMsgType())
                        .fileUrl(msg.getFileUrl())
                        .build())
                .collect(Collectors.toList());
    }

    // 2. 변호사가 상담 수락 (상태를 진행 중으로 변경)
    @Transactional
    public void acceptChat(String roomId, Long lawyerNo) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("방이 존재하지 않습니다."));


        if(!room.getLawyerNo().equals(lawyerNo)) {
            throw new RuntimeException("등록되지 않은 접근입니다.");
        }

        room.setProgressCode("ST02"); // 팩트: 이제 '상담 중'으로 활성화
    }

    public List<ChatRoomDTO> getMyChatRooms(Long myUserNo) {
        // 내 번호가 의뢰인 칸에 있든 변호사 칸에 있든 다 긁어옴
        return chatRoomRepository.findByUserNoOrLawyerNoOrderByRegDtDesc(myUserNo, myUserNo).stream()
                .map(room -> ChatRoomDTO.builder()
                        .roomId(room.getRoomId())
                        .userNo(room.getUserNo())
                        .lawyerNo(room.getLawyerNo())
                        .progressCode(room.getProgressCode())
                        .build())
                .collect(Collectors.toList());
    }
}
