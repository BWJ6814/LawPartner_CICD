package com.example.backend_main.common.repository;


import com.example.backend_main.common.entity.AccessLog;
import com.example.backend_main.common.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;


/*
[AccessLogRepository]
보안 로그 데이터를 DB에 저장하기 위한 레포지토리!

@Repository : 해당 인터페이스가 DB에 접근한느 창고 관리자임을 스프링에게 명시

extends JpaRepository<AccessLog, Long> : 스프링이 제공하는 만능 관리자를 상속받기!
JpaRepository : 스프링 데이터 JPA가 미리 만들어둔 [만능 기술 교본]
상속(Inheritance) : 교본을 상속받는 순간, 코드 한 줄도 사용하지 않고 save()/findAll() 등 수십 가지 함수 사용 가능

<AccessLog, Long>
1) AccessLog : 이 레포지토리는 AccessLog 시민(Entity)만 전담하는 관리자 - AccessLog 클래스 가서 정보를 찾음!
            - @Entity로 DB와 연결된 Entity임을 확인..!
            - @Table(name = "TB_ACCESS_LOG")로 테이블 이름 확인!
2) Long : 해당 시민의 주민번호(PK)는 Long 타입이니, 참고해라
3) 결과 : 스프링은 해당 정보를 바탕으로 save()를 호출할 때, 어떤 테이블(TB_ACCESS_LOG)에 데이터를 넣어야 하는 것을
         이미 다 알고 있게 됨!

컴포넌트 스캔으로 서버를 켜주는 순간에 바로 일어납니다.
1) 전수 조사: 서버가 켜지면 스프링은 프로젝트의 모든 폴더를 샅샅이 뒤집니다.(스캔)
2) 매칭 : AccessLogRepository를 발견 - 주소록에 AccessLog 확인
3) 연결 : AccessLog 클래스로 가서 @Table에 적힌 TB_ACCESS_LOG라는 이름을 확인 후 내부적으로 연결고리 생성!



*/
@Repository
public interface AccessLogRepository extends JpaRepository<AccessLog, Long>, JpaSpecificationExecutor<AccessLog>{
    /*
    - 기본 저장 기능(save)을 사용하므로 비워도 오케이!
    - 인터페이스 하나로 처리가 가능한 이유?
    : JpaRepository를 상속받는 순간, 코드 한 줄도 안 짜도 스프링이 내부적으로
        1. save() : 저장
        2. findAll() : 조회
        3. delete() : 삭제
        1~3번같은 SQL 기능을 모두 만들어주기 때문에!!

    */
    // 상태 코드가 특정 값(예: 400) 이상인 최신 로그 5개만 조회
    List<AccessLog> findTop5ByStatusCodeGreaterThanEqualOrderByRegDtDesc(Integer statusCode);

    /*
     [상태 코드 필터링 조회]
     특정 상태 코드(statusCode) 이상의 로그들만 골라서 페이징 처리해 가져오는 함수입니다.
     - 예: statusCode에 400을 넣으면, 400번대(Client Error)와 500번대(Server Error) 로그만 추출합니다.
     - Pageable : 리액트에서 보낸 '몇 번째 페이지', '한 번에 몇 개' 등의 정보를 담고 있습니다.
     - Page<AccessLog> : 결과 데이터뿐만 아니라 '전체 페이지 수', '마지막 페이지 여부' 등을 상자에 담아 반환합니다.
    */
    Page<AccessLog> findByStatusCodeGreaterThanEqual(Integer statusCode, Pageable pageable);

    // [신규] 최근 7일간 일별 방문자 수 (API 호출 수)
    @Query(value = "SELECT TO_CHAR(REG_DT, 'YYYY-MM-DD') as \"date\", COUNT(*) as \"count\" " +
            "FROM TB_ACCESS_LOG " +
            "WHERE REG_DT >= :sevenDaysAgo " +
            "GROUP BY TO_CHAR(REG_DT, 'YYYY-MM-DD')", nativeQuery = true)
    List<Map<String, Object>> findDailyVisitorStats(@Param("sevenDaysAgo") LocalDateTime sevenDaysAgo);
}
