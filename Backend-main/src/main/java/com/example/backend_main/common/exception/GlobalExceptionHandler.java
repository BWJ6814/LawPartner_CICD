package com.example.backend_main.common.exception;

import com.example.backend_main.common.vo.ResultVO;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.NoSuchElementException;

// 해당 클래스는 모든 Controller를 감시하는 중앙 통제실!
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // ==================================================================================
    // 1. 🧮 [비즈니스 로직 에러] 개발자가 의도적으로 던지는 에러들
    // ==================================================================================

    // 1-1. 잘못된 값(인자)이 들어왔을 때 (400)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ResultVO<Void>> handleIllegalArgumentException(IllegalArgumentException e) {
        log.warn("⚠️ [Invalid Input] 사용자 입력 오류: {}", e.getMessage());
        return ResponseEntity.badRequest()
                .body(ResultVO.fail("INVALID_INPUT", e.getMessage()));
    }

    // 1-2. 데이터베이스에서 값을 찾을 수 없을 때 (404) - (Optional.orElseThrow 등)
    @ExceptionHandler({NoSuchElementException.class, EntityNotFoundException.class})
    public ResponseEntity<ResultVO<Void>> handleNotFoundException(Exception e) {
        log.warn("⚠️ [Not Found] 데이터를 찾을 수 없음: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ResultVO.fail("DATA_NOT_FOUND", e.getMessage() != null ? e.getMessage() : "요청하신 데이터를 찾을 수 없습니다."));
    }

    // 1-3. 현재 상태와 맞지 않는 요청을 할 때 (409 Conflict) - ex) 이미 취소된 주문을 또 취소
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ResultVO<Void>> handleIllegalStateException(IllegalStateException e) {
        log.warn("⚠️ [Illegal State] 잘못된 상태 요청: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ResultVO.fail("ILLEGAL_STATE", e.getMessage()));
    }


    // ==================================================================================
    // 2. 📝 [스프링 웹 / 파라미터 / JSON 바인딩 에러] 프론트엔드의 실수들
    // ==================================================================================

    // 2-1. @Valid 유효성 검사 실패 (400)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ResultVO<Void>> handleValidationException(MethodArgumentNotValidException e) {
        String errorMessage = e.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        log.warn("⚠️ [Validation Error] 양식 검증 실패: {}", errorMessage);
        return ResponseEntity.badRequest()
                .body(ResultVO.fail("VALIDATION_ERROR", errorMessage));
    }

    // 2-2. 필수 파라미터(?id=xxx)를 빼먹고 요청했을 때 (400)
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ResultVO<Void>> handleMissingParamException(MissingServletRequestParameterException e) {
        log.warn("⚠️ [Missing Parameter] 필수 파라미터 누락: {}", e.getParameterName());
        return ResponseEntity.badRequest()
                .body(ResultVO.fail("MISSING_PARAM", "필수 파라미터 '" + e.getParameterName() + "'가 누락되었습니다."));
    }

    // 2-3. JSON 양식이 깨졌거나 타입이 안 맞을 때 (400) - ex) 숫자에 문자를 보냄
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ResultVO<Void>> handleHttpMessageNotReadableException(HttpMessageNotReadableException e) {
        log.warn("⚠️ [JSON Parse Error] 프론트엔드 JSON 파싱 실패: {}", e.getMessage());
        return ResponseEntity.badRequest()
                .body(ResultVO.fail("JSON_PARSE_ERROR", "요청 데이터의 형식이 잘못되었거나 파싱할 수 없습니다."));
    }

    // 2-4. 지원하지 않는 HTTP 메서드 호출 (405) - ex) GET 방식 API에 POST로 보냄
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ResultVO<Void>> handleMethodNotSupportedException(HttpRequestMethodNotSupportedException e) {
        log.warn("⚠️ [Method Not Supported] 잘못된 HTTP 메서드 호출: {}", e.getMethod());
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(ResultVO.fail("METHOD_NOT_ALLOWED", "지원하지 않는 호출 방식(Method)입니다."));
    }

    // 2-5. 존재하지 않는 API 주소로 요청했을 때 (404)
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ResultVO<Void>> handleNoHandlerFoundException(NoHandlerFoundException e) {
        log.warn("⚠️ [API Not Found] 존재하지 않는 API 요청: {}", e.getRequestURL());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ResultVO.fail("API_NOT_FOUND", "요청하신 API 주소를 찾을 수 없습니다."));
    }


    // ==================================================================================
    // 3. 🗄️ [데이터베이스 & 파일 에러]
    // ==================================================================================

    // 3-1. DB 제약조건 위배 (409 Conflict) - 중복된 아이디, 방금 전 겪은 NOT NULL 위반 등!
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ResultVO<Void>> handleDataIntegrityViolationException(DataIntegrityViolationException e) {
        log.error("🚨 [DB Constraint Violation] 데이터베이스 제약 조건 위배: ", e);
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ResultVO.fail("DUPLICATE_DATA", "이미 존재하는 데이터이거나 형식에 맞지 않는 데이터입니다."));
    }

    // 3-2. 파일 용량 초과 에러 (413 Payload Too Large)
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ResultVO<Void>> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException e) {
        log.warn("⚠️ [File Size Exceeded] 파일 업로드 용량 초과");
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(ResultVO.fail("FILE_TOO_LARGE", "업로드 가능한 파일 용량을 초과했습니다."));
    }


    // ==================================================================================
    // 4. 🔒 [스프링 시큐리티 관련 에러]
    // ==================================================================================

    // 4-1. 권한 부족 (403 Forbidden) - @PreAuthorize("hasRole('ADMIN')") 에 걸렸을 때
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ResultVO<Void>> handleAccessDeniedException(AccessDeniedException e) {
        log.warn("⚠️ [Access Denied] 권한이 없는 사용자의 접근 시도");
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ResultVO.fail("ACCESS_DENIED", "해당 기능을 실행할 권한이 없습니다."));
    }


    // ==================================================================================
    // 5. 💣 [최후의 보루] 위에서 못 잡은 모든 에러 (500)
    // ==================================================================================

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ResultVO<Void>> handleAllException(Exception e) {
        // 이 로그가 찍히면 백엔드 개발자는 무조건 코드를 수정해서 위쪽의 개별 예외로 빼야 합니다!
        log.error("🚨 [Critical System Error] 원인 미상의 서버 에러 발생: ", e);

        return ResponseEntity.internalServerError()
                .body(ResultVO.fail("SYSTEM_ERROR", "서버 내부 오류가 발생했습니다. 관리자에게 문의하세요."));
    }
}