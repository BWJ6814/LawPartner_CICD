package com.example.backend_main.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

// [주의] 이 클래스는 신분증을 확인하는 단계!
//  신분증이 없는 사람을 쫓아내는 건 EntryPoint 클래스!
// JwtAuthenticationFilter : 수문장 : 신분증 꺼내서 확인 및 명찰 달아주기
// 성공 : 명찰 획득 / 실패 : 그냥 통과
// JwtAuthenticationEntryPoint : 보안관 : 명찰이 없는 사람에게 401 에러 던지기
// 성공 : 입장 허용 / 실패 : 401 Unauthorized 에러 리턴

// [JwtAuthenticationFilter]
// @RequiredArgsConstructor : 모든 요청마다 딱 한번씩 실행되며, 신분증(JWT)이 있는지 확인하는 문지기!
//          룸북(Lombok)의 기능으로, 클래스 안의 final이 붙은 변수를 자동으로 생성자에 넣어주기..!
// extends OncePerRequestFilter : 한 번의 요청에 딱 한 번만 검색해!
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter{
    // 신분증 발급기를 미리 가져오기!
    private final JwtTokenProvider jwtTokenProvider;

    // OncePerRequestFilter의 검분 업무를 재정의하기
    // HttpServletRequest : 손님이 들고온 가방(요청 정보) - 신분증!
    // HttpServletResponse : 손님에게 줄 답장(응답 정보)
    // FilterChain : 검사가 끝나면 이 통로로 손님을 밀어넣기..!
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException,IOException{

        // 1. 손님의 가방(Header)에서 신분증(Token)을 꺼냅니다.
        // 손님 가방(Header)에서 Authorization이라는 이름 봉투를 찾아!
        // 보통 JWT는 Authorization: Bearer [토큰] 형식으로 전달되기 때문에
        // Bearer : 디지털 서명입니다!
        // [토큰] : 진짜 토큰 문자열..!
        String token = resolveToken(request);

        // 2. 신분증이 있고, 신분증을 발급기(Provider)에게 신분증 진위여부를 통해 확인하는 단계
        // true : 성공!
        // false : 실패..
        // 신분증이 null이 아니고, 발급기에게 신분증을 넣었을 때, 가짜/날짜가 안 지났을 때만 true!
        if (token != null && jwtTokenProvider.validateToken(token)) {
            // 3. 신분증을 보고 공식 명찰(Authentication)을 만듭니다.
            // 이메일과 권한의 정보가 공식 명찰이 됨..!
            Authentication auth = jwtTokenProvider.getAuthentication(token);
            // 4. 이 사람의 명찰을 성 안의 '현재 접속자 명단'에 등록합니다.
            // SecurityContextHolder.getContext() : 현재 출입자 명부 펼치기
            // setAuthentication(auth) : 명부에 이 사람의 이름(이메일)과 권한을 등록하기..!
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        // 5. 검사가 끝났으니 다음 절차(다음 필터나 컨트롤러)로 보내줍니다.
        filterChain.doFilter(request, response);
    }

    // [신분증 꺼내기 도구] "Bearer "라고 적힌 뒷부분의 진짜 토큰만 쏙 가져옵니다.
    private String resolveToken(HttpServletRequest request) {
        // 가방의 Authorization이라는 이름의 주머니 확인하기
        String bearerToken = request.getHeader("Authorization");
        // 주머니 안에 든 내용물이 Bearer라는 글자로 시작하는지 확인하기..!
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            // "Bearer "은 공백 포함 총 7글자이므로, 앞의 7글자 떼버리고 뒤에 오는
            // 진짜 신분증 문자열만 가져오기..!
            return bearerToken.substring(7);
        }
        return null;
    }
}
