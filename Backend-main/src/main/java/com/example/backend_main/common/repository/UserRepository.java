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

    // 7. S99 상태가 아닌 유저들만 조회하기
    List<User> findAllByStatusCodeNot(String statusCode);

    // 8. 이메일 해시값으로 유저 찾기 (보안 검색용)
    Optional<User> findByEmailHash(String emailHash);

    // 9. 계정 찾기용 조회
    Optional<User> findByUserNmAndPhoneHash(String userNm, String phoneHash);

    Optional<User> findByUserIdAndUserNmAndPhoneHashAndEmailHash(String userId, String userNm, String phoneHash, String emailHash);

    // ==================================================================================
    // 📊 대시보드 통계용 쿼리 (성능 최적화)
    // ==================================================================================

    // 10. 기간별 가입자 수 (오늘/어제 비교용)
    long countByJoinDtBetween(LocalDateTime start, LocalDateTime end);

    // 11. 특정 상태 회원 수 (변호사 승인 대기: S02)
    long countByStatusCode(String statusCode);

    // 12. 일별 가입자 통계 (차트용)
    @Query(value = "SELECT TO_CHAR(JOIN_DT, 'YYYY-MM-DD') as \"date\", COUNT(*) as \"count\" " +
            "FROM TB_USER " +
            "WHERE JOIN_DT >= :sevenDaysAgo " +
            "GROUP BY TO_CHAR(JOIN_DT, 'YYYY-MM-DD')", nativeQuery = true)
    List<Map<String, Object>> findDailySignupStats(@Param("sevenDaysAgo") LocalDateTime sevenDaysAgo);
}