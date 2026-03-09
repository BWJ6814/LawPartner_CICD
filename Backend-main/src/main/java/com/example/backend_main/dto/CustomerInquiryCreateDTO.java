package com.example.backend_main.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomerInquiryCreateDTO {
    private String type;
    private String title;
    private String content;
}