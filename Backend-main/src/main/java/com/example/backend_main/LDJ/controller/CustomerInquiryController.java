package com.example.backend_main.LDJ.controller;

import com.example.backend_main.LDJ.service.CustomerInquiryService;
import com.example.backend_main.common.entity.CustomerInquiry;
import com.example.backend_main.dto.HSH_DTO.CustomerInquiryDTO;
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

    @PostMapping
    public CustomerInquiry createInquiry(@RequestBody CustomerInquiryDTO.CreateRequest request) {
        return customerInquiryService.createInquiry(
                request.getType(),
                request.getTitle(),
                request.getContent()
        );
    }

    @PutMapping("/{id}")
    public CustomerInquiry updateInquiry(
            @PathVariable Long id,
            @RequestBody CustomerInquiryDTO.CreateRequest request
    ) {
        return customerInquiryService.updateInquiry(
                id,
                request.getType(),
                request.getTitle(),
                request.getContent()
        );
    }

    @DeleteMapping("/{id}")
    public void deleteInquiry(@PathVariable Long id) {
        customerInquiryService.deleteInquiry(id);
    }
}