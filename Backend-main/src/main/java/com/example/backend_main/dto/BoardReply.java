package com.example.backend_main.dto;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.DynamicInsert;
import java.time.LocalDateTime;

@Entity
@Table(name = "TB_BOARD_REPLY")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@DynamicInsert
public class BoardReply {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "REPLY_NO")
    private Long replyNo;

    @Column(name = "BOARD_NO")
    private Long boardNo;

    @Column(name = "WRITER_NO")
    private Long writerNo; // 변호사 ID

    @Column(name = "CONTENT", length = 4000, nullable = false)
    private String content;

    @Column(name = "SELECTION_YN")
    @ColumnDefault("'N'")
    private String selectionYn; // 채택 여부

    @CreationTimestamp
    @Column(name = "REG_DT")
    private LocalDateTime regDt;
}