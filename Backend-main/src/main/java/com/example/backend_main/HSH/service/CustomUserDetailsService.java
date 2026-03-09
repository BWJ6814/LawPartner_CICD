package com.example.backend_main.HSH.service;

import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.common.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

// 이 직원을 스프링 공장에 취직시킵니다!
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 발급된 jwt 토큰에서 아이디에 저장한 이메일을 가져와 찾기.
        User user = userRepository.findByUserId(username)
                .orElseThrow(() -> new UsernameNotFoundException("해당 이메일의 사용자를 찾을 수 없습니다: " + username));
        return new CustomUserDetails(user);
    }
}