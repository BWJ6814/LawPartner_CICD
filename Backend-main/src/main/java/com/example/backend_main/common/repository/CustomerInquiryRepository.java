package com.example.backend_main.common.repository;

import com.example.backend_main.common.entity.CustomerInquiry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerInquiryRepository extends JpaRepository<CustomerInquiry, Long> {

    List<CustomerInquiry> findByWriterNoOrderByIdDesc(Long writerNo);
}