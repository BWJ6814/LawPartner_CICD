package com.example.backend_main.HSH.service;

import com.example.backend_main.common.entity.LawyerDocument;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.exception.CustomException;
import com.example.backend_main.common.exception.ErrorCode;
import com.example.backend_main.common.repository.LawyerDocumentRepository;
import com.example.backend_main.common.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileService {

    private final LawyerDocumentRepository lawyerDocumentRepository;
    private final UserRepository userRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("pdf", "jpg", "jpeg", "png");

    @Transactional
    public LawyerDocument storeFile(MultipartFile file, Long userNo, String docType) {
        User user = userRepository.findById(userNo)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());

        try {
            if (file.isEmpty()) {
                throw new CustomException(ErrorCode.FILE_UPLOAD_ERROR, "빈 파일은 업로드할 수 없습니다.");
            }
            if (originalFileName.contains("..")) {
                throw new CustomException(ErrorCode.FILE_UPLOAD_ERROR, "파일 이름에 부적절한 문자가 포함되어 있습니다.");
            }

            String extension = StringUtils.getFilenameExtension(originalFileName);
            if (!isAllowedExtension(extension)) {
                throw new CustomException(ErrorCode.FILE_UPLOAD_ERROR, "허용되지 않는 파일 형식입니다. (허용: " + ALLOWED_EXTENSIONS + ")");
            }

            String savedName = UUID.randomUUID().toString() + "." + extension;
            Path targetLocation = Paths.get(uploadDir).resolve(savedName);
            Files.createDirectories(targetLocation.getParent());
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            LawyerDocument doc = LawyerDocument.builder()
                    .user(user)
                    .docType(docType)
                    .originalName(originalFileName)
                    .savedName(savedName)
                    .filePath(targetLocation.getParent().toString())
                    .fileSize(file.getSize())
                    .build();

            return lawyerDocumentRepository.save(doc);

        } catch (IOException ex) {
            log.error("파일 저장에 실패했습니다. 파일명: {}", originalFileName, ex);
            throw new CustomException(ErrorCode.FILE_UPLOAD_ERROR, "파일 저장 중 오류가 발생했습니다.");
        }
    }

    @Transactional(readOnly = true)
    public Resource loadFileAsResource(Long docNo) {
        LawyerDocument doc = lawyerDocumentRepository.findById(docNo)
                .orElseThrow(() -> new CustomException(ErrorCode.DATA_NOT_FOUND, "파일 정보를 찾을 수 없습니다."));

        try {
            Path filePath = Paths.get(doc.getFilePath()).resolve(doc.getSavedName()).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                return resource;
            } else {
                throw new CustomException(ErrorCode.DATA_NOT_FOUND, "파일을 찾을 수 없습니다.");
            }
        } catch (MalformedURLException ex) {
            throw new CustomException(ErrorCode.DATA_NOT_FOUND, "파일 경로가 잘못되었습니다.");
        }
    }
    
    @Transactional(readOnly = true)
    public LawyerDocument getDocumentInfo(Long docNo) {
        return lawyerDocumentRepository.findById(docNo)
                .orElseThrow(() -> new CustomException(ErrorCode.DATA_NOT_FOUND, "파일 정보를 찾을 수 없습니다."));
    }

    private boolean isAllowedExtension(String extension) {
        return extension != null && ALLOWED_EXTENSIONS.contains(extension.toLowerCase());
    }
}
