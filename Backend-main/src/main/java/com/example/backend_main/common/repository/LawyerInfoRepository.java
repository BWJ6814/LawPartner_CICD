package com.example.backend_main.common.repository;

import com.example.backend_main.common.entity.LawyerInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LawyerInfoRepository extends JpaRepository<LawyerInfo, Long> {
    // JpaRepository를 상속받는 순간 save() 메서드는 자동으로 생성됩니다!
}