package com.example.backend_main.common.repository;

import com.example.backend_main.common.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
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
    boolean existsByEmailHash(String emailHash);
    // 5. 번호 중복 확인
    boolean existsByPhoneHash(String phoneHash);

    // 6. 닉네임 중복 확인
    boolean existsByNickNm(String nickNm);

    // 7. 권한별 회원 목록 조회 (관리자 기능 ADM-02 대응 예정)
    // 나중에 관리자 페이지에서 "변호사만 보기", "일반인만 보기"를 위해 쓰입니다.
    // List<User> findByRoleCode(String roleCode);

    // 8. S99 상태가 아닌 유저들만 조회하기
    List<User> findAllByStatusCodeNot(String statusCode);

    // 이메일로 해당 객체 가져오기.
    Optional<User> findByEmailHash(String emailHash);
    //
    @Query(value = "SELECT TO_CHAR(JOIN_DT, 'YYYY-MM-DD') as \"date\", COUNT(*) as \"count\" " +
            "FROM TB_USER " +
            "WHERE JOIN_DT >= :sevenDaysAgo " +
            "GROUP BY TO_CHAR(JOIN_DT, 'YYYY-MM-DD')", nativeQuery = true)
    List<Map<String, Object>> findDailySignupStats(@Param("sevenDaysAgo") LocalDateTime sevenDaysAgo);
}
