package com.example.backend_main.HSH.controller;

import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika; // ★ Apache Tika 임포트
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriUtils;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;


/*
@RestController : 해당 클래스가 데이터를 직접 반환하는 API 창구임을 서넝ㄴ
@RequestMapping("/api/files") : 모든 요청 주소의 시작점을 /api/files로 고정
@Slf4j : 로그 남기기
*/
@RestController
@RequestMapping("/api/files")
@Slf4j
public class FileController {

    // 파일을 저장한 절대 경로
    private final String uploadPath = "C:/LP_uploads/licenses/";

    // ★ Tika 객체 생성 (빈번한 호출 시 성능을 위해 멤버 변수로 선언)
    // Tika(파일 감별사)를 고용 - 겉모양(확장자)가 아닌 속내(바이너리)를 읽는 도구 생성
    private final Tika tika = new Tika();

    /*
     [자격증 파일 보기/다운로드]
     @param fileName : DB에 저장된 UUID가 포함된 파일명
     @GetMapping("/license/{fileName}") : ex) /api/files/license/파일이름.jpg
     ResponseEntity<Resource> : JSON문자열이 아닌 파일 그 자차(Resource)를 응답 본문에 담아 보내기
    */
    @GetMapping("/license/{fileName}")
    public ResponseEntity<Resource> viewLicense(@PathVariable String fileName) {
        try {
            // 1. 경로 설정 및 리소스 로드 - 파일 찾기
            Path path = Paths.get(uploadPath).resolve(fileName);
            Resource resource = new UrlResource(path.toUri());

            // 파일 존재 여부 및 읽기 권한 체크
            if (!resource.exists() || !resource.isReadable()) {
                log.error("❌ 파일을 찾을 수 없거나 읽을 수 없습니다: {}", fileName);
                return ResponseEntity.notFound().build();
            }

            // 2. Apache Tika를 활용한 정밀 MIME 타입 감지
            // 이제 확장자(.pdf, .png)에 속지 않고, 파일의 바이너리 헤더를 읽어 실제 타입을 파악합니다.
            String contentType;
            try {
                // Tika가 파일의 실제 내용을 분석합니다.
                contentType = tika.detect(path);
                log.info("🔍 Tika 감지 결과: {} (파일명: {})", contentType, fileName);
            } catch (IOException e) {
                log.warn("⚠️ Tika 분석 실패, 기본 타입을 설정합니다: {}", e.getMessage());
                contentType = "application/octet-stream";
            }

            // 3. 응답 반환 (Content-Disposition을 'inline'으로 설정)
            // UriUtils.encode : 한글 파일명이 있을 경우 깨짐을 방지하기 위한 인코딩 처리
            String encoderFileName = UriUtils.encode(fileName, StandardCharsets.UTF_8);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    // inline : 브라우저가 지원하는 형식이면 즉시 출력, 아니면 다운로드
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + encoderFileName + "\"")
                    .body(resource);

        } catch (MalformedURLException e) {
            log.error("❌ 파일 경로 오류 (URL 형식 부적합): {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}