package com.example.backend_main.common.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;


/*
@Entity : DB 테이블과 연결된 실제 데이터임을 선언
@Builder : 가독성 좋게 객체를 생설할 수 있게 도와주는 도구
@NoArgsConstructor(...) : 파라미터가 없는 기본 생성자 만들기
AccessLevel.PROTECTED : JPA만 이 생성자를 쓰게 입구를 좁힌 보안 장치
@AllArgsConstructor : 모든 필드를 다 받는 생성자를 만들기 - @Build가 작동하기 위해 내부적으로 필요
*/
@Entity
@Table(name = "TB_ACCESS_LOG")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class AccessLog {


    // @Id : 해당 필드가 테이블의 주인공 PK임을 뜻합니다.
    // @GeneratedValue : 번호를 직점 처리하지 않고, DB가 1,2,3... 순서대로 자동으로 채워줌 (Auto Increment)
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "LOG_NO")
    private Long logNo; // 로그인 일련 번호

    @Column(name = "USER_ID", length = 50)
    private String userId; // 누가 (로그인한 아이디 또는 이메일)

    // 호출된 자바 메서드 이름..! 어떤 기능을 사용했는지 저장
    @Column(name = "METHOD_NM", length = 100)
    private String methodNm; // 어떤 기능을 (호출한 메서드 이름)

    // 접속한 주소(URL)로, /api/admin/users 같은 경로를 저장..!
    @Column(name = "REQUEST_URI", length = 200)
    private String requestUri; // 어디서 (API 주소)
    
    // 접속한 사람의 컴퓨터 주소(IP), 어디서 접속하고 추척했는지에 사용
    @Column(name = "REMOTE_IP", length = 50)
    private String remoteIp; // 어떤 컴퓨터로 (접속한 IP 주소)
    
    // 접속한 일자 처리..!
    // updatable = false : 한 번 저장되면 [절대] 수정할 수 없다는 뜻!
    @Column(name = "ACCESS_DT", updatable = false)
    private LocalDateTime accessDt; // 언제 (접속 시간)

    @PrePersist
    public void prePersist() {
        this.accessDt = LocalDateTime.now(); // 기록되는 순간의 시간을 자동으로 입력!
    }
}
