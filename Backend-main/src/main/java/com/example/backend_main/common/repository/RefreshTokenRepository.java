package com.example.backend_main.common.repository;

import com.example.backend_main.common.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    // 유저 번호로 기존 토큰이 있는지 찾는 기능
    Optional<RefreshToken> findByUserNo(Long userNo);
}