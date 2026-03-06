package com.example.backend_main.common.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "BLACKLIST_IP")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class BlacklistIp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "BL_NO")
    private Long blNo;

    @Column(name = "IP_ADDRESS", nullable = false, unique = true, length = 50)
    private String ipAddress; // 차단할 IP

    @Column(name = "REASON", length = 200)
    private String reason; // 차단 사유 (디도스, 욕설 등)

    @Column(name = "REG_DT")
    private LocalDateTime regDt; // 차단 일시
}