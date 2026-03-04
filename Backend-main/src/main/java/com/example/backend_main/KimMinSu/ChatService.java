package com.example.backend_main.KimMinSu;

import com.example.backend_main.common.entity.ChatMessage;
import com.example.backend_main.common.entity.ChatRoom;
import com.example.backend_main.common.entity.Notification;
import com.example.backend_main.common.repository.ChatMessageRepository;
import com.example.backend_main.common.repository.ChatRoomRepository;
import com.example.backend_main.common.repository.NotificationRepository;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.dto.ChatMessageDTO;
import com.example.backend_main.dto.ChatRoomDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate; // ★ 추가됨
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriUtils;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
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

    // 파일을 저장할 서버 하드디스크 절대 경로 (리눅스면 /var/uploads/chat/ 같은 걸로 바꿔라)
    private final String CHAT_UPLOAD_DIR = "C:/LP_uploads/chat/";
    private final org.apache.tika.Tika tika = new org.apache.tika.Tika();

    // ------------------------------------------------------------------
    // 1. 의뢰인이 상담 요청 (방은 생기지만 대기 상태) + [양측에 알림]
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

        // ★ [핵심 1] DB에서 진짜 이름들 꺼내오기
        String clientName = userRepository.findById(userNo)
                .map(com.example.backend_main.common.entity.User::getUserNm)
                .orElse("의뢰인");
        String lawyerName = userRepository.findById(lawyerNo)
                .map(com.example.backend_main.common.entity.User::getUserNm)
                .orElse("담당");

        // =========================================================
        // ★ [알림 로직 1] 변호사에게 쏘는 알림 ("의뢰인님이 요청했습니다")
        // =========================================================
        String lawyerTitle = "상담 요청";
        String lawyerContent = clientName + "님이 1:1 채팅을 요청하였습니다.";

        Notification lawyerNoti = Notification.builder()
                .userNo(lawyerNo) // 타겟: 변호사
                .msgTitle(lawyerTitle)
                .msgContent(lawyerContent)
                .roomId(roomId)
                .readYn("N")
                .build();
        notificationRepository.save(lawyerNoti);

        // 변호사 웹소켓 발사
        Map<String, String> lawyerNotiData = new HashMap<>();
        lawyerNotiData.put("title", lawyerTitle);
        lawyerNotiData.put("content", lawyerContent);
        messagingTemplate.convertAndSend("/sub/user/" + lawyerNo + "/notification", lawyerNotiData);

        // =========================================================
        // ★ [알림 로직 2] 일반 유저(본인)에게 남기는 기록용 알림
        // =========================================================
        String clientTitle = "요청 완료";
        String clientContent = lawyerName + " 변호사에게 1:1 채팅을 요청하였습니다.";

        Notification clientNoti = Notification.builder()
                .userNo(userNo) // 타겟: 일반 유저
                .msgTitle(clientTitle)
                .msgContent(clientContent)
                .readYn("N")
                .build();
        notificationRepository.save(clientNoti);

        // 일반 유저 웹소켓 발사
        Map<String, String> clientNotiData = new HashMap<>();
        clientNotiData.put("title", clientTitle);
        clientNotiData.put("content", clientContent);
        messagingTemplate.convertAndSend("/sub/user/" + userNo + "/notification", clientNotiData);

        return roomId;
    }

    // ------------------------------------------------------------------
    // 2. 메시지 저장 로직 + [상대방에게 알림] (이게 빠져서 터진 거임)
    // ------------------------------------------------------------------
    @Transactional
    public void saveMessage(ChatMessageDTO dto){
        // ① 메시지 DB에 저장
        ChatMessage msg = ChatMessage.builder()
                .roomId(dto.getRoomId())
                .senderNo(dto.getSenderNo())
                .message(dto.getMessage())
                .msgType(dto.getMsgType() != null ? dto.getMsgType() : "TEXT")
                .fileUrl(dto.getFileUrl())
                .build();
        chatMessageRepository.save(msg);

        // ② 알림 로직 (상대방 번호 찾아서 쏘기)
        ChatRoom room = chatRoomRepository.findById(dto.getRoomId()).orElse(null);
        if (room != null) {
            Long targetUserNo = dto.getSenderNo().equals(room.getUserNo()) ? room.getLawyerNo() : room.getUserNo();

            String title = "새 메시지";
            String content = dto.getMessage();

            String senderName = userRepository.findById(dto.getSenderNo())
                    .map(com.example.backend_main.common.entity.User::getUserNm)
                    .orElse("알 수 없는 유저");

            Notification noti = Notification.builder()
                    .userNo(targetUserNo)
                    .msgTitle(senderName) // "홍길동" 이라고 들어감
                    .msgContent(dto.getMessage()) // 채팅 내용
                    .roomId(dto.getRoomId()) // ★ 이거 꽂아줘야 프론트에서 이동 가능!
                    .readYn("N")
                    .build();
            notificationRepository.save(noti);

            Map<String, String> notiData = new HashMap<>();
            notiData.put("title", title);
            notiData.put("content", content);
            messagingTemplate.convertAndSend("/sub/user/" + targetUserNo + "/notification", notiData);
        }
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

    @Transactional
    public void uploadChatFile(String roomId, Long senderNo, MultipartFile file) {
        try {
            if (file.isEmpty()) throw new RuntimeException("파일이 비어있습니다.");

            File dir = new File(CHAT_UPLOAD_DIR);
            // [초심자 핵심] 디렉토리 없으면 서버가 에러 뿜으니까 mkdirs()로 폴더부터 만들어준다.
            if (!dir.exists()) dir.mkdirs();

            String originName = file.getOriginalFilename();
            // 해킹 방지 및 이름 꼬임 방지를 위해 UUID 무조건 붙여라
            String savedName = UUID.randomUUID().toString() + "_" + originName;
            File dest = new File(CHAT_UPLOAD_DIR, savedName);

            // 실제 디스크에 파일 저장
            file.transferTo(dest);

            // [초심자 핵심] DB에 넣을 정보 세팅. msgType을 FILE로 박고 다운로드 API 경로를 넣어줌
            ChatMessageDTO msgDto = ChatMessageDTO.builder()
                    .roomId(roomId)
                    .senderNo(senderNo)
                    .message(originName) // 화면에 보여줄 원본 파일명
                    .msgType("FILE")
                    .fileUrl("/api/chat/files/download/" + savedName)
                    .build();

            // 1. 기존에 만들어둔 saveMessage() 재활용 (DB 저장 + 1:1 알림 전송)
            saveMessage(msgDto);

            // 2. [중요] 해당 방에 있는 사람들에게 "파일 올라왔다!" 하고 채팅방 웹소켓으로 쏴줌
            messagingTemplate.convertAndSend("/sub/chat/room/" + roomId, msgDto);

        } catch (IOException e) {
            throw new RuntimeException("파일 저장 중 서버 터짐: " + e.getMessage());
        }
    }

    public ResponseEntity<org.springframework.core.io.Resource> downloadChatFile(String fileName) {
        try {
            java.nio.file.Path filePath = java.nio.file.Paths.get(CHAT_UPLOAD_DIR).resolve(fileName).normalize();
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            // [초심자 핵심 1] Tika로 파일의 진짜 정체(MIME 타입)를 캐냄
            String contentType;
            try {
                contentType = tika.detect(filePath);
            } catch (java.io.IOException e) {
                // 분석 실패하거나 뭔지 모를 파일이면 기본값 세팅 (알아서 다운로드 됨)
                contentType = "application/octet-stream";
            }

            // UUID 떼고 예쁜 원본 이름만 추출
            String originName = fileName.substring(fileName.indexOf("_") + 1);
            String encodedUploadFileName = org.springframework.web.util.UriUtils.encode(originName, java.nio.charset.StandardCharsets.UTF_8);

            // [초심자 핵심 2] attachment 대신 inline으로 바꿈! + contentType 세팅
            // 이렇게 하면 브라우저가 지원하는 형식(jpg, pdf 등)은 탭에서 열리고, zip 같은 건 알아서 다운로드 됨
            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + encodedUploadFileName + "\"")
                    .body(resource);

        } catch (java.net.MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}