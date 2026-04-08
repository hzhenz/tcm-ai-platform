package com.example.tcm_ai_backend.dto.agent.brain;

import java.util.Map;

public class AgentBrainAction {

    private String type;
    private String message;
    private String targetPath;
    private Map<String, Object> query;
    private Long taskId;
    private String taskStatus;
    private Map<String, Object> payload;

    public static AgentBrainAction route(String targetPath, Map<String, Object> query) {
        AgentBrainAction action = new AgentBrainAction();
        action.setType("ROUTE");
        action.setTargetPath(targetPath);
        action.setQuery(query);
        return action;
    }

    public static AgentBrainAction openTaskCenter() {
        AgentBrainAction action = new AgentBrainAction();
        action.setType("OPEN_TASK_CENTER");
        return action;
    }

    public static AgentBrainAction refreshTasks() {
        AgentBrainAction action = new AgentBrainAction();
        action.setType("REFRESH_TASKS");
        return action;
    }

    public static AgentBrainAction taskCreated(Long taskId, String taskStatus) {
        AgentBrainAction action = new AgentBrainAction();
        action.setType("TASK_CREATED");
        action.setTaskId(taskId);
        action.setTaskStatus(taskStatus);
        return action;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getTargetPath() {
        return targetPath;
    }

    public void setTargetPath(String targetPath) {
        this.targetPath = targetPath;
    }

    public Map<String, Object> getQuery() {
        return query;
    }

    public void setQuery(Map<String, Object> query) {
        this.query = query;
    }

    public Long getTaskId() {
        return taskId;
    }

    public void setTaskId(Long taskId) {
        this.taskId = taskId;
    }

    public String getTaskStatus() {
        return taskStatus;
    }

    public void setTaskStatus(String taskStatus) {
        this.taskStatus = taskStatus;
    }

    public Map<String, Object> getPayload() {
        return payload;
    }

    public void setPayload(Map<String, Object> payload) {
        this.payload = payload;
    }
}
