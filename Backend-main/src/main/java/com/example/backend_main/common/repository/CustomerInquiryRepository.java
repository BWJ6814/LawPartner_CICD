package com.example.backend_main.common.repository;

import com.example.backend_main.common.entity.CustomerInquiry;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerInquiryRepository extends JpaRepository<CustomerInquiry, Long> {
}