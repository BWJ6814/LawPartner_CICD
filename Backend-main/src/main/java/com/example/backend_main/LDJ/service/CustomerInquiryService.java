package com.example.backend_main.LDJ.service;

import com.example.backend_main.common.entity.CustomerInquiry;
import com.example.backend_main.common.repository.CustomerInquiryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerInquiryService {

    private final CustomerInquiryRepository customerInquiryRepository;

    public List<CustomerInquiry> getAllInquiries() {
        return customerInquiryRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }

    public CustomerInquiry createInquiry(String type, String title, String content) {
        CustomerInquiry inquiry = CustomerInquiry.builder()
                .type(type)
                .title(title)
                .content(content)
                .status("대기")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return customerInquiryRepository.save(inquiry);
    }
}