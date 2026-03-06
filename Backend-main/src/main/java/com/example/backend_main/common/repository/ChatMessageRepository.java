package com.example.backend_main.common.repository;

import com.example.backend_main.common.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    // 특정 채팅방의 메시지 내역을 시간순으로 조회
    List<ChatMessage> findByRoomIdOrderBySendDtAsc(String roomId);

    java.util.Optional<ChatMessage> findTopByRoomIdOrderBySendDtDesc(String roomId);
}