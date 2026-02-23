package com.example.backend_main.common.repository;

import com.example.backend_main.common.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, String> {
    // 팩트: 내가 의뢰인인 방 또는 내가 변호사인 방 다 가져와라!
    List<ChatRoom> findByUserNoOrLawyerNoOrderByRegDtDesc(Long userNo, Long lawyerNo);

    List<ChatRoom> findByUserNo(Long userNo);

    List<ChatRoom> findByLawyerNoAndProgressCode(Long lawyerNo, String progressCode);
}