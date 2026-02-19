package com.example.backend_main.KY.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/*
 [Consultation Entity]
 TB_CHAT_ROOM 테이블과 매핑
 PROGRESS_CODE: CASE_STEP 공통코드 (ST01~ST05)
 STATUS_CODE  : OPEN / CLOSED
*/
@Entity
@Table(name = "TB_CHAT_ROOM")
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class Consultation {

    @Id
    @Column(name = "ROOM_ID", length = 50)
    private String roomId;           // UUID (PK)

    @Column(name = "USER_NO", nullable = false)
    private Long userNo;             // 의뢰인 유저 번호

    @Column(name = "LAWYER_NO", nullable = false)
    private Long lawyerNo;           // 변호사 유저 번호

    @Column(name = "STATUS_CODE", length = 20)
    @Builder.Default
    private String statusCode = "OPEN";   // OPEN / CLOSED

    @Column(name = "PROGRESS_CODE", length = 20)
    @Builder.Default
    private String progressCode = "ST01"; // ST01~ST05 (CASE_STEP 공통코드)

    @Column(name = "REG_DT", updatable = false)
    private LocalDateTime regDt;

    @PrePersist
    public void prePersist() {
        if (this.regDt == null) this.regDt = LocalDateTime.now();
    }
}
