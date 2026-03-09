package com.example.backend_main.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // 1. 비즈니스 로직 에러
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "INVALID_INPUT", "잘못된 입력값입니다."),
    DATA_NOT_FOUND(HttpStatus.NOT_FOUND, "DATA_NOT_FOUND", "요청하신 데이터를 찾을 수 없습니다."),
    ILLEGAL_STATE(HttpStatus.CONFLICT, "ILLEGAL_STATE", "잘못된 상태 요청입니다."),

    // 2. 스프링 웹 / 파라미터 / JSON 바인딩 에러
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "입력값 검증에 실패했습니다."),
    TYPE_MISMATCH(HttpStatus.BAD_REQUEST, "TYPE_MISMATCH", "잘못된 형식의 데이터가 전달되었습니다."),
    MISSING_PARAM(HttpStatus.BAD_REQUEST, "MISSING_PARAM", "필수 파라미터가 누락되었습니다."),
    MISSING_HEADER(HttpStatus.BAD_REQUEST, "MISSING_HEADER", "필수 헤더값이 누락되었습니다."),
    JSON_PARSE_ERROR(HttpStatus.BAD_REQUEST, "JSON_PARSE_ERROR", "요청 데이터 형식이 잘못되었습니다."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED", "지원하지 않는 호출 방식입니다."),
    UNSUPPORTED_MEDIA_TYPE(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "UNSUPPORTED_MEDIA_TYPE", "지원하지 않는 데이터 형식입니다."),
    API_NOT_FOUND(HttpStatus.NOT_FOUND, "API_NOT_FOUND", "요청하신 API 주소를 찾을 수 없습니다."),

    // 3. 데이터베이스 & 파일 에러
    DUPLICATE_DATA(HttpStatus.CONFLICT, "DUPLICATE_DATA", "이미 존재하는 데이터입니다."),
    DB_CONSTRAINT_ERROR(HttpStatus.CONFLICT, "DB_CONSTRAINT_ERROR", "데이터베이스 제약 조건 위배 오류입니다."),
    FILE_TOO_LARGE(HttpStatus.PAYLOAD_TOO_LARGE, "FILE_TOO_LARGE", "업로드 가능한 파일 용량을 초과했습니다."),

    // 4. 보안
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "해당 기능을 실행할 권한이 없습니다."),

    // 5. 서버 에러
    SYSTEM_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "SYSTEM_ERROR", "서버 내부 오류가 발생했습니다. 관리자에게 문의하세요.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}