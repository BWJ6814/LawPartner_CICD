package com.example.backend_main.KY.repository;

import com.example.backend_main.KY.entity.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConsultationRepository extends JpaRepository<Consultation, Long> {

    // 특정 변호사의 상담 목록 (최신순)
    List<Consultation> findByLawyerNoOrderByRegDtDesc(Long lawyerNo);

    // 특정 변호사의 상담 목록 (상태별)
    List<Consultation> findByLawyerNoAndStatusCodeOrderByRegDtDesc(Long lawyerNo, String statusCode);

    // 특정 변호사의 상담 개수
    long countByLawyerNo(Long lawyerNo);
}
