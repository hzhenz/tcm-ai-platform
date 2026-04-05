package com.example.tcm_ai_backend.controller;

import com.example.tcm_ai_backend.dto.auth.AuthResponse;
import com.example.tcm_ai_backend.dto.auth.LoginRequest;
import com.example.tcm_ai_backend.dto.auth.RegisterRequest;
import com.example.tcm_ai_backend.service.AuthService;
import com.example.tcm_ai_backend.utils.Result;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public Result<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return Result.success(authService.register(request));
    }

    @PostMapping("/login")
    public Result<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return Result.success(authService.login(request));
    }
}
