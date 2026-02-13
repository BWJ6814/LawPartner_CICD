package com.example.backend_main.HSH.service;

import com.example.backend_main.common.entity.LawyerInfo;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.repository.LawyerInfoRepository;
import com.example.backend_main.dto.UserJoinRequestDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika; // ★ Tika 추가
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LawyerService {

    private final LawyerInfoRepository lawyerInfoRepository;

    // ★ [경로 통일] FileController와 똑같은 경로로 수정했습니다.
    private final String uploadPath = "C:/LP_uploads/licenses/";

    // ★ [보안] 파일 위변조 감지 도구 소환
    private final Tika tika = new Tika();

    @Transactional
    public void registerLawyerInfo(User user, UserJoinRequestDTO dto) {

        // 1. 파일 업로드 처리
        String savedFileName = null;
        if (dto.getLicenseFile() != null && !dto.getLicenseFile().isEmpty()) {
            try {
                // 저장 메서드 호출 (여기서 Tika 검사 수행)
                savedFileName = saveLicenseFile(dto.getLicenseFile());
            } catch (IOException e) {
                log.error("❌ 파일 저장 중 오류 발생: {}", e.getMessage());
                throw new RuntimeException("자격증 파일 저장에 실패했습니다.");
            }
        }

        // 2. 전문 분야 처리 (DTO 필드명 일치시키기)
        // 기존: dto.getSpecialtyCodes() -> 수정: dto.getSpecialtyStr()
        String specialtyStr = dto.getSpecialtyStr();

        // 3. 변호사 상세 정보 저장
        LawyerInfo lawyerInfo = LawyerInfo.builder()
                .user(user)
                .licenseNo(dto.getLicenseNo())
                .licenseFile(savedFileName) // 저장된 UUID 파일명
                .officeName(dto.getOfficeName())
                .officeAddr(dto.getOfficeAddr()) // 주소
                .examType(dto.getExamType())
                .introText(dto.getIntroText())
                // .imgUrl(dto.getImgUrl()) <-- 프로필 사진은 별도 업로드라 일단 주석 처리 (DTO에 없으면 에러남)
                .specialtyStr(specialtyStr)
                .approvalYn("N") // 승인 대기
                .build();

        lawyerInfoRepository.save(lawyerInfo);
        log.info("⚖️ 변호사 정보 등록 완료 (파일명: {}, 분야: {})", savedFileName, specialtyStr);
    }

    /*
     [파일 저장 및 검증 메서드]
    */
    private String saveLicenseFile(MultipartFile file) throws IOException {
        // [1] Tika로 실제 파일 타입 검사 (확장자 위조 방지)
        String mimeType = tika.detect(file.getInputStream());
        log.info("🔍 업로드 파일 타입 분석: {}", mimeType);

        // 허용할 타입: 이미지 전체(image/*) 또는 PDF(application/pdf)
        if (!mimeType.startsWith("image/") && !mimeType.equals("application/pdf")) {
            log.warn("⛔ 허용되지 않은 파일 형식 차단: {}", mimeType);
            throw new IllegalArgumentException("이미지나 PDF 파일만 업로드 가능합니다.");
        }

        // [2] 폴더 생성
        File dir = new File(uploadPath);
        if (!dir.exists()) dir.mkdirs();

        // [3] 파일명 중복 방지 (UUID)
        String originalName = file.getOriginalFilename();
        String uuid = UUID.randomUUID().toString();
        // 안심하고 저장할 파일명
        String savedName = uuid + "_" + originalName;

        // [4] 저장 실행
        File dest = new File(uploadPath + savedName);
        file.transferTo(dest);

        return savedName;
    }
}