package com.example.tcm_ai_backend.dto.agent;

import com.example.tcm_ai_backend.entity.AgentTask;

import java.util.Date;

public class AgentTaskView {

    private Long id;
    private String taskType;
    private String title;
    private String riskLevel;
    private String provider;
    private String status;
    private String requestPayload;
    private String resultPayload;
    private String errorMessage;
    private Date createTime;
    private Date updateTime;
    private Date approvedAt;

    public static AgentTaskView fromEntity(AgentTask task) {
        AgentTaskView view = new AgentTaskView();
        view.setId(task.getId());
        view.setTaskType(task.getTaskType());
        view.setTitle(task.getTitle());
        view.setRiskLevel(task.getRiskLevel());
        view.setProvider(task.getProvider());
        view.setStatus(task.getStatus());
        view.setRequestPayload(task.getRequestPayload());
        view.setResultPayload(task.getResultPayload());
        view.setErrorMessage(task.getErrorMessage());
        view.setCreateTime(task.getCreateTime());
        view.setUpdateTime(task.getUpdateTime());
        view.setApprovedAt(task.getApprovedAt());
        return view;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRequestPayload() {
        return requestPayload;
    }

    public void setRequestPayload(String requestPayload) {
        this.requestPayload = requestPayload;
    }

    public String getResultPayload() {
        return resultPayload;
    }

    public void setResultPayload(String resultPayload) {
        this.resultPayload = resultPayload;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public Date getCreateTime() {
        return createTime;
    }

    public void setCreateTime(Date createTime) {
        this.createTime = createTime;
    }

    public Date getUpdateTime() {
        return updateTime;
    }

    public void setUpdateTime(Date updateTime) {
        this.updateTime = updateTime;
    }

    public Date getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(Date approvedAt) {
        this.approvedAt = approvedAt;
    }
}
