package com.example.backend_main.common.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "TB_LAWYER_SPECIALTY")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class LawyerSpecialty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SPECIALTY_ID")
    private Long specialtyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER_NO")
    private LawyerInfo lawyerInfo; // 변호사 정보와 연결

    @Column(name = "FIELD_CODE", nullable = false, length = 20)
    private String fieldCode; // L01, L02 등 (공통 코드 활용)
}