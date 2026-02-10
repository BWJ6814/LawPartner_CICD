package com.example.backend_main.common.repository;


import com.example.backend_main.common.entity.AccessLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/*
[AccessLogRepository]
보안 로그 데이터를 DB에 저장하기 위한 레포지토리!

@Repository : 해당 인터페이스가 DB에 접근한느 창고 관리자임을 스프링에게 명시

extends JpaRepository<AccessLog, Long> : 스프링이 제공하는 만능 관리자를 상속받기!

<AccessLog, Long> : AccessLog 엔티티를 관리할 것이며, 그 주인공(PK)의 자료형은 Long
*/
@Repository
public interface AccessLogRepository extends JpaRepository<AccessLog, Long>{
    /*
    - 기본 저장 기능(save)을 사용하므로 비워도 오케이!
    - 인터페이스 하나로 처리가 가능한 이유?
    : JpaRepository를 상속받는 순간, 코드 한 줄도 안 짜도 스프링이 내부적으로
        1. save() : 저장
        2. findAll() : 조회
        3. delete() : 삭제
        1~3번같은 SQL 기능을 모두 만들어주기 때문에!!

    */

}
