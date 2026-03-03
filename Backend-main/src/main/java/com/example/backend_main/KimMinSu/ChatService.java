package com.example.backend_main.KimMinSu;

import com.example.backend_main.common.entity.ChatMessage;
import com.example.backend_main.common.entity.ChatRoom;
import com.example.backend_main.common.repository.ChatMessageRepository;
import com.example.backend_main.common.repository.ChatRoomRepository;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.dto.ChatMessageDTO;
import com.example.backend_main.dto.ChatRoomDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate; // ★ 추가됨
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap; // ★ 추가됨
import java.util.List;
import java.util.Map;     // ★ 추가됨
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;

    // ★ [알림용 1] 웹소켓으로 특정 유저에게 데이터를 쏘기 위한 템플릿
    private final SimpMessagingTemplate messagingTemplate;

    private final UserRepository userRepository;

    // ★ [알림용 2] DB에 알림 저장하기 위한 Repository (이건 네가 만들어야 함!)
    private final NotificationRepository notificationRepository;

    // ------------------------------------------------------------------
    // 1. 의뢰인이 상담 요청 (방은 생기지만 대기 상태) + [변호사에게 알림]
    // ------------------------------------------------------------------
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

        // =========================================================
        // ★ [알림 로직 1] 변호사에게 상담 요청 알림 쏘기
        // =========================================================
        String title = "새로운 상담 요청";
        String content = "새로운 1:1 상담 요청이 접수되었습니다.";

        // ① DB 저장 (주석 풀고 엔티티 만들어서 써라)
        Notification noti = Notification.builder()
                .userNo(lawyerNo) // 타겟: 변호사
                .msgTitle(title)
                .msgContent(content)
                .readYn("N")
                .build();
        notificationRepository.save(noti);


        // ② 글로벌 웹소켓으로 프론트(Header)에 실시간 발사!
        Map<String, String> notiData = new HashMap<>();
        notiData.put("title", title);
        notiData.put("content", content);
        // /sub/user/{변호사번호}/notification 으로 쏜다!
        messagingTemplate.convertAndSend("/sub/user/" + lawyerNo + "/notification", notiData);
        // =========================================================

        return roomId;
    }

    // ------------------------------------------------------------------
    // 2. 메시지 저장 로직 + [상대방에게 알림]
    // ------------------------------------------------------------------
    @Transactional
    public void saveMessage(ChatMessageDTO dto){
        // ① 메시지 DB에 저장 (기존 로직)
        ChatMessage msg = ChatMessage.builder()
                .roomId(dto.getRoomId())
                .senderNo(dto.getSenderNo())
                .message(dto.getMessage())
                .msgType(dto.getMsgType() != null ? dto.getMsgType() : "TEXT")
                .fileUrl(dto.getFileUrl())
                .build();
        chatMessageRepository.save(msg);

        // =========================================================
        // ★ [알림 로직 2] 상대방 번호 찾아서 채팅 알림 쏘기
        // =========================================================
        ChatRoom room = chatRoomRepository.findById(dto.getRoomId()).orElse(null);
        if (room != null) {
            // 내가 보낸 거면 변호사가 타겟, 변호사가 보낸 거면 내가 타겟
            Long targetUserNo = dto.getSenderNo().equals(room.getUserNo()) ? room.getLawyerNo() : room.getUserNo();

            String title = "새 메시지";
            String content = dto.getMessage(); // 파일이면 "파일이 도착했습니다" 등으로 분기 처리 가능

            // ① DB 저장
            Notification noti = Notification.builder()
                    .userNo(targetUserNo)
                    .msgTitle(title)
                    .msgContent(content)
                    .readYn("N")
                    .build();
            notificationRepository.save(noti);


            // ② 글로벌 웹소켓으로 프론트(Header)에 실시간 발사!
            Map<String, String> notiData = new HashMap<>();
            notiData.put("title", title);
            notiData.put("content", content);
            messagingTemplate.convertAndSend("/sub/user/" + targetUserNo + "/notification", notiData);
        }
        // =========================================================
    }

    // ------------------------------------------------------------------
    // 3. 이전 채팅 내역 조회 (수정 없음)
    // ------------------------------------------------------------------
    public List<ChatMessageDTO> getChatHistory(String roomId, Long reqUserNo){
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 채팅방입니다."));

        if (!room.getUserNo().equals(reqUserNo) && !room.getLawyerNo().equals(reqUserNo)) {
            throw new RuntimeException("이 방의 채팅 내역을 볼 권한이 없습니다.");
        }

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

    // ------------------------------------------------------------------
    // 4. 변호사가 상담 수락 (수정 없음)
    // ------------------------------------------------------------------
    @Transactional
    public void acceptChat(String roomId, Long lawyerNo) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("방이 존재하지 않습니다."));

        if(!room.getLawyerNo().equals(lawyerNo)) {
            throw new RuntimeException("등록되지 않은 접근입니다.");
        }

        room.setProgressCode("ST02");
    }

    // ------------------------------------------------------------------
    // 5. 내 채팅방 목록 조회 (수정 없음)
    // ------------------------------------------------------------------
    public List<ChatRoomDTO> getMyChatRooms(Long myUserNo) {
        return chatRoomRepository.findByUserNoOrLawyerNoOrderByRegDtDesc(myUserNo, myUserNo).stream()
                .map(room -> {
                    // ★ [핵심 추가] DB에서 유저 번호로 진짜 이름을 꺼내온다!
                    String clientName = userRepository.findById(room.getUserNo())
                            .map(u -> u.getUserNm()).orElse("알 수 없는 유저");
                    String lawyerName = userRepository.findById(room.getLawyerNo())
                            .map(u -> u.getUserNm() + " 변호사").orElse("알 수 없는 변호사");

                    return ChatRoomDTO.builder()
                            .roomId(room.getRoomId())
                            .userNo(room.getUserNo())
                            .lawyerNo(room.getLawyerNo())
                            .progressCode(room.getProgressCode())
                            .userNm(clientName)       // 프론트로 의뢰인 이름 전송
                            .lawyerName(lawyerName)   // 프론트로 변호사 이름 전송
                            .build();
                })
                .collect(Collectors.toList());
    }
}