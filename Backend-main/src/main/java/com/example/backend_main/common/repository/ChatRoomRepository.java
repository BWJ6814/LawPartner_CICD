package com.example.backend_main.common.repository;

import com.example.backend_main.common.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
// ★ JpaRepository<ChatRoom, Long> 에서 JpaRepository<ChatRoom, String> 으로 변경
public interface ChatRoomRepository extends JpaRepository<ChatRoom, String> {
    // 팩트: 내가 의뢰인인 방 또는 내가 변호사인 방 다 가져와라!
    List<ChatRoom> findByUserNoOrLawyerNoOrderByRegDtDesc(Long userNo, Long lawyerNo);

    List<ChatRoom> findByLawyerNoAndProgressCode(Long lawyerNo, String progressCode);

    List<ChatRoom> findByUserNoAndProgressCode(Long userNo, String progressCode);

    List<ChatRoom> findByUserNoOrderByRegDtDesc(Long userNo);

    // 변호사용: 나한테 온 대기(ST01) 중인 상담 요청 개수
    int countByLawyerNoAndProgressCode(Long lawyerNo, String progressCode);

    // 일반인용: 내가 신청한 것 중 수락(ST02)된 상담 개수
    int countByUserNoAndProgressCode(Long userNo, String progressCode);
}