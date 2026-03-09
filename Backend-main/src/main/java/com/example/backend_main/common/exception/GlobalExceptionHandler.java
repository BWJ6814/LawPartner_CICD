package com.example.backend_main.common.exception;

import com.example.backend_main.common.vo.ResultVO;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.NoSuchElementException;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // ==================================================================================
    // 1. 🧮 [비즈니스 로직 에러] 개발자가 의도적으로 던지는 에러들
    // ==================================================================================

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ResultVO<Void>> handleIllegalArgumentException(IllegalArgumentException e) {
        log.warn("⚠️ [Invalid Input] 사용자 입력 오류: {}", e.getMessage());
        return ResponseEntity
                .status(ErrorCode.INVALID_INPUT.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.INVALID_INPUT, e.getMessage())); // 개발자가 직접 작성한 메시지 전달
    }

    @ExceptionHandler({NoSuchElementException.class, EntityNotFoundException.class})
    public ResponseEntity<ResultVO<Void>> handleNotFoundException(Exception e) {
        log.warn("⚠️ [Not Found] 데이터를 찾을 수 없음: {}", e.getMessage());
        // 메시지가 없을 경우 Enum 기본 메시지로 폴백
        String message = e.getMessage() != null ? e.getMessage() : ErrorCode.DATA_NOT_FOUND.getMessage();
        return ResponseEntity
                .status(ErrorCode.DATA_NOT_FOUND.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.DATA_NOT_FOUND, message));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ResultVO<Void>> handleIllegalStateException(IllegalStateException e) {
        log.warn("⚠️ [Illegal State] 잘못된 상태 요청: {}", e.getMessage());
        return ResponseEntity
                .status(ErrorCode.ILLEGAL_STATE.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.ILLEGAL_STATE, e.getMessage())); // 개발자가 직접 작성한 메시지 전달
    }

    // ==================================================================================
    // 2. 📝 [스프링 웹 / 파라미터 / JSON 바인딩 에러] 프론트엔드의 실수들
    // ==================================================================================

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ResultVO<Void>> handleValidationException(MethodArgumentNotValidException e) {
        String errorMessage = e.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        log.warn("⚠️ [Validation Error] 양식 검증 실패: {}", errorMessage);
        return ResponseEntity
                .status(ErrorCode.VALIDATION_ERROR.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.VALIDATION_ERROR, errorMessage)); // 검증 메시지 그대로 전달
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ResultVO<Void>> handleTypeMismatchException(MethodArgumentTypeMismatchException e) {
        log.warn("⚠️ [Type Mismatch] 잘못된 타입 전달: 파라미터 '{}'에 '{}' 값이 들어왔습니다.", e.getName(), e.getValue());
        return ResponseEntity
                .status(ErrorCode.TYPE_MISMATCH.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.TYPE_MISMATCH)); // Enum 기본 메시지로 충분
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ResultVO<Void>> handleMissingParamException(MissingServletRequestParameterException e) {
        log.warn("⚠️ [Missing Parameter] 필수 파라미터 누락: {}", e.getParameterName());
        return ResponseEntity
                .status(ErrorCode.MISSING_PARAM.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.MISSING_PARAM)); // Enum 기본 메시지로 충분
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ResultVO<Void>> handleMissingHeaderException(MissingRequestHeaderException e) {
        log.warn("⚠️ [Missing Header] 필수 헤더 누락: {}", e.getHeaderName());
        return ResponseEntity
                .status(ErrorCode.MISSING_HEADER.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.MISSING_HEADER)); // Enum 기본 메시지로 충분
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ResultVO<Void>> handleHttpMessageNotReadableException(HttpMessageNotReadableException e) {
        log.warn("⚠️ [JSON Parse Error] 프론트엔드 JSON 파싱 실패: {}", e.getMessage());
        return ResponseEntity
                .status(ErrorCode.JSON_PARSE_ERROR.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.JSON_PARSE_ERROR)); // Enum 기본 메시지로 충분
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ResultVO<Void>> handleMethodNotSupportedException(HttpRequestMethodNotSupportedException e) {
        log.warn("⚠️ [Method Not Supported] 잘못된 HTTP 메서드 호출: {}", e.getMethod());
        return ResponseEntity
                .status(ErrorCode.METHOD_NOT_ALLOWED.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.METHOD_NOT_ALLOWED)); // Enum 기본 메시지로 충분
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ResultVO<Void>> handleMediaTypeNotSupportedException(HttpMediaTypeNotSupportedException e) {
        log.warn("⚠️ [Media Type Error] 지원하지 않는 미디어 타입: {}", e.getContentType());
        return ResponseEntity
                .status(ErrorCode.UNSUPPORTED_MEDIA_TYPE.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.UNSUPPORTED_MEDIA_TYPE)); // Enum 기본 메시지로 충분
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ResultVO<Void>> handleNoHandlerFoundException(NoHandlerFoundException e) {
        log.warn("⚠️ [API Not Found] 존재하지 않는 API 요청: {}", e.getRequestURL());
        return ResponseEntity
                .status(ErrorCode.API_NOT_FOUND.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.API_NOT_FOUND)); // Enum 기본 메시지로 충분
    }

    // ==================================================================================
    // 3. 🗄️ [데이터베이스 & 파일 에러]
    // ==================================================================================

    @ExceptionHandler(DuplicateKeyException.class)
    public ResponseEntity<ResultVO<Void>> handleDuplicateKeyException(DuplicateKeyException e) {
        log.warn("⚠️ [Duplicate Key] 데이터 중복 발생: {}", e.getMessage());
        return ResponseEntity
                .status(ErrorCode.DUPLICATE_DATA.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.DUPLICATE_DATA)); // Enum 기본 메시지로 충분
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ResultVO<Void>> handleDataIntegrityViolationException(DataIntegrityViolationException e) {
        log.error("🚨 [DB Constraint Violation] 데이터베이스 제약 조건 위배: ", e);
        return ResponseEntity
                .status(ErrorCode.DB_CONSTRAINT_ERROR.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.DB_CONSTRAINT_ERROR)); // Enum 기본 메시지로 충분
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ResultVO<Void>> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException e) {
        log.warn("⚠️ [File Size Exceeded] 파일 업로드 용량 초과");
        return ResponseEntity
                .status(ErrorCode.FILE_TOO_LARGE.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.FILE_TOO_LARGE)); // Enum 기본 메시지로 충분
    }

    // ==================================================================================
    // 4. 🔒 [스프링 시큐리티 관련 에러 (컨트롤러 단)]
    // ==================================================================================

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ResultVO<Void>> handleAccessDeniedException(AccessDeniedException e) {
        log.warn("⚠️ [Access Denied] 권한이 없는 사용자의 접근 시도");
        return ResponseEntity
                .status(ErrorCode.ACCESS_DENIED.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.ACCESS_DENIED)); // Enum 기본 메시지로 충분
    }

    // ==================================================================================
    // 5. 💣 [최후의 보루] 위에서 못 잡은 모든 에러 (500)
    // ==================================================================================

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ResultVO<Void>> handleAllException(Exception e) {
        log.error("🚨 [Critical System Error] 원인 미상의 서버 에러 발생: ", e);
        return ResponseEntity
                .status(ErrorCode.SYSTEM_ERROR.getHttpStatus())
                .body(ResultVO.fail(ErrorCode.SYSTEM_ERROR)); // 500은 절대 내부 메시지 노출 금지
    }
}