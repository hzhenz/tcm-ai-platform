package com.example.tcm_ai_backend.dto.agent;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AgentTaskApproveRequest {

    @NotBlank(message = "审批动作不能为空")
    @Size(max = 16, message = "审批动作不能超过16个字符")
    private String action;

    @Size(max = 500, message = "审批备注不能超过500个字符")
    private String note;

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
