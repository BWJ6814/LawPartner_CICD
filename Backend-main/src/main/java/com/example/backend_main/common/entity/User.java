package com.example.backend_main.common.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/*
DTO : 택배 배달원 - 데이터를 주고받기 위해 잠시 담아두는 바구니
    리엑트(Front)와 스프링(Back) 사이를 이동!
Entity : 실제 시민 - 실제 DB 테이블과 연결된 데이터의 본체
    오직 백엔드와 DB 사이에서만 활동..!

    [User Entity]
  TB_USER 테이블과 매핑되는 클래스 ~_~
  회원가입 시 개인정보 암호화(AES-256) 및 비밀번호 해싱(BCrypt)이 적용된 데이터가 저장 !_!

1. @Entity
해당 클래스는 DB 테이블과 1:! 매핑되는 실제 데이터!

2. @Table(name = "테이블명")
실제 DB에 있는 테이블의 이름을 정확히 지정하기

3. @Getter
자바에서 데이터를 가져올 때 쓰는 get메서드와 동일하게 처리해주는 룸북의 어노테이션

4. @Builder
객체를 생설할 때, 빌더 패턴을 사용하게 처리
new User()..이 아닌 User.builder().userId("hong").build()식으로 가독성 좋게 데이터를 채울 수 있당

    [중요]
5. @NoArgsConstructor(access = AccessLevel.PROTECTED)
JPA는 내부적으로 기본 생성자(파라미터가 없는 생성자)를 꼭 필요로 합니다.
PROTECTED : 기본 생성자를 PUBLIC로 열어두게 되면, 누군가 실수로 데이터가 하나도 없는 빈 객체를 만들 수 있다..!
이를 위해 JPA 너만 이 생성자를 쓰고, 일반 개발자들은 함부로 빈 객체를 만들지 마라..!! 라고 입구를 좁힌 보안 장치

@AllArgsConstructor
모든 필드를 다 받는 생성자를 자동으로 만들어줍니다
@Builder 어노테이션이 정상적으로 작동하려면, 이 모든 필드 생성자가 내부적으로 필요하기 때문에 세트로 붙여줌..!

*/
@Entity
@Table(name = "TB_USER")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "USER_NO")
    private Long userNo; // 내부 관리 번호 (PK)

    @Column(name = "USER_ID", nullable = false, unique = true, length = 50)
    private String userId; // 로그인 아이디

    @Column(name = "USER_PW", nullable = false, length = 256)
    // 비밀번호 (BCrypt 암호화)
    // length = 256 : 암호화된 데이터이기 때문에 길어짐.. 아래 동일
    private String userPw;

    @Column(name = "USER_NM", nullable = false, length = 50)
    private String userNm; // 실명

    @Column(name = "NICK_NM", length = 50)
    private String nickNm; // 닉네임

    @Column(name = "EMAIL", nullable = false, length = 256)
    private String email; // 이메일 (AES-256 암호화)

    @Column(name = "PHONE", nullable = false, length = 256)
    private String phone; // 전화번호 (AES-256 암호화)

    @Column(name = "ADDR", length = 200)
    private String addr; // 주소

    @Column(name = "ROLE_CODE", length = 20)
    @Builder.Default
    private String roleCode = "ROLE_USER"; // 권한 (ROLE_USER, ROLE_LAWYER, ROLE_ADMIN)

    @Column(name = "STATUS_CODE", length = 20)
    @Builder.Default
    private String statusCode = "S01"; // 상태 (S01:정상, S99:탈퇴 등)

    @Column(name = "FAIL_CNT")
    @Builder.Default
    private Integer failCnt = 0; // 로그인 실패 횟수

    @Column(name = "LOCK_DT")
    private LocalDateTime lockDt; // 계정 잠금 시작 시간

    @Column(name = "JOIN_DT", updatable = false)
    private LocalDateTime joinDt; // 가입 일시

    // 가입 일시를 저장 직전에 자동으로 넣어주는 설정
    // @PrePersist : 자동화 비서 ( Pre:전 + Persist(영구 저장) )
    // ==> 자바 객체를 DB라는 금고에 집어넣기(INSET) 바로 직전에 해당 작업을 하고 넣으라는 명령!
    @PrePersist
    public void prePersist() {
        // LocalDateTime.now() : 지금 바로 이 순간..!
        this.joinDt = LocalDateTime.now();
    }

    // User 엔티티 내부에 추가할 부분
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private LawyerInfo lawyerInfo;

    // 변호사인지 확인하는 편의 메서드
    public boolean isLawyer() {
        return "ROLE_LAWYER".equals(this.roleCode);

    }
}