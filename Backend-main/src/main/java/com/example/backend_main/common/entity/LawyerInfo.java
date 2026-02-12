package com.example.backend_main.common.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "TB_LAWYER_INFO")
@Getter
@Setter
@Builder
// JPA 전용 입구는 열어두되, 동료 개발자의 실수는 막는다..!
// JPA는 DB에서 데이터를 가져와 객체를 만들 때, 기본 생성자를 반드시 사용!!
// PROTECTED는 pulbic로 열어두게 되면, 누군가 코딩하다 new LawyerInfo()처럼 속성이 빈 가짜 객체를 만들 위험이 있음
// 따라서 JPA 너만 쓰고, 일반 개발자는 함부로 빈 객체를 만들지 못함!
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class LawyerInfo {

    @Id
    @Column(name = "USER_NO")
    private Long userNo; // User의 PK를 그대로 가져와 PK이자 FK로 사용

    // @OneToOne(fetch = FetchType.LAZY) : 변호사 정보를 조회할 때, 당장 필요업는 유저 정보까지 한번에 가져오지 않기..
    @OneToOne(fetch = FetchType.LAZY)
    @MapsId // userNo 필드를 User 엔티티의 ID와 매핑 - ID값을 그대로 가져와서 LawyerInfo의 ID로 매핑
    @JoinColumn(name = "USER_NO")   // DB 테이블상에서 연결고리가 될 컬럼명
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

    // ★ [추가] 전문 분야를 콤마(,)로 구분해 저장할 컬럼
    @Column(name = "SPECIALTY_STR", length = 1000)
    private String specialtyStr;

    @Column(name = "IMG_URL", length = 500)
    private String imgUrl;

    @Column(name = "APPROVAL_YN", length = 1)
    @Builder.Default
    private String approvalYn = "N";

    @Column(name = "SUB_EXPIRE_DT")
    private LocalDateTime subExpireDt;
}