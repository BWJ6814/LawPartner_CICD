package com.example.backend_main.common.security;

import com.example.backend_main.common.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

@Getter
public class CustomUserDetails implements UserDetails {

    private final Long userNo;      // ★ 핵심: PK를 들고 다님
    private final String userId;    // 아이디
    private final String password;  // 비밀번호
    private final String roleCode;  // 권한 (ROLE_ADMIN 등)
    // 필요하다면 User 엔티티 통째로 들고 다녀도 됨
    // private final User user;

    // User 엔티티를 받아서 초기화
    public CustomUserDetails(User user) {
        this.userNo = user.getUserNo();
        this.userId = user.getUserId();
        this.password = user.getUserPw();
        this.roleCode = user.getRoleCode();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority(roleCode));
    }

    @Override
    public String getUsername() {
        return userId;
    }

    // 계정 만료/잠금 여부 등은 true(정상)로 설정 (필요 시 로직 추가)
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}