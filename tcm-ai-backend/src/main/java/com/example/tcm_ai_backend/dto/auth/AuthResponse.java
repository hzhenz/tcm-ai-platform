package com.example.tcm_ai_backend.dto.auth;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.util.Date;

public class AuthResponse {

    private String token;
    private Long userId;
    private String username;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm", timezone = "GMT+8")
    private Date createTime;

    public AuthResponse(String token, Long userId, String username, Date createTime) {
        this.token = token;
        this.userId = userId;
        this.username = username;
        this.createTime = createTime;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Date getCreateTime() {
        return createTime;
    }

    public void setCreateTime(Date createTime) {
        this.createTime = createTime;
    }
}
