package com.example.tcm_ai_backend.dto.agent.brain;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Map;

public class AgentBrainTurnRequest {

    @NotBlank(message = "用户输入不能为空")
    @Size(max = 2000, message = "用户输入不能超过2000个字符")
    private String userText;

    @Size(max = 100, message = "会话ID不能超过100个字符")
    private String sessionId;

    @Size(max = 200, message = "页面路径不能超过200个字符")
    private String currentPath;

    private Map<String, Object> context;

    public String getUserText() {
        return userText;
    }

    public void setUserText(String userText) {
        this.userText = userText;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getCurrentPath() {
        return currentPath;
    }

    public void setCurrentPath(String currentPath) {
        this.currentPath = currentPath;
    }

    public Map<String, Object> getContext() {
        return context;
    }

    public void setContext(Map<String, Object> context) {
        this.context = context;
    }
}
