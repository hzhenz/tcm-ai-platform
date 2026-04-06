package com.example.tcm_ai_backend.dto.ai;

import jakarta.validation.constraints.NotBlank;

public class AiChatMessage {

    @NotBlank(message = "role 不能为空")
    private String role;

    @NotBlank(message = "content 不能为空")
    private String content;

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
