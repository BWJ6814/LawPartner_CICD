package com.example.backend_main.LDJ.controller;

import com.example.backend_main.LDJ.service.CustomerInquiryService;
import com.example.backend_main.common.entity.CustomerInquiry;
import com.example.backend_main.dto.CustomerInquiryCreateDTO;
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

    @PostMapping
    public CustomerInquiry createInquiry(@RequestBody CustomerInquiryCreateDTO request) {
        return customerInquiryService.createInquiry(
                request.getType(),
                request.getTitle(),
                request.getContent()
        );
    }
}