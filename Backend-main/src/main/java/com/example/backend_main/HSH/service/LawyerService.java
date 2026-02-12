package com.example.backend_main.HSH.service;

import com.example.backend_main.common.entity.LawyerInfo;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.repository.LawyerInfoRepository;
import com.example.backend_main.dto.UserJoinRequestDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;



@Service
@RequiredArgsConstructor
@Slf4j
public class LawyerService {

    private final LawyerInfoRepository lawyerInfoRepository;


    @Transactional
    public void registerLawyerInfo(User user, UserJoinRequestDTO dto) {

        // 1. 리스트로 들어온 전문 분야를 하나의 문자열로 합치기 (예: ["민사", "형사"] -> "민사,형사")
        String specialtyStr = "";
        if (dto.getSpecialtyCodes() != null && !dto.getSpecialtyCodes().isEmpty()) {
            specialtyStr = String.join(",", dto.getSpecialtyCodes());
        }

        // 2. 변호사 상세 정보(TB_LAWYER_INFO) 저장
        LawyerInfo lawyerInfo = LawyerInfo.builder()
                .user(user) // User 엔티티와 1:1 연결
                .licenseNo(dto.getLicenseNo())
                .licenseFile(dto.getLicenseFile())
                .officeName(dto.getOfficeName())
                .officeAddr(dto.getOfficeAddr())
                .examType(dto.getExamType())
                .introText(dto.getIntroText())
                .imgUrl(dto.getImgUrl())
                .specialtyStr(specialtyStr)
                .build();

        lawyerInfoRepository.save(lawyerInfo);

        log.info("⚖️ 변호사 정보 및 전문분야({}) 등록 완료", specialtyStr);
    }
}