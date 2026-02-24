package com.example.backend_main.dto;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "AI_CHAT_LOG")
public class AiChatLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "LOG_ID")
    private Long logId;

    @Column(name = "USER_ID")
    private String userId;

    @Lob // 긴 텍스트
    @Column(name = "QUESTION")
    private String question;

    @Lob
    @Column(name = "ANSWER")
    private String answer;

    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt = LocalDateTime.now();
}