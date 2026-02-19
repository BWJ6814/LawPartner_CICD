package com.example.backend_main.KY.repository;

import com.example.backend_main.KY.entity.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// PK 가 String(UUID) 으로 변경됨
public interface ConsultationRepository extends JpaRepository<Consultation, String> {

    // 특정 변호사의 상담 목록 (최신순)
    List<Consultation> findByLawyerNoOrderByRegDtDesc(Long lawyerNo);

    // 특정 변호사의 전체 상담 건수
    long countByLawyerNo(Long lawyerNo);

    // 특정 변호사의 진행 상태별 건수 (stats 용)
    long countByLawyerNoAndProgressCode(Long lawyerNo, String progressCode);
}
