package com.example.backend_main.common.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "TB_LAWYER_INFO")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class LawyerInfo {

    @Id
    @Column(name = "USER_NO")
    private Long userNo; // User의 PK를 그대로 가져와 PK이자 FK로 사용

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId // userNo 필드를 User 엔티티의 ID와 매핑
    @JoinColumn(name = "USER_NO")
    private User user;

    @Column(name = "LICENSE_FILE", nullable = false, length = 500)
    private String licenseFile;

    @Column(name = "LICENSE_NO", length = 100)
    private String licenseNo;

    @Column(name = "OFFICE_NAME", length = 100)
    private String officeName;

    @Column(name = "OFFICE_ADDR", length = 200)
    private String officeAddr;

    @Column(name = "EXAM_TYPE", length = 50)
    private String examType;

    @Column(name = "INTRO_TEXT", length = 4000)
    private String introText;

    @Column(name = "IMG_URL", length = 500)
    private String imgUrl;

    @Column(name = "APPROVAL_YN", length = 1)
    @Builder.Default
    private String approvalYn = "N";

    @Column(name = "SUB_EXPIRE_DT")
    private LocalDateTime subExpireDt;
}