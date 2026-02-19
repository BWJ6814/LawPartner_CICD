package com.example.backend_main.KY.service;

import com.example.backend_main.KY.dto.LawyerDashboardDTO;
import com.example.backend_main.KY.entity.Consultation;
import com.example.backend_main.KY.entity.Review;
import com.example.backend_main.KY.repository.CalendarRepository;
import com.example.backend_main.KY.repository.ConsultationRepository;
import com.example.backend_main.KY.repository.ReviewRepository;
import com.example.backend_main.common.entity.CalendarEvent;
import com.example.backend_main.common.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LawyerDashboardService {

    private final ReviewRepository       reviewRepository;
    private final ConsultationRepository consultationRepository;
    private final CalendarRepository     calendarRepository;
    private final UserRepository         userRepository;   // common

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // ── 후기 목록 ──────────────────────────────────────────────
    public List<LawyerDashboardDTO.ReviewDTO> getReviews(Long lawyerNo) {
        return reviewRepository.findByLawyerNoOrderByRegDtDesc(lawyerNo).stream()
            .map(r -> {
                LawyerDashboardDTO.ReviewDTO dto = new LawyerDashboardDTO.ReviewDTO();
                dto.setReviewNo(r.getReviewNo());
                dto.setStars(r.getStars());
                dto.setContent(r.getContent());
                if (r.getRegDt() != null) dto.setRegDate(r.getRegDt().format(DATE_FMT));
                // TB_USER 에서 작성자 이름 조회
                userRepository.findById(r.getWriterNo())
                    .ifPresent(u -> dto.setWriterNm(u.getUserNm()));
                return dto;
            }).collect(Collectors.toList());
    }

    // ── 상담(채팅방) 목록 ──────────────────────────────────────
    public List<LawyerDashboardDTO.ConsultationDTO> getConsultations(Long lawyerNo) {
        return consultationRepository.findByLawyerNoOrderByRegDtDesc(lawyerNo).stream()
            .map(c -> {
                LawyerDashboardDTO.ConsultationDTO dto = new LawyerDashboardDTO.ConsultationDTO();
                dto.setRoomId(c.getRoomId());
                dto.setProgressCode(c.getProgressCode());
                dto.setStatusLabel(convertProgress(c.getProgressCode()));
                if (c.getRegDt() != null) dto.setRegDate(c.getRegDt().format(DATE_FMT));
                // TB_USER 에서 의뢰인 이름 조회
                userRepository.findById(c.getUserNo())
                    .ifPresent(u -> dto.setClientNm(u.getUserNm()));
                return dto;
            }).collect(Collectors.toList());
    }

    // ── 통계 ───────────────────────────────────────────────────
    public LawyerDashboardDTO.StatsDTO getStats(Long lawyerNo) {
        LawyerDashboardDTO.StatsDTO dto = new LawyerDashboardDTO.StatsDTO();
        dto.setSolvedCount(consultationRepository.countByLawyerNoAndProgressCode(lawyerNo, "ST05"));
        dto.setRequestCount(consultationRepository.countByLawyerNo(lawyerNo));
        Double avg = reviewRepository.findAvgRatingByLawyerNo(lawyerNo);
        dto.setAvgRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
        return dto;
    }

    // ── 일정 조회 ──────────────────────────────────────────────
    public List<LawyerDashboardDTO.CalendarDTO> getCalendars(Long lawyerNo) {
        return calendarRepository.findByLawyerNoOrderByStartDateAsc(lawyerNo).stream()
            .map(e -> {
                LawyerDashboardDTO.CalendarDTO dto = new LawyerDashboardDTO.CalendarDTO();
                dto.setEventNo(e.getEventNo());
                dto.setTitle(e.getTitle());
                dto.setStartDate(e.getStartDate());
                dto.setColorCode(e.getColorCode());
                return dto;
            }).collect(Collectors.toList());
    }

    // ── 일정 추가 ──────────────────────────────────────────────
    public LawyerDashboardDTO.CalendarDTO addCalendar(Long lawyerNo, LawyerDashboardDTO.CalendarRequest req) {
        CalendarEvent saved = calendarRepository.save(
            CalendarEvent.builder()
                .lawyerNo(lawyerNo)
                .userNo(lawyerNo)   // 변호사 본인 일정 → userNo = lawyerNo
                .title(req.getTitle())
                .startDate(req.getStartDate())
                .colorCode(req.getColorCode() != null ? req.getColorCode() : "#3b82f6")
                .build()
        );
        LawyerDashboardDTO.CalendarDTO dto = new LawyerDashboardDTO.CalendarDTO();
        dto.setEventNo(saved.getEventNo());
        dto.setTitle(saved.getTitle());
        dto.setStartDate(saved.getStartDate());
        dto.setColorCode(saved.getColorCode());
        return dto;
    }

    // ── 일정 삭제 ──────────────────────────────────────────────
    public void deleteCalendar(Long lawyerNo, Long eventNo) {
        CalendarEvent event = calendarRepository.findById(eventNo)
            .orElseThrow(() -> new RuntimeException("일정을 찾을 수 없습니다."));
        if (!lawyerNo.equals(event.getLawyerNo())) {
            throw new RuntimeException("삭제 권한이 없습니다.");
        }
        calendarRepository.deleteById(eventNo);
    }

    // ── CASE_STEP 코드 → 한글 변환 ───────────────────────────
    private String convertProgress(String code) {
        if (code == null) return "접수 대기";
        switch (code) {
            case "ST01": return "접수 대기";
            case "ST02": return "상담 진행중";
            case "ST03": return "소장 작성중";
            case "ST04": return "소송 진행중";
            case "ST05": return "사건 종료";
            default:     return "접수 대기";
        }
    }
}
