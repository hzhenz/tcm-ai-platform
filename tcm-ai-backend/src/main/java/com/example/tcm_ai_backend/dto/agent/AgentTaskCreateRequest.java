package com.example.tcm_ai_backend.dto.agent;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AgentTaskCreateRequest {

    @NotBlank(message = "任务类型不能为空")
    @Size(max = 64, message = "任务类型不能超过64个字符")
    private String taskType;

    @NotBlank(message = "任务标题不能为空")
    @Size(max = 120, message = "任务标题不能超过120个字符")
    private String title;

    @Size(max = 20, message = "风险等级不能超过20个字符")
    private String riskLevel;

    @Size(max = 64, message = "供应商标识不能超过64个字符")
    private String provider;

    @NotBlank(message = "任务载荷不能为空")
    private String requestPayload;

    public String getTaskType() {
        return taskType;
    }

    public void setTaskType(String taskType) {
        this.taskType = taskType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getRequestPayload() {
        return requestPayload;
    }

    public void setRequestPayload(String requestPayload) {
        this.requestPayload = requestPayload;
    }
}
