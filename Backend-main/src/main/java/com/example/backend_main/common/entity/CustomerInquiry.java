package com.example.backend_main.common.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/*
 [CustomerInquiry 엔티티]
 TB_CUSTOMER_INQUIRY 테이블과 1:1 매핑
 - @CreationTimestamp : INSERT 시 자동으로 현재 시각 삽입 (createdAt)
 - @UpdateTimestamp   : UPDATE 시 자동으로 현재 시각 갱신 (updatedAt) + DB 트리거 이중 보호
 - CLOB 필드(content, answerContent)는 @Lob으로 처리
*/
@Entity
@Table(name = "TB_CUSTOMER_INQUIRY")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class CustomerInquiry {

    @Id
    @Column(name = "ID")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "WRITER_NO", nullable = false)
    private Long writerNo;                          // 작성자 USER_NO

    @Column(name = "TYPE", nullable = false, length = 100)
    private String type;                            // 문의 유형

    @Column(name = "TITLE", nullable = false, length = 300)
    private String title;                           // 문의 제목

    @Lob
    @Column(name = "CONTENT", nullable = false)
    private String content;                         // 문의 내용

    @Column(name = "STATUS", nullable = false, length = 20)
    @Builder.Default
    private String status = "대기";                 // 대기 / 답변완료

    @Lob
    @Column(name = "ANSWER_CONTENT")
    private String answerContent;                   // 관리자 답변 내용

    @Column(name = "ANSWERED_BY", length = 100)
    private String answeredBy;                      // 답변한 관리자 이름

    @Column(name = "ANSWERED_AT")
    private LocalDateTime answeredAt;               // 답변 일시

    @CreationTimestamp
    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;                // 등록 일시 (자동)

    @UpdateTimestamp
    @Column(name = "UPDATED_AT", nullable = false)
    private LocalDateTime updatedAt;                // 수정 일시 (자동)

    // ==================================================================================
    // 비즈니스 메서드 — Setter 대신 의미있는 메서드로 상태 변경
    // ==================================================================================

    /*
     관리자 답변 등록
     답변 내용 저장과 동시에 상태를 "답변완료"로 변경
    */
    public void answer(String answerContent, String answeredBy) {
        this.answerContent = answerContent;
        this.answeredBy = answeredBy;
        this.answeredAt = LocalDateTime.now();
        this.status = "답변완료";
    }
    public void update(String type, String title, String content) {
        this.type = type;
        this.title = title;
        this.content = content;
    }
}