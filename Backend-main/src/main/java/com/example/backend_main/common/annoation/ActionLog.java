package com.example.backend_main.common.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD) // 메소드 위에 붙여서 쓴다
@Retention(RetentionPolicy.RUNTIME) // 실행 중에도 살아있다
public @interface ActionLog {
    String action(); // 행위 (예: "LAWYER_APPROVE", "EXCEL_DOWNLOAD")
    String target() default "-"; // 대상 (예: "USER_NO", "TB_ACCESS_LOG")
}