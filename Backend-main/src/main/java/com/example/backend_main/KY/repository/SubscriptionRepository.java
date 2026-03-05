package com.example.backend_main.KY.repository;

import com.example.backend_main.KY.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    // 같은 paymentId로 중복 결제 처리 방지
    boolean existsByPaymentId(String paymentId);
}