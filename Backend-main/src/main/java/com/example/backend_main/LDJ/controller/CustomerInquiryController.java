package com.example.backend_main.LDJ.controller;

import com.example.backend_main.LDJ.service.CustomerInquiryService;
import com.example.backend_main.common.entity.CustomerInquiry;
import com.example.backend_main.common.vo.ResultVO;
import com.example.backend_main.dto.CustomerInquiryDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/customer/inquiries")
public class CustomerInquiryController {

    private final CustomerInquiryService customerInquiryService;

    @GetMapping
    public List<CustomerInquiry> getMyInquiries() {
        return customerInquiryService.getMyInquiries();
    }

    @GetMapping("/{id}")
    public CustomerInquiry getInquiryById(@PathVariable Long id) {
        return customerInquiryService.getInquiryById(id);
    }

    /**
     * [사용자용 문의 등록]
     * [변경 사항]: ResultVO 적용 및 @Valid를 통한 입력값 검증 추가
     */
    @PostMapping
    public ResultVO<CustomerInquiry> createInquiry(
            @Valid @RequestBody CustomerInquiryDTO.CreateRequest request) {

        // 서비스 호출 (우리가 리팩토링한 LDJ의 CustomerInquiryService 사용)
        CustomerInquiry created = customerInquiryService.createInquiry(
                request.getType(),
                request.getTitle(),
                request.getContent()
        );

        return ResultVO.ok("문의가 성공적으로 등록되었습니다.", created);
    }

    /**
     * [사용자용 문의 수정]
     * [변경 사항]: 일관된 응답 형식을 위해 ResultVO 사용
     */
    @PutMapping("/{id}")
    public ResultVO<CustomerInquiry> updateInquiry(
            @PathVariable Long id,
            @Valid @RequestBody CustomerInquiryDTO.CreateRequest request
    ) {
        CustomerInquiry updated = customerInquiryService.updateInquiry(
                id,
                request.getType(),
                request.getTitle(),
                request.getContent()
        );

        return ResultVO.ok("문의 내용이 수정되었습니다.", updated);
    }
}