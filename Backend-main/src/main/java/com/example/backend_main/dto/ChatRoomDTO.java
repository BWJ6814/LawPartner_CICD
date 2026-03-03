package com.example.backend_main.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class ChatRoomDTO {
    // 초심자를 위한 핵심: 방의 정체성과 현재 진행 상태를 프론트에 알려주는 용도야!
    private String roomId;
    private Long userNo;
    private Long lawyerNo;
    private String progressCode; // ST01(대기), ST02(진행중)
    private String statusCode;   // OPEN, CLOSE
    private LocalDateTime regDt;
    private String userNm;
    private String lawyerName;

    // (선택사항) 나중에 추가할 꿀기능들
    private String opponentName; // 상대방 이름
    private String lastMessage;  // 마지막 대화 한 줄
}