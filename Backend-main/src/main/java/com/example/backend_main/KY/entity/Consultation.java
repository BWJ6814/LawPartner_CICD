package com.example.backend_main.KY.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/*
 [Consultation Entity]
 TB_CONSULTATION 테이블과 1:1로 매핑
 의뢰인이 변호사에게 요청한 상담 내역
*/
@Entity
@Table(name = "TB_CONSULTATION")
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class Consultation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "CONSULT_NO")
    private Long consultNo; // 상담 번호 (PK)

    @Column(name = "LAWYER_NO", nullable = false)
    private Long lawyerNo; // 변호사 유저 번호 (FK)

    @Column(name = "CLIENT_NO", nullable = false)
    private Long clientNo; // 의뢰인 유저 번호 (FK)

    @Column(name = "CLIENT_NM", nullable = false, length = 50)
    private String clientNm; // 의뢰인 이름

    @Column(name = "CATEGORY", length = 50)
    private String category; // 상담 카테고리 (교통사고, 이혼/가사, 형사 등)

    @Column(name = "STATUS_CODE", length = 20)
    @Builder.Default
    private String statusCode = "C01"; // 상태 (C01:대기, C02:상담중, C03:소송진행중, C04:완료)

    @Column(name = "CONTENT", length = 4000)
    private String content; // 상담 내용 요약

    @Column(name = "REG_DT", updatable = false)
    private LocalDateTime regDt; // 접수 일시

    @PrePersist
    public void prePersist() {
        this.regDt = LocalDateTime.now();
    }
}
