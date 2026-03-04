package com.example.backend_main.KY.controller;

import com.example.backend_main.KY.dto.PaymentVerifyRequestDTO;
import com.example.backend_main.KY.service.PaymentService;
import com.example.backend_main.common.security.CustomUserDetails;
import com.example.backend_main.common.vo.ResultVO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /*
     결제 검증 API
     POST /api/payment/verify
     프론트에서 paymentId 를 받아 포트원 서버에 직접 확인 후 DB 저장
    */
    @PostMapping("/verify")
    public ResponseEntity<ResultVO<?>> verifyPayment(
            @RequestBody PaymentVerifyRequestDTO request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            paymentService.verifyAndSave(request.getPaymentId(), userDetails.getUserNo());
            return ResponseEntity.ok(ResultVO.ok("결제 검증 완료", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResultVO.fail("PAY-ERR", e.getMessage()));
        }
    }
}