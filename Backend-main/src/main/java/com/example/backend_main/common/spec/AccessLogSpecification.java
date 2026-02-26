package com.example.backend_main.common.spec;

import com.example.backend_main.common.entity.AccessLog;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class AccessLogSpecification {

    // 검색 조건들을 조립해서 하나의 WHERE 절로 만드는 메서드
    public static Specification<AccessLog> searchLog(String startDate, String endDate, String keywordType, String keyword, String statusType) {
        return (Root<AccessLog> root, CriteriaQuery<?> query, CriteriaBuilder criteriaBuilder) -> {

            // 1. 기본 조건 생성 (1=1, 참인 조건으로 시작)
            Predicate predicate = criteriaBuilder.conjunction();

            // 2. 기간 검색 (startDate ~ endDate)
            if (startDate != null && !startDate.isEmpty()) {
                // 시작일 00:00:00
                LocalDateTime start = LocalDate.parse(startDate).atStartOfDay();
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.greaterThanOrEqualTo(root.get("regDt"), start));
            }
            if (endDate != null && !endDate.isEmpty()) {
                // 종료일 23:59:59.999999999
                LocalDateTime end = LocalDate.parse(endDate).atTime(LocalTime.MAX);
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.lessThanOrEqualTo(root.get("regDt"), end));
            }

            // 3. 키워드 검색 (검색어와 타입이 모두 있을 때만 동작)
            if (keyword != null && !keyword.isEmpty() && keywordType != null) {
                switch (keywordType) {
                    case "TRACE_ID" ->
                            predicate = criteriaBuilder.and(predicate, criteriaBuilder.like(root.get("traceId"), "%" + keyword + "%"));

                    case "IP" ->
                            predicate = criteriaBuilder.and(predicate, criteriaBuilder.like(root.get("reqIp"), "%" + keyword + "%"));

                    case "URI" ->
                            predicate = criteriaBuilder.and(predicate, criteriaBuilder.like(root.get("reqUri"), "%" + keyword + "%"));

                    case "USER_NO" -> {
                        try {
                            long userNo = Long.parseLong(keyword);
                            predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("userNo"), userNo));
                        } catch (NumberFormatException ignored) {
                            // 숫자가 아닌 검색어가 들어오면 userNo 검색은 무시 (에러 안 나게 처리)
                        }
                    }
                }
            }

            // 4. 상태 코드 필터 (ERROR인 경우 400 이상만 조회)
            if ("ERROR".equals(statusType)) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.greaterThanOrEqualTo(root.get("statusCode"), 400));
            }

            // 5. 정렬: 최신순 (ORDER BY regDt DESC)
            // 주의: Pageable에서도 정렬을 줄 수 있지만, 여기서 강제할 수도 있음
            query.orderBy(criteriaBuilder.desc(root.get("regDt")));

            return predicate;
        };
    }
}