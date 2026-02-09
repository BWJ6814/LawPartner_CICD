package com.example.backend_main.dto;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;

import java.util.List;

// 데이터를 주고받을 껍데기(DTO) 클래스
public class ConsultaionDTO {
    private Long id;
    private String title;
    private String content; // 미리보기용 내용
    private String author;
    private String category;
    private String createDate;
    private List<String> tags; // #부동산 #임대차 같은 태그
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "BOARD_NO")
    private Long boardNo;
    // Getter, Setter, Constructor 생략
}