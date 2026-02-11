package com.example.backend_main.HSH.service;

import com.example.backend_main.common.entity.RefreshToken;
import com.example.backend_main.common.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    /*
     [토큰 저장 및 갱신]
     이미 로그인된 유저가 있다면 기존 토큰을 갈아치웁니다. (중복 로그인 방지)
     */
    @Transactional
    public void saveRefreshToken(Long userNo, String tokenValue) {
        // 유통기한은 현재로부터 7일로 설정 (설계 규격 반영)
        LocalDateTime expireDt = LocalDateTime.now().plusDays(7);

        refreshTokenRepository.findByUserNo(userNo)
                .ifPresentOrElse(
                        // 1. 기존 토큰이 있으면: 새 값으로 업데이트 (기존 기기 로그아웃 효과)
                        token -> token.updateToken(tokenValue, expireDt),
                        // 2. 기존 토큰이 없으면: 새로 생성
                        () -> refreshTokenRepository.save(
                                RefreshToken.builder()
                                        .userNo(userNo)
                                        .tokenValue(tokenValue)
                                        .expireDt(expireDt)
                                        .build()
                        )
                );
    }

    /*
     [토큰 삭제] 로그아웃 시 호출
     */
    @Transactional
    public void deleteByUserNo(Long userNo) {
        refreshTokenRepository.findByUserNo(userNo)
                .ifPresent(refreshTokenRepository::delete);
    }
}