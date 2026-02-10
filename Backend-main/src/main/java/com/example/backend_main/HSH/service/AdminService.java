package com.example.backend_main.HSH.service;

import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.common.util.CryptoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;    // DB 전문가
    private final CryptoUtil cryptoUtil;            // 해독 전문가

    // 모든 회원 목록을 가져오는 함수 정의하기
    // List<User> : 여러 명의 유저 정보를 리스트 형태의 묶음으로 반환처리..
    public List<User> getAllUsers() {

        // userRepository.findAll() : DB의 TB_USER 테이블에 있는 모든 데이터를 싹 긁어오기
        // .stream() : 글겅온 데이터 뭉치를 한 명씩 차례대로 처리할 수 있는 [흐름] 상태로 만들기
        return userRepository.findAll().stream()
                // .map(user -> {...} ) : 흐름 속의 유저 한 명(user)을 꺼내서 원하는 모양으로 변신시키기
                .map(user -> {
                    try {
                        // 관리자가 볼 수 있게 이메일과 전화번호 복호화
                        // cryptoUtil.decrypt(...) : DB에 잠겨있던 이메일과 전화번호를 해독기에 넣어서
                        // 읽을 수 있는 글자로 변환!
                        String decryptedEmail = cryptoUtil.decrypt(user.getEmail());
                        String decryptedPhone = cryptoUtil.decrypt(user.getPhone());

                        // 복호화된 정보를 담은 새로운 객체 생성 (보안상 DTO 변환 추천)
                        // User.builder() : 해독된 정보를 새로 담아서 [조립] 하기
                        // 원래 데이터는 그대로 두고, 관리자 화면에 보여줄 '깨끗한 데이터'를 새로 만드는 과정
                        return User.builder()
                                .userNo(user.getUserNo())           // 번호 그대로
                                .userId(user.getUserId())           // 아이디 그대로
                                .userNm(user.getUserNm())           // 이름 그대로
                                .email(decryptedEmail)              // [중요] 해독된 이메일
                                .phone(decryptedPhone)              // [중요] 해독된 휴대폰 번호
                                .roleCode(user.getRoleCode())       // 권한 코드 그대로
                                .statusCode(user.getStatusCode())   // 계정 상태 그대로
                                .joinDt(user.getJoinDt())           // 회원 가입 날짜 그대로
                                .build();                           // 조립 완료..!
                    } catch (Exception e) {
                        // 실패 시 암호화된 상태로 반환
                        // catch : 혹시라도 해독 중에 에러가 나면 프로그램이 멈추지 않게 방어하기..!
                        // 에러가 나면 그냥 원래의(암호화된) 유저 정보를 그대로 보내주기
                        return user;
                    }
                })
                // .collect(Collectors.toList()) : 한 명씩 변신시킨 유저들을 다시 하나의 리스트로 예쁘게 모으기
                .collect(Collectors.toList());
    }
}
