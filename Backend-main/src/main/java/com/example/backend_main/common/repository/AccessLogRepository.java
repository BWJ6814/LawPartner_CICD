package com.example.backend_main.common.repository;


import com.example.backend_main.common.entity.AccessLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;

/*
[AccessLogRepository]
보안 로그 데이터를 DB에 저장하기 위한 레포지토리!
*/
@Repository
public interface AccessLogRepository extends JpaRepository<AccessLog, Long>, JpaSpecificationExecutor<AccessLog>{

    @Query("SELECT a FROM AccessLog a WHERE (a.statusCode >= 400 OR a.errorMsg IS NOT NULL) ORDER BY a.regDt DESC")
    List<AccessLog> findRecentThreats(Pageable pageable);

    @Query("SELECT a FROM AccessLog a WHERE (a.statusCode >= 400 OR a.errorMsg IS NOT NULL) ORDER BY a.regDt DESC")
    Page<AccessLog> findThreatAccessLogs(Pageable pageable);

    // 일별 방문 차트: AdminService에서 JdbcTemplate으로 조회 (JPA 네이티브 반환 이슈 회피)

    // ==================================================================================
    // 📊 대시보드 통계용 쿼리 (성능 최적화)
    // ==================================================================================

    // 1. 기간별 순수 방문자 수 (IP 중복 제거)
    @Query("SELECT COUNT(DISTINCT a.reqIp) FROM AccessLog a WHERE a.regDt BETWEEN :start AND :end")
    long countDistinctIpByRegDtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // 2. 기간별 보안 위협 수 (HTTP 오류 또는 컨트롤러 예외 메시지가 남은 접근)
    @Query("SELECT COUNT(a) FROM AccessLog a WHERE (a.statusCode >= 400 OR a.errorMsg IS NOT NULL) AND a.regDt BETWEEN :start AND :end")
    long countThreatsByRegDtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}