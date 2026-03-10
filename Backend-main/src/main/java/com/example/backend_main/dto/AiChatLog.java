package com.example.backend_main.dto;

import com.example.backend_main.common.entity.AiChatRoom;
import com.example.backend_main.common.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "TB_AI_CHAT_LOG")
public class AiChatLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "LOG_NO")
    private Long logNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ROOM_NO")
    private AiChatRoom room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER_NO")
    private User user;

    @Column(name = "CATEGORY_CODE", length = 20)
    private String categoryCode;

    @Column(name = "QUESTION", length = 4000)
    private String question;

    @Lob
    @Column(name = "ANSWER")
    private String answer;

    @Column(name = "TOKEN_USAGE")
    private Long tokenUsage;

    @CreationTimestamp
    @Column(name = "REG_DT", updatable = false)
    private LocalDateTime regDt;
}