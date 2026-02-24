package com.example.backend_main.BWJ;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.backend_main.dto.AiChatLog;

public interface AiChatLogRepository extends JpaRepository<AiChatLog,Long> {

}
