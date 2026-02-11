package com.example.backend_main.common.vo;

import lombok.Builder;
import lombok.Getter;

/*
# [ResultVO]
- 모든 API 응답을 담는 표준 식판
- 성공 여부, 메시지, 그리고 진짜 데이터(겍체)를 하나로 묶어줍니다.
- <T> 어떤 것이든 담을 수 있는 만능 주머니..

# 로그인 성공 시 (JWT 토큰 반환)
return ResultVO.ok(jwtToken);
- 결과: { "success": true, "message": "성공적으로 처리되었습니다.", "data": "ey..." }

# 변호사 목록 조회 성공 시
return ResultVO.ok(lawyerList);
- 결과: { "success": true, "message": "변호사 등록이 완료되었습니다!", "data": { ... } }
*/
@Getter
@Builder
public class ResultVO<T> {
    private boolean success;    // 성공 여부 (true/false)
    private String message;     // 사용자나 개발자에게 보여줄 메시지
    private T data;             // 실제 보낼 데이터(이메일, 리스트 등 무엇이든 담김)

    // 성공했을 때 가장 깔끔하게 사용하는 도구 (메시지 포함)
    // static : 매번 new ResultVO()를 해서 메모리에 올릴 필요가 없음! 바로 클래스 이름으로 가져다 사용하기
    public static <T> ResultVO<T> ok(T data) {
        return ResultVO.<T>builder()
                .success(true)
                // 디폴트 메시지 출력내용
                // 다른 내용 처리를 원하면 ok(String message, T data) 사용..
                .message("성공적으로 처리되었습니다.") 
                .data(data)
                .build();
    }

    // 만약 메시지까지 직접 지정하고 싶을 때를 위한 오버로딩
    public static <T> ResultVO<T> ok(String message, T data) {
        return ResultVO.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    // 가장 기본적인 실패 처리 (메시지만 보낼 때)
    public static <T> ResultVO<T> fail(String message) {
        return ResultVO.<T>builder()
                // 실패니까 false!
                .success(false)
                .message(message)
                // 실패니까 데이터는 없다!
                .data(null)
                .build();
    }

    // 만약 실패하면서도 어떤 데이터나 에러 코드를 같이 보내고 싶을 때
    public static <T> ResultVO<T> fail(String message, T data) {
        return ResultVO.<T>builder()
                .success(false)
                .message(message)
                .data(data)
                .build();
    }
}
