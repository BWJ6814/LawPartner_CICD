package com.example.backend_main.common.security;

import com.example.backend_main.dto.TokenDTO;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.stream.Collectors;

@Component
public class JwtTokenProvider {

    // 설정 파일 속에 숨겨둔 비밀번호를 가져와서 secretKey에 담기
    @Value("${jwt.secret}")
    private String secretKey;

    // 신분증의 유효기간을 정해두기..
    // long : 큰 숫자를 담는 자로형..! 밀리초 단위는 숫자가 매우 커지기 때문에 long 사용
    // Duration.ofMinutes(60) : 60분이라는 시간 간격을 만들기!
    // .toMillis() : 만든 시간의 단위를 밀리초(ms)로 변환시키기..
    private final long tokenValidityInMilliseconds = Duration.ofMinutes(60).toMillis();
    private SecretKey key;

    // @PostConstruct : 기계가 켜지자마자 아래 init 함수를 실행!
    @PostConstruct
    protected void init() {
        // 비밀번호 문자열을 가져와서 진짜 디지털 열쇠로 정교하게 깎기.
        this.key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }

    // 1. 신분증 발급 (생성)
    // TokenDTO라는 전용 상자에 담아서 반환시키기
    public TokenDTO createToken(Authentication authentication) {
        long now = (new Date()).getTime();

        // 1. Access Token 생성 (수명: 30분)
        String accessToken = Jwts.builder()
                .subject(authentication.getName())
                .claim("auth", "ROLE_USER") // 실제 권한 로직으로 대체 필요
                .expiration(new Date(now + 1800000)) // 30분
                .signWith(key)
                .compact();

        // 2. Refresh Token 생성 (수명: 14일)
        // DB나 보안 저장소에 보관하기..
        String refreshToken = Jwts.builder()
                // 14일
                .expiration(new Date(now + 1209600000))
                .signWith(key)
                .compact();

        return TokenDTO.builder()
                // 이 토큰은 Bearer(소지자) 방식의 인증 토큰이라고 리엑트에게 알려주는 꼬리표
                .grantType("Bearer")
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    // 2. 신분증 검사 (검증)
    public boolean validateToken(String token) {
        try {
            // Jwts.parser() : 신분증 해독기 가져오기
            Jwts.parser()
                    .verifyWith(key)                // 1. 해독기 가져오기
                    .build()                        // 2. 내 열쇠 꽂고
                    .parseSignedClaims(token);      // 3. 신분증 넣어보기!
            return true;                            // 통과!
        } catch (JwtException | IllegalArgumentException e) {
            // 문제가 생기면 거짓(false)을 반환해서 입구 컷!
            return false;
        }
    }

    // 3. 신분증 정보 읽기 (인증 객체 생성)
    public Authentication getAuthentication(String token) {
        Claims claims = Jwts.parser()       // 1. 해독기(parser)를 가져오기
                .verifyWith(key)            // 2. 비밀번호 열쇠 꽂기
                .build()                    // 3, 해독기를 완성(조립)하기
                .parseSignedClaims(token)   // 4. 손님의 신분증(token)을 넣고 돌려보기
                .getPayload();              // 5. 신분증 안에 적힌 진짜 내용(몸통) 꺼내기

        // ex) ADMIN, LAWYER라고 적혀있으면 하나씩 잘라서 스프링 시큐리티가 이해할 수 있는
        //          형태의 권한 배지로 변환하는 과정..!
        Collection<? extends SimpleGrantedAuthority> authorities =
                // 1. 신분의 'auth'칸에 적힌 글자를 가져와 콤마를 기준으로 쪼개기
                Arrays.stream(claims.get("auth").toString().split(","))
                        // 2. 쪼개진 글자 하나하나를 스프링이 인식하는 "권한 배지"로 만들기
                        .map(SimpleGrantedAuthority::new)
                        // 3. 만든 배지들을 하나로 모으기..!
                        .collect(Collectors.toList());

        // 4. 스프링이 관리하는 "공식 사용자 대장"에 해당 사람의 이름(이메일)과 권한을 적어두기
        User principal = new User(claims.getSubject(), "", authorities);
        // 5. 최종적으로 "해당 사람은 인증된 사람!"이다라는 공식 통행증(Authentication) 발급하여 돌려주기
        return new UsernamePasswordAuthenticationToken(principal, token, authorities);
    }
}