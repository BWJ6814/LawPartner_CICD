package com.example.backend_main.HSH.service;

import com.example.backend_main.common.entity.LawyerInfo;
import com.example.backend_main.common.entity.LawyerSpecialty;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.repository.LawyerInfoRepository;
import com.example.backend_main.common.repository.LawyerSpecialtyRepository;
import com.example.backend_main.dto.UserJoinRequestDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LawyerService {

    private final LawyerInfoRepository lawyerInfoRepository;
    private final LawyerSpecialtyRepository lawyerSpecialtyRepository;

    @Transactional
    public void registerLawyerInfo(User user, UserJoinRequestDTO dto) {
        // 1. 변호사 상세 정보(TB_LAWYER_INFO) 저장
        LawyerInfo lawyerInfo = LawyerInfo.builder()
                .user(user) // User 엔티티와 1:1 연결
                .licenseNo(dto.getLicenseNo())
                .licenseFile(dto.getLicenseFile())
                .officeName(dto.getOfficeName())
                .officeAddr(dto.getOfficeAddr())
                .examType(dto.getExamType())
                .introText(dto.getIntroText())
                .imgUrl(dto.getImgUrl())
                .build();

        lawyerInfoRepository.save(lawyerInfo);

        // 2. 전문 분야(TB_LAWYER_SPECIALTY) 다중 저장 (1:N)
        if (dto.getSpecialtyCodes() != null && !dto.getSpecialtyCodes().isEmpty()) {
            List<LawyerSpecialty> specialties = dto.getSpecialtyCodes().stream()
                    .map(code -> LawyerSpecialty.builder()
                            .lawyerInfo(lawyerInfo)
                            .fieldCode(code)
                            .build())
                    .collect(Collectors.toList());

            lawyerSpecialtyRepository.saveAll(specialties);
        }
    }
}