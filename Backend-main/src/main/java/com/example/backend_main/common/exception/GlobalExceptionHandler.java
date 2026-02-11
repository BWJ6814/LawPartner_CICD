package com.example.backend_main.common.exception;


import com.example.backend_main.common.vo.ResultVO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;


// 해당 클래스는 모든 Controller을 감시하는 중앙 통제실!
// 예외처리는 각 컨트롤러에서 하는 것이 디폴트이지만, 해당 어노테이션을 붙이면 모든 컨트롤러에서
// 발생하는 에러를 이곳 한 곳에서 가로채 처리할 수 있다!
@RestControllerAdvice
public class GlobalExceptionHandler {

    // @ExceptionHandler(Exception.class):  모든 알 수 없는 에러를 잡아서 "서버 오류"로 포장하기
    //                                   즉, 어떤 종류의 에러든 Exception가 발생하면 해당 메서드 실행
    //                                   자바의 모든 에러는 Exception을 상속 받기때문에..!
    @ExceptionHandler(Exception.class)
    // ResponseEntity : HTTP 상태 코드(200, 400, 500 등) 최종 배송 상자
    // <ResultVO<Void>> : 상자 안의 내용물은 ResultVo, 에러 응답에는 데이터가 필요 없으니
    //                    비어있다는 뜻의 Void를 주머니 <T>에 담기
    // Exception e : 발생한 에러의 정보를 e라는 이름의 바구니에 담아 가져오기
    public ResponseEntity<ResultVO<Void>> handleAllException(Exception e) {
        // 개발자 전용 로그 출력
        // e.printStackTrace() : 개발자가 볼 수 있게 서버 콘솔에 에러 남기기
        e.printStackTrace();
        // internalServerError() : HTTP 상태 코드 500(Internal Server Error)를 상자에 붙이기
        // .body(ResultVO.fail("...")) : 상자 안에 실패(false)라고 적힌 ResultVO 객체와 메시지를 담아
        //                               사용자에게 보내기
        return ResponseEntity.internalServerError()
                .body(ResultVO.fail("죄송합니다. 서버에 문제가 발생했습니다."));
    }

    // IllegalArgumentException.class : 누군자잘못된 값(인자)을 보냈을 때(IllegalArgumentException)
    //                                  에만 이 메서드가 실행되는 특정 어노테이션
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ResultVO<Void>> handleIllegalArgumentException(IllegalArgumentException e) {
        // badRequest() : HTTP 상태 코드 400(Bad Request)을 상자에 붙입니다. - 손님이 요청일 잘못보냈다.
        // e.getMessage() : 에러 바구니(e)에 들어있는 구체적인 이유를 꺼내서 사용자에게 바로 보여주기
        // ex) AES 열쇠는 반드지 32자여야 합니다!
        return ResponseEntity.badRequest()
                .body(ResultVO.fail(e.getMessage()));
    }

    // @Valid 어노테이션으로 검사했을 때 통과하지 못하면 발생하는 에러 잡기
    // 이메일 형식이나 비밀번호가 너무 짧지 않은지 등을 자동으로 검사!
    // MethodArgumentNotValidException : 서류 양식이 틀렸을 때 발생하는 에러
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ResultVO<Void>> handleValidationException(MethodArgumentNotValidException e) {
        // 여러 에러 중 첫 번째 에러 메시지만 가져와서 사용자에게 보여줍니다.
        // e.getBindingResult() : 심가 결과가 적힌 결과 보고서 꺼내기
        // .getAllErrors() : 보거서 중 틀린 부분들이 적힌 목록 전부 가져오기(이름 업석나, 이메일 형식 틀림 등)
        // .get(0) : 틀린 게 여러 개라도 사용자가 한 번에 고치기 편하게 가장 첫 번째 에러 하나만 가져오기
        // .getDefaultMessage() : 그 에러에 대해 미리 적어둔 친절한 설명을 가져오기
        //  ex) 이메일 형식이 아닙니다 등..
        String errorMessage = e.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        return ResponseEntity.badRequest()
                // errorMessage : 친절한 설명 대입하기..
                .body(ResultVO.fail(errorMessage));
    }
    /*
    public ResultVO<String> join(@Valid @RequestBody UserDTO userDTO) {
     ... 회원가입 로직  }
    처럼 사용하게 됨..!
    */

}
