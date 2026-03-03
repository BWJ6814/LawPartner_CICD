package com.example.backend_main.common.repository;

import com.example.backend_main.common.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
}