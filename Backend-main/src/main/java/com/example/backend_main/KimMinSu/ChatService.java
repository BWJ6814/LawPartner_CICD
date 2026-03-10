package com.example.backend_main.KimMinSu;

import com.example.backend_main.common.entity.CalendarEvent;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
import java.util.Map; // ★ 추가됨
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
        private final CalendarEventRepository calendarEventRepository;

        @Value("${chat.file.upload-dir}")
        private String uploadDir;

        @Value("${chat.file.server-url}")
        private String serverUrl;

        // ------------------------------------------------------------------
        // 1. 의뢰인이 상담 요청 (방은 생기지만 대기 상태) + [양측에 알림]
        // ------------------------------------------------------------------
        @Transactional
        public String requestChat(Long userNo, Long lawyerNo) {
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
        public void saveMessage(ChatMessageDTO dto) {
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
                if (room != null && !"FILE".equals(dto.getMsgType())) {
                        Long targetUserNo = dto.getSenderNo().equals(room.getUserNo()) ? room.getLawyerNo()
                                        : room.getUserNo();

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
                        notiData.put("title", senderName);
                        notiData.put("content", content);
                        notiData.put("roomId", dto.getRoomId()); // ✅ 이거 추가
                        messagingTemplate.convertAndSend("/sub/user/" + targetUserNo + "/notification", notiData);
                }
        }

        // ------------------------------------------------------------------
        // 3. 이전 채팅 내역 조회 (수정 없음)
        // ------------------------------------------------------------------
        public List<ChatMessageDTO> getChatHistory(String roomId, Long reqUserNo) {
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

                if (!room.getLawyerNo().equals(lawyerNo)) {
                        throw new RuntimeException("등록되지 않은 접근입니다.");
                }

                room.setProgressCode("ST02");

                // ✅ 추가: 상태 변경을 방 전체에 브로드캐스트
                ChatMessageDTO statusMsg = ChatMessageDTO.builder()
                                .roomId(roomId)
                                .msgType("STATUS_CHANGE")
                                .message("ST02")
                                .build();
                messagingTemplate.convertAndSend("/sub/chat/room/" + roomId, statusMsg);
        }

        // ------------------------------------------------------------------
        // 5. 내 채팅방 목록 조회 (수정 없음)
        // ------------------------------------------------------------------
        public List<ChatRoomDTO> getMyChatRooms(Long myUserNo) {
                return chatRoomRepository.findByUserNoOrLawyerNoOrderByRegDtDesc(myUserNo, myUserNo).stream()
                                .map(room -> {
                                        String clientName = userRepository.findById(room.getUserNo())
                                                        .map(u -> u.getUserNm()).orElse("알 수 없는 유저");
                                        String lawyerName = userRepository.findById(room.getLawyerNo())
                                                        .map(u -> u.getUserNm() + " 변호사").orElse("알 수 없는 변호사");

                                        // ★ [핵심] DB에서 이 방의 가장 최근 메시지 1개를 가져옴
                                        String lastMsg = chatMessageRepository
                                                        .findTopByRoomIdOrderBySendDtDesc(room.getRoomId())
                                                        .map(msg -> "FILE".equals(msg.getMsgType()) ? "[파일이 전송되었습니다]"
                                                                        : msg.getMessage())
                                                        .orElse("대화를 시작하세요..."); // 메시지가 아예 없으면 기본 텍스트 출력

                                        return ChatRoomDTO.builder()
                                                        .roomId(room.getRoomId())
                                                        .userNo(room.getUserNo())
                                                        .lawyerNo(room.getLawyerNo())
                                                        .progressCode(room.getProgressCode())
                                                        .userNm(clientName)
                                                        .lawyerName(lawyerName)
                                                        .lastMessage(lastMsg) // ★ 꺼내온 메시지를 DTO에 박아줌!
                                                        .build();
                                })
                                .collect(Collectors.toList());
        }

        @Transactional
        public void uploadChatFile(String roomId, Long senderNo, MultipartFile file) {
                try {
                        if (file.isEmpty())
                                throw new RuntimeException("파일이 비어있습니다.");

                        File dir = new File(uploadDir);
                        if (!dir.exists())
                                dir.mkdirs();

                        String originName = file.getOriginalFilename();
                        String savedName = UUID.randomUUID().toString() + "_" + originName;

                        File dest = new File(uploadDir, savedName);
                        file.transferTo(dest);

                        String fileUrl = serverUrl + "/api/chat/files/download/" + savedName;

                        ChatMessageDTO msgDto = ChatMessageDTO.builder()
                                        .roomId(roomId)
                                        .senderNo(senderNo)
                                        .message(originName)
                                        .msgType("FILE")
                                        .fileUrl(fileUrl)
                                        .build();

                        saveMessage(msgDto);
                        messagingTemplate.convertAndSend("/sub/chat/room/" + roomId, msgDto);

                } catch (IOException e) {
                        throw new RuntimeException("Z드라이브 파일 저장 실패: " + e.getMessage());
                }
        }

        // 파라미터에 boolean isDownload 추가됨!
        public ResponseEntity<Resource> downloadChatFile(String fileName, boolean isDownload) {
                try {
                        Path filePath = Paths.get(uploadDir).resolve(fileName).normalize();
                        Resource resource = new UrlResource(filePath.toUri());

                        if (!resource.exists() || !resource.isReadable()) {
                                return ResponseEntity.notFound().build();
                        }

                        String contentType;
                        try {
                                contentType = tika.detect(filePath);
                        } catch (IOException e) {
                                contentType = "application/octet-stream";
                        }

                        String originName = fileName.substring(fileName.indexOf("_") + 1);
                        String encodedName = UriUtils.encode(originName, StandardCharsets.UTF_8);

                        // ★ [핵심] isDownload가 true면 강제 다운로드(attachment), false면 미리보기(inline)
                        String dispositionType = isDownload ? "attachment" : "inline";

                        return ResponseEntity.ok()
                                        .contentType(MediaType.parseMediaType(contentType))
                                        .header(HttpHeaders.CONTENT_DISPOSITION,
                                                        dispositionType + "; filename=\"" + encodedName + "\"")
                                        .body(resource);
                } catch (MalformedURLException e) {
                        return ResponseEntity.badRequest().build();
                }
        }

        // 1. 상담 종료 로직
        @Transactional
        public void closeChat(String roomId, Long lawyerNo) {
                ChatRoom room = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new RuntimeException("방이 존재하지 않습니다."));
                if (!room.getLawyerNo().equals(lawyerNo)) {
                        throw new RuntimeException("변호사만 종료할 수 있습니다.");
                }
                room.setProgressCode("ST05"); // 종료 상태로 변경

                ChatMessageDTO statusMsg = ChatMessageDTO.builder()
                                .roomId(roomId)
                                .msgType("STATUS_CHANGE")
                                .message("ST05")
                                .build();
                messagingTemplate.convertAndSend("/sub/chat/room/" + roomId, statusMsg);
        }

        // 2. 캘린더 동시 저장 로직
        @Transactional
        public void confirmSchedule(String roomId, String dateStr) {
                ChatRoom room = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new RuntimeException("방이 없습니다."));

                String clientName = userRepository.findById(room.getUserNo())
                                .map(com.example.backend_main.common.entity.User::getUserNm).orElse("의뢰인");
                String lawyerName = userRepository.findById(room.getLawyerNo())
                                .map(com.example.backend_main.common.entity.User::getUserNm).orElse("담당");

                // [초심자 핵심] 양측 캘린더에 일정을 박아준다.
                // 변호사 달력에 추가 (의뢰인 이름 표시)
                CalendarEvent lawyerEvent = CalendarEvent.builder()
                                .roomId(roomId)
                                .userNo(room.getLawyerNo())
                                .lawyerNo(room.getLawyerNo())
                                .title(clientName + "님과의 1:1 면담")
                                .startDate(dateStr)
                                .colorCode("#f59e0b") // 주황색
                                .build();
                calendarEventRepository.save(lawyerEvent);

                // 의뢰인 달력에 추가 (변호사 이름 표시)
                CalendarEvent clientEvent = CalendarEvent.builder()
                                .roomId(roomId)
                                .userNo(room.getUserNo())
                                .lawyerNo(room.getLawyerNo())
                                .title(lawyerName + " 변호사 면담")
                                .startDate(dateStr)
                                .colorCode("#3b82f6") // 파란색
                                .build();
                calendarEventRepository.save(clientEvent);

                if ("ST01".equals(room.getProgressCode())) {
                        room.setProgressCode("ST02");
                }
        }

}