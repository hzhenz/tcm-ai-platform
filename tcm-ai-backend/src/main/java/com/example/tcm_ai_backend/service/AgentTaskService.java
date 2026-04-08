package com.example.tcm_ai_backend.service;

import com.example.tcm_ai_backend.dto.agent.AgentTaskApproveRequest;
import com.example.tcm_ai_backend.dto.agent.AgentTaskCreateRequest;
import com.example.tcm_ai_backend.dto.agent.AgentTaskView;
import com.example.tcm_ai_backend.entity.AgentTask;
import com.example.tcm_ai_backend.mapper.AgentTaskRepository;
import com.example.tcm_ai_backend.security.AppUserPrincipal;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class AgentTaskService {

    private static final Set<String> ALLOWED_RISK_LEVELS = Set.of("LOW", "MEDIUM", "HIGH");
    private static final Set<String> ALLOWED_APPROVE_ACTIONS = Set.of("APPROVE", "REJECT");

    private final AgentTaskRepository agentTaskRepository;
    private final AgentPythonAutomationBridge pythonAutomationBridge;
    private final ObjectMapper objectMapper;
    private final String bookingManualUrl;
    private final ExecutorService taskExecutionExecutor = Executors.newFixedThreadPool(2);

    public AgentTaskService(
            AgentTaskRepository agentTaskRepository,
            AgentPythonAutomationBridge pythonAutomationBridge,
            ObjectMapper objectMapper,
            @Value("${app.agent.python.booking-url:https://www.cs4hospital.cn/}") String bookingManualUrl
    ) {
        this.agentTaskRepository = agentTaskRepository;
        this.pythonAutomationBridge = pythonAutomationBridge;
        this.objectMapper = objectMapper;
        this.bookingManualUrl = bookingManualUrl;
    }

    @Transactional
    public AgentTaskView createTask(AgentTaskCreateRequest request) {
        Long userId = getCurrentUserId();
        AgentTask task = new AgentTask();
        task.setUserId(userId);
        task.setTaskType(request.getTaskType().trim().toUpperCase(Locale.ROOT));
        task.setTitle(request.getTitle().trim());
        task.setRiskLevel(normalizeRiskLevel(request.getRiskLevel()));
        task.setProvider(trimToNull(request.getProvider()));
        task.setRequestPayload(request.getRequestPayload().trim());
        task.setStatus(requiresApproval(task.getRiskLevel()) ? "PENDING_APPROVAL" : "APPROVED");

        AgentTask saved = agentTaskRepository.save(task);
        if (!requiresApproval(saved.getRiskLevel())) {
            executeTask(saved.getId(), userId, "AUTO_APPROVED");
            saved = agentTaskRepository.findById(saved.getId()).orElse(saved);
        }
        return AgentTaskView.fromEntity(saved);
    }

    public List<AgentTaskView> listMyTasks() {
        Long userId = getCurrentUserId();
        return agentTaskRepository.findByUserIdOrderByCreateTimeDesc(userId)
                .stream()
                .map(AgentTaskView::fromEntity)
                .toList();
    }

    public AgentTaskView getTask(Long id) {
        Long userId = getCurrentUserId();
        AgentTask task = agentTaskRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("任务不存在"));
        return AgentTaskView.fromEntity(task);
    }

    @Transactional
    public AgentTaskView approveTask(Long id, AgentTaskApproveRequest request) {
        Long userId = getCurrentUserId();
        AgentTask task = agentTaskRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("任务不存在"));

        if (!"PENDING_APPROVAL".equals(task.getStatus())) {
            throw new IllegalArgumentException("当前任务状态不允许审批");
        }

        String action = request.getAction().trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_APPROVE_ACTIONS.contains(action)) {
            throw new IllegalArgumentException("审批动作仅支持 APPROVE 或 REJECT");
        }

        if ("REJECT".equals(action)) {
            task.setStatus("CANCELLED");
            task.setApprovedAt(new Date());
            task.setApprovedBy(userId);
            task.setErrorMessage(defaultRejectMessage(request.getNote()));
            return AgentTaskView.fromEntity(agentTaskRepository.save(task));
        }

        task.setStatus("APPROVED");
        task.setApprovedAt(new Date());
        task.setApprovedBy(userId);
        AgentTask approved = agentTaskRepository.save(task);

        scheduleExecutionAfterCommit(approved.getId(), userId, trimToNull(request.getNote()));
        return AgentTaskView.fromEntity(approved);
    }

    private void scheduleExecutionAfterCommit(Long taskId, Long operatorId, String note) {
        Runnable startExecution = () -> taskExecutionExecutor.submit(() -> executeTask(taskId, operatorId, note));

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    startExecution.run();
                }
            });
        } else {
            startExecution.run();
        }
    }

    private void executeTask(Long taskId, Long operatorId, String note) {
        AgentTask task = agentTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("任务不存在"));

        if ("CANCELLED".equals(task.getStatus()) || "SUCCESS".equals(task.getStatus())) {
            return;
        }

        task.setStatus("RUNNING");
        task.setErrorMessage(null);
        agentTaskRepository.save(task);

        try {
            String result = switch (task.getTaskType()) {
                case "WECHAT_SEND_REPORT" -> "{\"message\":\"模拟发送报告成功\",\"operatorId\":" + operatorId + "}";
                case "HOSPITAL_BOOKING" -> executeHospitalBooking(task);
                default -> "{\"message\":\"模拟执行成功\",\"taskType\":\"" + task.getTaskType() + "\"}";
            };
            if (note != null) {
                result = result.substring(0, result.length() - 1) + ",\"note\":\"" + safeJsonValue(note) + "\"}";
            }

            task.setResultPayload(result);
            if ("HOSPITAL_BOOKING".equals(task.getTaskType())) {
                Map<String, Object> execution = parseMap(result);
                String status = String.valueOf(execution.getOrDefault("status", "failed"));
                if ("success".equalsIgnoreCase(status)) {
                    task.setStatus("SUCCESS");
                    task.setErrorMessage(null);
                } else {
                    task.setStatus("FAILED");
                    task.setErrorMessage(buildBookingFailureMessage(execution));
                }
            } else {
                task.setStatus("SUCCESS");
            }
            agentTaskRepository.save(task);
        } catch (Exception ex) {
            task.setStatus("FAILED");
            task.setErrorMessage("任务执行失败：" + ex.getMessage());
            agentTaskRepository.save(task);
        }
    }

    private String executeHospitalBooking(AgentTask task) {
        Map<String, Object> payload = parseMap(task.getRequestPayload());
        String department = asString(payload.get("department"), "中医科");
        String date = asString(payload.get("date"), asString(payload.get("preferredDate"), "明天"));
        String traceId = UUID.randomUUID().toString();

        Map<String, Object> execution = pythonAutomationBridge.runBooking(department, date, traceId);
        try {
            return objectMapper.writeValueAsString(execution);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("挂号执行结果序列化失败");
        }
    }

    private Map<String, Object> parseMap(String text) {
        if (text == null || text.isBlank()) {
            return new LinkedHashMap<>();
        }
        try {
            return objectMapper.readValue(text, new TypeReference<LinkedHashMap<String, Object>>() {
            });
        } catch (Exception ignored) {
            return new LinkedHashMap<>();
        }
    }

    private String asString(Object value, String defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? defaultValue : text;
    }

    private String normalizeRiskLevel(String riskLevel) {
        String normalized = riskLevel == null ? "MEDIUM" : riskLevel.trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_RISK_LEVELS.contains(normalized)) {
            throw new IllegalArgumentException("风险等级仅支持 LOW、MEDIUM、HIGH");
        }
        return normalized;
    }

    private boolean requiresApproval(String riskLevel) {
        return "MEDIUM".equals(riskLevel) || "HIGH".equals(riskLevel);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String defaultRejectMessage(String note) {
        String trimmedNote = trimToNull(note);
        if (trimmedNote == null) {
            return "用户拒绝执行";
        }
        return "用户拒绝执行：" + trimmedNote;
    }

    private String safeJsonValue(String text) {
        return text.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private String buildBookingFailureMessage(Map<String, Object> execution) {
        String errorCode = asString(execution.get("errorCode"), "");
        String detail = asString(execution.get("message"), "未知错误");
        String targetUrl = asString(execution.get("targetUrl"), bookingManualUrl);
        if (targetUrl.isBlank()) {
            targetUrl = bookingManualUrl;
        }

        String guidance = "解决方案：请访问 " + targetUrl + " 手动挂号，完成登录/验证码后再提交。";
        if ("BOT_PROTECTION_BLOCKED".equalsIgnoreCase(errorCode)) {
            return "目标网站阻止自动化访问。" + guidance;
        }
        if ("MANUAL_VERIFICATION_REQUIRED".equalsIgnoreCase(errorCode)) {
            return "挂号流程需要人工验证（登录/验证码/实名）。" + guidance;
        }
        return "自动化挂号执行失败：" + detail + "。" + guidance;
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AppUserPrincipal principal)) {
            throw new IllegalStateException("未登录或登录已过期");
        }
        return principal.getUserId();
    }
}
