package com.example.tcm_ai_backend.service;

import com.example.tcm_ai_backend.dto.auth.AuthResponse;
import com.example.tcm_ai_backend.dto.auth.LoginRequest;
import com.example.tcm_ai_backend.dto.auth.RegisterRequest;
import com.example.tcm_ai_backend.entity.AppUser;
import com.example.tcm_ai_backend.mapper.AppUserRepository;
import com.example.tcm_ai_backend.security.AppUserPrincipal;
import com.example.tcm_ai_backend.security.JwtService;
import jakarta.transaction.Transactional;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(AppUserRepository appUserRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String username = request.getUsername().trim();

        if (appUserRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("用户名已存在");
        }

        AppUser user = new AppUser();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setCreateTime(new Date());

        AppUser saved = appUserRepository.save(user);
        String token = jwtService.generateToken(new AppUserPrincipal(saved.getId(), saved.getUsername(), saved.getPassword()));

        return new AuthResponse(token, saved.getId(), saved.getUsername());
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        AppUser user = appUserRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("用户名或密码错误"));

        String token = jwtService.generateToken(new AppUserPrincipal(user.getId(), user.getUsername(), user.getPassword()));
        return new AuthResponse(token, user.getId(), user.getUsername());
    }
}
