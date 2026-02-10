package com.example.backend_main.common.repository;

import com.example.backend_main.common.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/*
[UserRepository]
TB_USER 테이블에 접근하여 데이터를 넣고 빼는 역할을 하는 클래스
JpaRepository를 상속받아 기본적인 CRUD 기능을 자동으로 가지도록 처리!
*/
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // 1. 아이디로 회원 찾기 (로그인 및 관리자 조회용)
    // Optional은 결과가 없을 때 null 대신 안전하게 처리하기 위한 바구니입니다.
    Optional<User> findByUserId(String userId);

    // 2. 이메일로 회원 찾기 (아이디/비번 찾기용)
    Optional<User> findByEmail(String email);

    // 3. 아이디 중복 확인 (회원가입 USR-01 대응)
    boolean existsByUserId(String userId);

    // 4. 이메일 중복 확인 (회원가입 USR-01 대응)
    boolean existsByEmail(String email);

    // 5. 권한별 회원 목록 조회 (관리자 기능 ADM-02 대응 예정)
    // 나중에 관리자 페이지에서 "변호사만 보기", "일반인만 보기"를 위해 쓰입니다.
    // List<User> findByRoleCode(String roleCode);

}
