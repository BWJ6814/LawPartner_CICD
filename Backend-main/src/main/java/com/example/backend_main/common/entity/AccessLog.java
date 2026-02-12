package com.example.backend_main.common.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "TB_ACCESS_LOG")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class AccessLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "LOG_NO")
    private Long logNo; // 일련번호 (PK)

    @Column(name = "TRACE_ID", length = 50)
    private String traceId; // [핵심] 서버 로그와 DB 로그를 잇는 추적 ID (UUID)

    @Column(name = "REQ_IP", length = 50)
    private String reqIp; // 접속 IP (기존 remoteIp에서 변경)

    @Column(name = "REQ_URI", length = 200)
    private String reqUri; // 접속 주소 (기존 requestUri에서 변경)

    @Column(name = "USER_AGENT", length = 200)
    private String userAgent; // 접속 환경 (브라우저, 기기 정보)

    @Column(name = "USER_NO")
    private Long userNo; // 회원 식별 번호 (FK 미연결, 성능 최적화)

    @Column(name = "REG_DT", updatable = false)
    private LocalDateTime regDt; // 등록 일시 (기존 accessDt에서 변경)

    @PrePersist
    public void prePersist() {
        this.regDt = LocalDateTime.now(); // 저장 시 현재 시간 자동 입력
    }
}