package com.example.backend_main.dto.HSH_DTO;

import com.example.backend_main.common.entity.CustomerInquiry;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

public class InquiryDto {

    // ==================================================================================
    // 📥 요청 DTO (Request)
    // ==================================================================================

    /**
     * [문의 등록 요청] — 사용자가 문의 작성 시 사용
     */
    @Getter
    @Setter
    public static class CreateRequest {

        @NotBlank(message = "문의 유형은 필수 입력 항목입니다.")
        private String type;

        @NotBlank(message = "제목은 필수 입력 항목입니다.")
        @Size(max = 300, message = "제목은 300자 이내로 입력해주세요.")
        private String title;

        @NotBlank(message = "내용은 필수 입력 항목입니다.")
        private String content;
    }

    /**
     * [답변 저장 요청] — 관리자가 답변 작성 시 사용
     */
    @Getter
    @Setter
    public static class AnswerRequest {

        @NotBlank(message = "답변 내용은 필수 입력 항목입니다.")
        private String answerContent;

        private String answeredBy;  // 답변자 이름 (없으면 "관리자" 기본값)
    }

    // ==================================================================================
    // 📤 응답 DTO (Response)
    // ==================================================================================

    /**
     * [문의 목록 응답] — 목록 조회 시 사용 (CLOB 필드 제외해 응답 경량화)
     */
    @Getter
    @Builder
    public static class ListResponse {

        private Long id;
        private String type;
        private String title;
        private String status;
        private String answeredBy;
        private boolean hasAnswer;      // 답변 존재 여부 (answerContent != null)
        private LocalDateTime createdAt;
        private LocalDateTime answeredAt;

        // Entity → DTO 변환 (정적 팩토리 메서드)
        public static ListResponse from(CustomerInquiry entity) {
            return ListResponse.builder()
                    .id(entity.getId())
                    .type(entity.getType())
                    .title(entity.getTitle())
                    .status(entity.getStatus())
                    .answeredBy(entity.getAnsweredBy())
                    .hasAnswer(entity.getAnswerContent() != null)
                    .createdAt(entity.getCreatedAt())
                    .answeredAt(entity.getAnsweredAt())
                    .build();
        }
    }

    /**
     * [문의 상세 응답] — 단건 상세 조회 시 사용 (전체 필드 포함)
     */
    @Getter
    @Builder
    public static class DetailResponse {

        private Long id;
        private Long writerNo;
        private String type;
        private String title;
        private String content;         // 문의 본문 (CLOB)
        private String status;
        private String answerContent;   // 답변 내용 (CLOB)
        private String answeredBy;
        private LocalDateTime answeredAt;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        // Entity → DTO 변환 (정적 팩토리 메서드)
        public static DetailResponse from(CustomerInquiry entity) {
            return DetailResponse.builder()
                    .id(entity.getId())
                    .writerNo(entity.getWriterNo())
                    .type(entity.getType())
                    .title(entity.getTitle())
                    .content(entity.getContent())
                    .status(entity.getStatus())
                    .answerContent(entity.getAnswerContent())
                    .answeredBy(entity.getAnsweredBy())
                    .answeredAt(entity.getAnsweredAt())
                    .createdAt(entity.getCreatedAt())
                    .updatedAt(entity.getUpdatedAt())
                    .build();
        }
    }
}