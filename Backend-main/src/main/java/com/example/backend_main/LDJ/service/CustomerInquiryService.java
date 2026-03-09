package com.example.backend_main.LDJ.service;

import com.example.backend_main.common.entity.CustomerInquiry;
import com.example.backend_main.common.repository.CustomerInquiryRepository;
import com.example.backend_main.common.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerInquiryService {

    private final CustomerInquiryRepository customerInquiryRepository;

    public List<CustomerInquiry> getMyInquiries() {
        Long currentUserNo = getCurrentUserNo();
        return customerInquiryRepository.findByWriterNoOrderByIdDesc(currentUserNo);
    }

    public CustomerInquiry getInquiryById(Long id) {
        return customerInquiryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("해당 문의를 찾을 수 없습니다. id=" + id));
    }

    public CustomerInquiry createInquiry(String type, String title, String content) {
        Long currentUserNo = getCurrentUserNo();

        CustomerInquiry inquiry = CustomerInquiry.builder()
                .writerNo(currentUserNo)
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

        Long currentUserNo = getCurrentUserNo();
        if (!inquiry.getWriterNo().equals(currentUserNo)) {
            throw new RuntimeException("본인 문의만 수정할 수 있습니다.");
        }

        inquiry.setType(type);
        inquiry.setTitle(title);
        inquiry.setContent(content);
        inquiry.setUpdatedAt(LocalDateTime.now());

        return customerInquiryRepository.save(inquiry);
    }

    public void deleteInquiry(Long id) {
        CustomerInquiry inquiry = customerInquiryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("해당 문의를 찾을 수 없습니다. id=" + id));

        Long currentUserNo = getCurrentUserNo();
        if (!inquiry.getWriterNo().equals(currentUserNo)) {
            throw new RuntimeException("본인 문의만 삭제할 수 있습니다.");
        }

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

    private Long getCurrentUserNo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getPrincipal() == null) {
            throw new RuntimeException("로그인 정보가 없습니다.");
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof CustomUserDetails userDetails) {
            return userDetails.getUserNo();
        }

        throw new RuntimeException("현재 사용자 번호를 찾을 수 없습니다.");
    }
}