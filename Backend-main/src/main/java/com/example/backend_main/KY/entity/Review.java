package com.example.backend_main.KY.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/*
 [Review Entity]
 TB_REVIEW 테이블과 1:1로 매핑
 의뢰인이 변호사에게 남기는 후기
*/
@Entity
@Table(name = "TB_REVIEW")
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "REVIEW_NO")
    private Long reviewNo; // 후기 번호 (PK)

    @Column(name = "LAWYER_NO", nullable = false)
    private Long lawyerNo; // 변호사 유저 번호 (FK)

    @Column(name = "WRITER_NO", nullable = false)
    private Long writerNo; // 작성자(의뢰인) 유저 번호 (FK)

    @Column(name = "WRITER_NM", nullable = false, length = 50)
    private String writerNm; // 작성자 이름

    @Column(name = "STARS", nullable = false)
    private Integer stars; // 별점 (1~5)

    @Column(name = "CONTENT", nullable = false, length = 2000)
    private String content; // 후기 내용

    @Column(name = "CATEGORY", length = 50)
    private String category; // 상담 카테고리 (교통사고, 이혼/가사, 형사 등)

    @Column(name = "REG_DT", updatable = false)
    private LocalDateTime regDt; // 등록 일시

    @Column(name = "REPLY_NO", updatable = false)
    private Long replyNo; // 등록 일시

    @PrePersist
    public void prePersist() {
        this.regDt = LocalDateTime.now();
    }
}
