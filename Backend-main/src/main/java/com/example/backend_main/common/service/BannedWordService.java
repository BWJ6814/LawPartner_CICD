package com.example.backend_main.common.service;

import com.example.backend_main.common.entity.BannedWord;
import com.example.backend_main.common.exception.CustomException;
import com.example.backend_main.common.exception.ErrorCode;
import com.example.backend_main.common.repository.BannedWordRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BannedWordService {

    private final BannedWordRepository bannedWordRepository;
    private List<String> cachedWords = new ArrayList<>();

    @PostConstruct
    public void init() {
        refreshCache();
    }

    @Scheduled(fixedDelay = 300_000)
    @Transactional(readOnly = true)
    public void refreshCache() {
        cachedWords = bannedWordRepository.findAll().stream()
                .map(BannedWord::getWord)
                .filter(w -> w != null && !w.isBlank())
                .map(String::trim)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    public void validate(String content) {
        if (content == null) {
            return;
        }
        String lower = content.toLowerCase();
        LinkedHashSet<String> matched = new LinkedHashSet<>();
        for (String word : cachedWords) {
            if (word.isEmpty()) {
                continue;
            }
            if (lower.contains(word.toLowerCase())) {
                matched.add(word);
            }
        }
        if (!matched.isEmpty()) {
            String detail = String.join(", ", matched);
            throw new CustomException(
                    ErrorCode.BANNED_WORD_DETECTED,
                    "다음 금지어가 포함되어 있습니다: " + detail
            );
        }
    }
}
