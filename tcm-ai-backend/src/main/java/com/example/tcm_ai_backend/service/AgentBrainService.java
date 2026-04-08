package com.example.tcm_ai_backend.service;

import com.example.tcm_ai_backend.dto.agent.AgentTaskCreateRequest;
import com.example.tcm_ai_backend.dto.agent.AgentTaskView;
import com.example.tcm_ai_backend.dto.agent.brain.AgentBrainAction;
import com.example.tcm_ai_backend.dto.agent.brain.AgentBrainTurnData;
import com.example.tcm_ai_backend.dto.agent.brain.AgentBrainTurnRequest;
import com.example.tcm_ai_backend.security.AppUserPrincipal;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AgentBrainService {

    private static final Pattern DATE_PATTERN = Pattern.compile("(今天|明天|后天|下周[一二三四五六日天]|\\d{4}-\\d{1,2}-\\d{1,2})");
    private static final String[] DEPARTMENT_CANDIDATES = {
            "推拿科", "针灸科", "中医科", "中医内科", "中医外科", "骨科", "妇科", "儿科", "皮肤科"
    };
        private static final List<String> ALLOWED_ROUTE_PATHS = List.of(
            "/", "/consultation", "/tongue", "/herb", "/science", "/map", "/profile"
        );

        private final AiGatewayService aiGatewayService;
    private final AgentTaskService agentTaskService;
    private final AgentPythonAutomationBridge pythonAutomationBridge;
    private final AgentBrainProgressService brainProgressService;
    private final ObjectMapper objectMapper;
    private final String bookingManualUrl;

    public AgentBrainService(
            AiGatewayService aiGatewayService,
            AgentTaskService agentTaskService,
            AgentPythonAutomationBridge pythonAutomationBridge,
            AgentBrainProgressService brainProgressService,
            ObjectMapper objectMapper,
            @Value("${app.agent.python.booking-url:https://www.cs4hospital.cn/}") String bookingManualUrl
    ) {
        this.aiGatewayService = aiGatewayService;
        this.agentTaskService = agentTaskService;
        this.pythonAutomationBridge = pythonAutomationBridge;
        this.brainProgressService = brainProgressService;
        this.objectMapper = objectMapper;
        this.bookingManualUrl = bookingManualUrl;
    }

    public AgentBrainTurnData handleTurn(AgentBrainTurnRequest request) {
        Long userId = getCurrentUserId();
        String sessionId = normalize(request.getSessionId());
        if (sessionId.isBlank()) {
            sessionId = "default";
        }
        String traceId = UUID.randomUUID().toString();
        String text = normalize(request.getUserText());
        brainProgressService.start(userId, sessionId, traceId);
        pushProgress(userId, sessionId, traceId, "ANALYZE", "正在解析你的诉求...");

        AgentBrainTurnData data = new AgentBrainTurnData();
        data.setHandled(false);
        data.setTraceId(traceId);
        data.setActions(new ArrayList<>());

        try {
            if (text.isBlank()) {
                data.setReply("请告诉我你希望我执行什么动作，例如“进入问诊”或“自动挂号”。");
                data.setHandled(true);
                pushProgress(userId, sessionId, traceId, "DONE", "已等待你输入更具体的需求。");
                return data;
            }

            if (containsAny(text, "代付", "自动扣费", "打电话", "拨号", "发短信", "代购")) {
                data.setHandled(true);
                data.setReply("这个动作我当前不能直接执行（支付/拨号/短信类能力暂未开放）。我不会假装已完成。你可以选择：联系医生或进入问诊。");
                data.getActions().add(AgentBrainAction.route("/map", null));
                data.getActions().add(AgentBrainAction.route("/consultation", null));
                pushProgress(userId, sessionId, traceId, "REJECT", "该诉求超出当前可执行能力范围，已明确拒绝。");
                return data;
            }

            if (containsAny(text, "任务中心", "待办", "审批", "任务列表")) {
                data.setHandled(true);
                data.setReply("已为你切换到任务中心。");
                data.getActions().add(AgentBrainAction.openTaskCenter());
                data.getActions().add(AgentBrainAction.refreshTasks());
                pushProgress(userId, sessionId, traceId, "ROUTE", "正在切换任务中心视图...");
                return data;
            }

            AgentBrainTurnData toolPlanned = tryHandleToolPlan(request, text, data, userId, sessionId, traceId);
            if (toolPlanned != null && toolPlanned.isHandled()) {
                return toolPlanned;
            }

            String routePath = detectRoutePath(text);
            if (routePath != null) {
                data.setHandled(true);
                data.setReply(routeReply(routePath));
                data.getActions().add(AgentBrainAction.route(routePath, null));
                pushProgress(userId, sessionId, traceId, "ROUTE", "正在准备页面跳转动作...");
                return data;
            }

            if (isExplicitBookingIntent(text)) {
                return handleBooking(text, traceId, data, userId, sessionId);
            }

            if (containsAny(text, "提醒", "服药", "用药", "吃药", "医嘱", "创建")) {
                return handleReminder(text, data, userId, sessionId, traceId);
            }

            if (containsAny(text, "你能做什么", "帮助", "怎么用", "功能")) {
                data.setHandled(true);
                data.setReply("我可以识别你的诉求并执行动作：全站跳转、挂号任务、服药提醒，以及在你授权时触发自动化执行。");
                pushProgress(userId, sessionId, traceId, "DONE", "已返回能力说明。");
                return data;
            }

            return data;
        } catch (Exception ex) {
            pushProgress(userId, sessionId, traceId, "FAILED", "执行中断：" + ex.getMessage());
            throw ex;
        } finally {
            brainProgressService.complete(userId, sessionId);
        }
    }

    private AgentBrainTurnData tryHandleToolPlan(
            AgentBrainTurnRequest request,
            String text,
            AgentBrainTurnData data,
            Long userId,
            String sessionId,
            String traceId
    ) {
        pushProgress(userId, sessionId, traceId, "TOOL_PLAN", "正在请求工具规划器...");

        Map<String, Object> plan;
        try {
            plan = aiGatewayService.planAgentTool(text, request.getCurrentPath(), buildToolDefinitions());
        } catch (Exception ex) {
            pushProgress(userId, sessionId, traceId, "TOOL_PLAN_FAILED", "工具规划器暂不可用，回退本地规则。");
            return null;
        }

        if (plan == null || plan.isEmpty()) {
            return null;
        }
        attachDebug(data, "toolPlan", plan);

        String toolName = asString(plan.get("toolName"), "none");
        double confidence = asDouble(plan.get("confidence"), 0.0);
        if ("none".equalsIgnoreCase(toolName) || confidence < 0.45) {
            pushProgress(userId, sessionId, traceId, "TOOL_PLAN_SKIP", "工具规划器未给出稳定指令，继续本地解析。");
            return null;
        }

        Map<String, Object> arguments = asMap(plan.get("arguments"));
        pushProgress(userId, sessionId, traceId, "TOOL_SELECTED", "已选择工具：" + toolName + "。");

        if ("book_expert_appointment".equals(toolName)) {
            if (!isExplicitBookingIntent(text)) {
                pushProgress(userId, sessionId, traceId, "BOOKING_GUARD", "检测到非明确挂号意图，已回退常规问诊流程。");
                return null;
            }
            String department = asString(arguments.get("department"), parseDepartment(text));
            String date = asString(arguments.get("date"), parseDate(text));
            boolean autoExecute = asBoolean(arguments.get("autoExecute"), containsAny(text,
                    "自动挂号", "立即挂号", "马上挂号", "直接挂号", "自动预约", "立即预约", "直接预约"
            ));
            return handleBooking(text, traceId, data, userId, sessionId, department, date, autoExecute);
        }

        if ("route_to_page".equals(toolName)) {
            String targetPath = normalizePath(asString(arguments.get("targetPath"), detectRoutePath(text)));
            if (targetPath == null) {
                return null;
            }
            data.setHandled(true);
            data.setReply(routeReply(targetPath));
            Map<String, Object> query = null;
            String presetPrompt = asString(arguments.get("presetPrompt"), "");
            if (!presetPrompt.isBlank()) {
                query = Map.of("presetPrompt", presetPrompt, "autoSend", "1");
            }
            data.getActions().add(AgentBrainAction.route(targetPath, query));
            pushProgress(userId, sessionId, traceId, "ROUTE", "工具规划器已返回页面跳转动作。");
            return data;
        }

        if ("open_task_center".equals(toolName)) {
            data.setHandled(true);
            data.setReply("已为你切换到任务中心。");
            data.getActions().add(AgentBrainAction.openTaskCenter());
            data.getActions().add(AgentBrainAction.refreshTasks());
            pushProgress(userId, sessionId, traceId, "ROUTE", "工具规划器已返回任务中心动作。");
            return data;
        }

        return null;
    }

    private AgentBrainTurnData handleBooking(String text, String traceId, AgentBrainTurnData data, Long userId, String sessionId) {
        return handleBooking(text, traceId, data, userId, sessionId, null, null, null);
    }

    private AgentBrainTurnData handleBooking(
            String text,
            String traceId,
            AgentBrainTurnData data,
            Long userId,
            String sessionId,
            String overrideDepartment,
            String overrideDate,
            Boolean overrideAutoExecute
    ) {
        String department = (overrideDepartment == null || overrideDepartment.isBlank()) ? parseDepartment(text) : overrideDepartment;
        String date = (overrideDate == null || overrideDate.isBlank()) ? parseDate(text) : overrideDate;
        pushProgress(userId, sessionId, traceId, "BOOKING_PARSE", "识别挂号意图，目标科室：" + department + "，日期：" + date + "。");

        boolean autoExecute = overrideAutoExecute != null
                ? overrideAutoExecute
                : containsAny(text, "自动挂号", "立即挂号", "马上挂号", "直接挂号", "自动预约", "立即预约", "直接预约");

        if (autoExecute) {
            pushProgress(userId, sessionId, traceId, "BOOKING_EXECUTE", "正在唤醒自动化挂号模块...");
            Map<String, Object> execution = pythonAutomationBridge.runBooking(department, date, traceId);
            String status = String.valueOf(execution.getOrDefault("status", "failed"));
            String message = String.valueOf(execution.getOrDefault("message", "自动化执行完成"));
            String errorCode = String.valueOf(execution.getOrDefault("errorCode", ""));
            data.setDebug(execution);

            data.setHandled(true);
            if ("success".equalsIgnoreCase(status)) {
                data.setReply("自动化挂号执行完成：" + message);
                data.getActions().add(AgentBrainAction.openTaskCenter());
                data.getActions().add(AgentBrainAction.refreshTasks());
                pushProgress(userId, sessionId, traceId, "BOOKING_SUCCESS", "自动化执行成功，正在刷新任务中心...");
            } else {
                if (isManualBookingRequired(errorCode)) {
                    data.setReply("目标站点触发了反自动化/人工校验，当前不能继续自动提交。解决方案：请访问 " + bookingManualUrl + " 手动挂号，完成登录/验证码后再提交。我也可以继续帮你问诊或定位医院。");
                    data.getActions().add(AgentBrainAction.route("/map", null));
                    data.getActions().add(AgentBrainAction.route("/consultation", null));
                    pushProgress(userId, sessionId, traceId, "BOOKING_MANUAL_REQUIRED", "目标站点要求人工接管，已给出手动办理路径。");
                    return data;
                }

                data.setReply("自动化挂号执行失败：" + message + "。解决方案：请访问 " + bookingManualUrl + " 手动挂号，完成登录/验证码后再提交。");
                data.getActions().add(AgentBrainAction.route("/map", null));
                pushProgress(userId, sessionId, traceId, "BOOKING_FAILED", "自动化执行失败，已给出替代动作。");
            }
            return data;
        }

        AgentTaskView task = createTask(
                "HOSPITAL_BOOKING",
                "预约最近医院中医科（由大脑创建）",
                "HIGH",
                "XLX_DEMO",
                toJsonPayload(Map.of(
                        "department", department,
                        "date", date,
                        "rawText", text
                ))
        );

        data.setHandled(true);
        data.setReply("已为你创建挂号任务，当前状态：" + task.getStatus() + "。请到任务中心审批后执行。");
        data.getActions().add(AgentBrainAction.taskCreated(task.getId(), task.getStatus()));
        data.getActions().add(AgentBrainAction.openTaskCenter());
        data.getActions().add(AgentBrainAction.refreshTasks());
        pushProgress(userId, sessionId, traceId, "BOOKING_TASK_CREATED", "已创建挂号任务，等待审批。");
        return data;
    }

    private AgentBrainTurnData handleReminder(String text, AgentBrainTurnData data, Long userId, String sessionId, String traceId) {
        if (!containsAny(text, "药", "服", "吃")) {
            data.setHandled(true);
            data.setReply("如果你要创建服药提醒，请告诉我药名、日期范围和频次，例如：阿司匹林，今天到下周一，每天三次。");
            pushProgress(userId, sessionId, traceId, "REMINDER_FILL", "提醒信息不完整，已引导补全药名与频次。");
            return data;
        }

        String medicine = parseMedicine(text);
        AgentTaskView task = createTask(
                "MEDICATION_REMINDER",
                "服药提醒：" + medicine,
                "LOW",
                "INTERNAL_REMINDER",
                toJsonPayload(Map.of(
                        "medicine", medicine,
                        "rawText", text
                ))
        );

        data.setHandled(true);
        data.setReply("已真实创建服药提醒任务（" + medicine + "），状态：" + task.getStatus() + "。你可在任务中心查看执行结果。");
        data.getActions().add(AgentBrainAction.taskCreated(task.getId(), task.getStatus()));
        data.getActions().add(AgentBrainAction.openTaskCenter());
        data.getActions().add(AgentBrainAction.refreshTasks());
        pushProgress(userId, sessionId, traceId, "REMINDER_CREATED", "服药提醒任务已创建并进入任务中心。");
        return data;
    }

    private AgentTaskView createTask(String type, String title, String riskLevel, String provider, String payload) {
        AgentTaskCreateRequest request = new AgentTaskCreateRequest();
        request.setTaskType(type);
        request.setTitle(title);
        request.setRiskLevel(riskLevel);
        request.setProvider(provider);
        request.setRequestPayload(payload);
        return agentTaskService.createTask(request);
    }

    private String routeReply(String path) {
        return switch (path) {
            case "/consultation" -> "好的，正在带你进入问诊页面。";
            case "/tongue" -> "好的，正在带你进入舌诊页面。";
            case "/herb" -> "好的，正在带你进入识草页面。";
            case "/science" -> "好的，正在带你进入科普页面。";
            case "/map" -> "好的，正在带你进入地图页面。";
            case "/profile" -> "好的，正在带你进入个人中心。";
            default -> "好的，正在为你跳转页面。";
        };
    }

    private String detectRoutePath(String text) {
        if (containsAny(text, "问诊", "看诊", "咨询医生")) return "/consultation";
        if (containsAny(text, "舌诊", "舌苔", "舌象")) return "/tongue";
        if (containsAny(text, "识草", "药材识别", "识别药材")) return "/herb";
        if (containsAny(text, "科普", "中医知识", "养生知识")) return "/science";
        if (containsAny(text, "地图", "附近医院", "附近医馆")) return "/map";
        if (containsAny(text, "个人中心", "我的档案", "我的报告")) return "/profile";
        if (containsAny(text, "首页", "主页", "回首页")) return "/";
        return null;
    }

    private boolean isExplicitBookingIntent(String text) {
        if (text == null || text.isBlank()) {
            return false;
        }

        if (containsAny(text,
                "自动挂号", "自动预约", "立即挂号", "马上挂号", "直接挂号",
                "帮我挂号", "帮我预约", "我要挂号", "我要预约", "去挂号",
                "约个号", "挂个号", "挂号", "预约", "门诊", "号源"
        )) {
            return true;
        }

        return containsAny(text, DEPARTMENT_CANDIDATES) && containsAny(text, "看", "就诊", "挂");
    }

    private boolean isManualBookingRequired(String errorCode) {
        if (errorCode == null || errorCode.isBlank()) {
            return false;
        }
        String normalized = errorCode.trim().toUpperCase(Locale.ROOT);
        return "BOT_PROTECTION_BLOCKED".equals(normalized)
                || "MANUAL_VERIFICATION_REQUIRED".equals(normalized);
    }

    private String parseDepartment(String text) {
        for (String candidate : DEPARTMENT_CANDIDATES) {
            if (text.contains(candidate)) {
                return candidate;
            }
        }
        if (containsAny(text, "推拿")) return "推拿科";
        if (containsAny(text, "针灸")) return "针灸科";
        return "中医科";
    }

    private String parseDate(String text) {
        Matcher matcher = DATE_PATTERN.matcher(text);
        if (matcher.find()) {
            return matcher.group(1);
        }
        if (containsAny(text, "今天")) return "今天";
        if (containsAny(text, "明天")) return "明天";
        return LocalDate.now().plusDays(1).toString();
    }

    private String parseMedicine(String text) {
        String[] known = {"阿司匹林", "布洛芬", "甲钴胺", "维生素C", "维生素D", "头孢"};
        for (String item : known) {
            if (text.contains(item)) {
                return item;
            }
        }

        Pattern pattern = Pattern.compile("(?:药是|是|吃|服用)([\\u4e00-\\u9fa5A-Za-z0-9·\\-]{2,30})");
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return "未命名药物";
    }

    private String toJsonPayload(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    private boolean containsAny(String text, String... keywords) {
        String lower = text.toLowerCase(Locale.ROOT);
        for (String keyword : keywords) {
            if (lower.contains(keyword.toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    private String normalize(String text) {
        if (text == null) {
            return "";
        }
        return text.trim();
    }

    private void pushProgress(Long userId, String sessionId, String traceId, String stage, String message) {
        brainProgressService.publish(userId, sessionId, traceId, stage, message);
    }

    private List<Map<String, Object>> buildToolDefinitions() {
        return List.of(
                Map.of(
                        "name", "book_expert_appointment",
                        "description", "自动预约中医专家号",
                        "parameters", Map.of(
                                "department", "string",
                                "date", "string",
                                "autoExecute", "boolean"
                        )
                ),
                Map.of(
                        "name", "route_to_page",
                        "description", "跳转到站内页面",
                        "parameters", Map.of(
                                "targetPath", "string",
                                "presetPrompt", "string"
                        )
                ),
                Map.of(
                        "name", "open_task_center",
                        "description", "打开任务中心",
                        "parameters", Map.of()
                )
        );
    }

    private String normalizePath(String path) {
        if (path == null || path.isBlank()) {
            return null;
        }
        String value = path.startsWith("/") ? path : "/" + path;
        return ALLOWED_ROUTE_PATHS.contains(value) ? value : null;
    }

    private Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> mapValue) {
            Map<String, Object> result = new LinkedHashMap<>();
            for (Map.Entry<?, ?> entry : mapValue.entrySet()) {
                if (entry.getKey() != null) {
                    result.put(String.valueOf(entry.getKey()), entry.getValue());
                }
            }
            return result;
        }
        return new LinkedHashMap<>();
    }

    private String asString(Object value, String defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? defaultValue : text;
    }

    private double asDouble(Object value, double defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (Exception ignored) {
            return defaultValue;
        }
    }

    private boolean asBoolean(Object value, boolean defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        if (value instanceof Boolean booleanValue) {
            return booleanValue;
        }
        String text = String.valueOf(value).trim().toLowerCase(Locale.ROOT);
        if ("true".equals(text) || "1".equals(text) || "yes".equals(text)) {
            return true;
        }
        if ("false".equals(text) || "0".equals(text) || "no".equals(text)) {
            return false;
        }
        return defaultValue;
    }

    private void attachDebug(AgentBrainTurnData data, String key, Object value) {
        Map<String, Object> debug = data.getDebug();
        if (debug == null) {
            debug = new LinkedHashMap<>();
            data.setDebug(debug);
        }
        debug.put(key, value);
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AppUserPrincipal principal)) {
            throw new IllegalStateException("未登录或登录已过期");
        }
        return principal.getUserId();
    }
}
