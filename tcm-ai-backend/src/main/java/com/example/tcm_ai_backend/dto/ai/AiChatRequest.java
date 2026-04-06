package com.example.tcm_ai_backend.dto.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.util.ArrayList;
import java.util.List;

public class AiChatRequest {

    @NotBlank(message = "content 不能为空")
    private String content;

    @Valid
    private List<AiChatMessage> history = new ArrayList<>();

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public List<AiChatMessage> getHistory() {
        return history;
    }

    public void setHistory(List<AiChatMessage> history) {
        this.history = history;
    }
}
