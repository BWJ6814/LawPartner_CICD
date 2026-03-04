package com.example.backend_main.KY.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PaymentVerifyRequestDTO {
    private String paymentId; // 프론트에서 받는 포트원 주문번호
}