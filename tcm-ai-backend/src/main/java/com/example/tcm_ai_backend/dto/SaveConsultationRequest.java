package com.example.tcm_ai_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SaveConsultationRequest {

    private Long id;

    @NotBlank(message = "问诊标题不能为空")
    @Size(max = 100, message = "问诊标题不能超过100个字符")
    private String title;

    @NotBlank(message = "聊天记录不能为空")
    private String messages;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessages() {
        return messages;
    }

    public void setMessages(String messages) {
        this.messages = messages;
    }
}
