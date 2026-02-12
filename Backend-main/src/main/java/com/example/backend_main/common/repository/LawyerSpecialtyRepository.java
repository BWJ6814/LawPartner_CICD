package com.example.backend_main.common.repository;

import com.example.backend_main.common.entity.LawyerSpecialty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LawyerSpecialtyRepository extends JpaRepository<LawyerSpecialty, Long> {
    // saveAll() 상속을 통해 자동으로 사용할 수 있게 됩니다.
}