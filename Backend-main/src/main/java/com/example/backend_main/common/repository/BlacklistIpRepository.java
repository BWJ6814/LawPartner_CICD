package com.example.backend_main.common.repository;

import com.example.backend_main.common.entity.BlacklistIp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BlacklistIpRepository extends JpaRepository<BlacklistIp, Long> {
    // 해당 IP가 블랙리스트에 존재하는지 (차단 대상인지) 0.001초 만에 확인하는 쿼리
    boolean existsByIpAddress(String ipAddress);

    // IP 주소로 엔티티 찾기 (나중에 차단 해제할 때 사용)
    Optional<BlacklistIp> findByIpAddress(String ipAddress);
}