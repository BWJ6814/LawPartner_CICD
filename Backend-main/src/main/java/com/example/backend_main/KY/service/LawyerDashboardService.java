package com.example.backend_main.KY.service;

import com.example.backend_main.KY.dto.LawyerDashboardDTO;
import com.example.backend_main.KY.entity.Consultation;
import com.example.backend_main.KY.entity.Review;
import com.example.backend_main.KY.repository.ConsultationRepository;
import com.example.backend_main.KY.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LawyerDashboardService {

    private final ReviewRepository reviewRepository;
    private final ConsultationRepository consultationRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // ========== 후기 목록 조회 ==========

    public List<LawyerDashboardDTO.ReviewDTO> getReviews(Long lawyerNo) {
        List<Review> reviews = reviewRepository.findByLawyerNoOrderByRegDtDesc(lawyerNo);

        return reviews.stream().map(r -> {
            LawyerDashboardDTO.ReviewDTO dto = new LawyerDashboardDTO.ReviewDTO();
            dto.setReviewNo(r.getReviewNo());
            dto.setWriterNm(r.getWriterNm());
            dto.setStars(r.getStars());
            dto.setContent(r.getContent());
            dto.setCategory(r.getCategory());
            if (r.getRegDt() != null) {
                dto.setRegDate(r.getRegDt().format(DATE_FMT));
            }
            return dto;
        }).collect(Collectors.toList());
    }

    // ========== 상담 목록 조회 ==========

    public List<LawyerDashboardDTO.ConsultationDTO> getConsultations(Long lawyerNo) {
        List<Consultation> consultations = consultationRepository.findByLawyerNoOrderByRegDtDesc(lawyerNo);

        return consultations.stream().map(c -> {
            LawyerDashboardDTO.ConsultationDTO dto = new LawyerDashboardDTO.ConsultationDTO();
            dto.setConsultNo(c.getConsultNo());
            dto.setClientNm(c.getClientNm());
            dto.setCategory(c.getCategory());
            dto.setStatusCode(c.getStatusCode());
            dto.setStatusLabel(convertStatus(c.getStatusCode()));
            if (c.getRegDt() != null) {
                dto.setRegDate(c.getRegDt().format(DATE_FMT));
            }
            return dto;
        }).collect(Collectors.toList());
    }

    // 상태코드 → 한글 변환
    private String convertStatus(String statusCode) {
        if (statusCode == null) return "대기";
        switch (statusCode) {
            case "C01": return "대기";
            case "C02": return "상담중";
            case "C03": return "소송 진행중";
            case "C04": return "완료";
            default: return "대기";
        }
    }
}
