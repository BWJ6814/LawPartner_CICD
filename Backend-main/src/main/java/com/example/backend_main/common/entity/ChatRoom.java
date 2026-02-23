package com.example.backend_main.common.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "TB_CHAT_ROOM")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder // ★ 서비스에서 builder() 쓰려면 이거 필수다 형님아
public class ChatRoom {

    @Id
    @Column(name = "ROOM_ID", length = 50)
    private String roomId; // UUID 들어갈 자리

    @Column(name = "USER_NO", nullable = false)
    private Long userNo;

    @Column(name = "LAWYER_NO", nullable = false)
    private Long lawyerNo;

    @Column(name = "STATUS_CODE", length = 20)
    @Builder.Default
    private String statusCode = "OPEN";

    @Column(name = "PROGRESS_CODE", length = 20)
    @Builder.Default
    private String progressCode = "ST01"; // 초기값 '대기'

    @Column(name = "REG_DT")
    @Builder.Default
    private LocalDateTime regDt = LocalDateTime.now();
}