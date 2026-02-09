package com.example.backend_main.dto;


import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.DynamicInsert;

import java.time.LocalDateTime;

@Entity
@Table(name = "TB_BOARD") // DB 테이블명 지정
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@DynamicInsert // default 값 적용을 위해 필요
public class Board {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "BOARD_NO")
    private Long boardNo;

    @Column(name = "CATEGORY_CODE", nullable = false, length = 200)
    private String categoryCode;

    @Column(name = "TITLE", nullable = false, length = 300)
    private String title;

    @Lob // Oracle CLOB 타입 매핑
    @Column(name = "CONTENT", nullable = false)
    private String content;

    @Column(name = "WRITER_NO", nullable = false)
    private Long writerNo; // 작성자 번호 (로그인 전이라 임시 사용)

    @Column(name = "SECRET_YN")
    @ColumnDefault("'N'")
    private String secretYn;

    @Column(name = "BLIND_YN")
    @ColumnDefault("'N'")
    private String blindYn;

    @Column(name = "HIT_CNT")
    @ColumnDefault("0")
    private Integer hitCnt;

    @CreationTimestamp
    @Column(name = "REG_DT")
    private LocalDateTime regDt;
}