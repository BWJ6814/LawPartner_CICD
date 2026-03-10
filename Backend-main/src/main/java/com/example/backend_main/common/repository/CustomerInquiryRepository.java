package com.example.backend_main.common.repository;

import com.example.backend_main.common.entity.CustomerInquiry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/*
 [CustomerInquiryRepository]
 - 관리자용: 전체 문의 조회 (상태별 필터링)
 - 사용자용: 내 문의 목록 조회
 - 기본 CRUD (findById, save, delete)는 JpaRepository가 제공
*/
public interface CustomerInquiryRepository extends JpaRepository<CustomerInquiry, Long> {

    // 관리자용 — 전체 문의 최신순 조회
    List<CustomerInquiry> findAllByOrderByCreatedAtDesc();

    // 관리자용 — 상태별 필터링 (대기 / 답변완료)
    List<CustomerInquiry> findByStatusOrderByCreatedAtDesc(String status);

    // 사용자용 — 내 문의 목록 최신순 조회
    List<CustomerInquiry> findByWriterNoOrderByCreatedAtDesc(Long writerNo);
}