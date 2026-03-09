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

    public CustomerInquiry getInquiryById(Long id) {
        return customerInquiryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("해당 문의를 찾을 수 없습니다. id=" + id));
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

    public CustomerInquiry updateInquiry(Long id, String type, String title, String content) {
        CustomerInquiry inquiry = customerInquiryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("해당 문의를 찾을 수 없습니다. id=" + id));

        inquiry.setType(type);
        inquiry.setTitle(title);
        inquiry.setContent(content);
        inquiry.setUpdatedAt(LocalDateTime.now());

        return customerInquiryRepository.save(inquiry);
    }

    public void deleteInquiry(Long id) {
        CustomerInquiry inquiry = customerInquiryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("해당 문의를 찾을 수 없습니다. id=" + id));

        customerInquiryRepository.delete(inquiry);
    }

    public CustomerInquiry answerInquiry(Long id, String answerContent, String answeredBy) {
        CustomerInquiry inquiry = customerInquiryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("해당 문의를 찾을 수 없습니다. id=" + id));

        inquiry.setAnswerContent(answerContent);
        inquiry.setAnsweredBy(answeredBy);
        inquiry.setAnsweredAt(LocalDateTime.now());
        inquiry.setStatus("답변완료");
        inquiry.setUpdatedAt(LocalDateTime.now());

        return customerInquiryRepository.save(inquiry);
    }
}