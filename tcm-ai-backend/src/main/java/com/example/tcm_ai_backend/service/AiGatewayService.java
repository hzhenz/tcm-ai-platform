package com.example.tcm_ai_backend.service;

import com.example.tcm_ai_backend.dto.ai.AiChatRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiGatewayService {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String pythonBaseUrl;
    private final String chatPath;
    private final String herbPath;
    private final String tongueAnalyzePath;
    private final String tongueHealthPath;
    private final String toolPlanPath;
    private final long readTimeoutMs;
    private final long tongueReadTimeoutMs;

    public AiGatewayService(
            ObjectMapper objectMapper,
            @Value("${python.ai.base-url:http://localhost:5000}") String pythonBaseUrl,
            @Value("${python.ai.chat-path:/api/ai/chat}") String chatPath,
            @Value("${python.ai.herb-path:/api/herb/identify}") String herbPath,
            @Value("${python.ai.tongue-analyze-path:/api/tongue/analyze}") String tongueAnalyzePath,
            @Value("${python.ai.tongue-health-path:/api/tongue/health}") String tongueHealthPath,
            @Value("${python.ai.tool-plan-path:/api/ai/tool-plan}") String toolPlanPath,
            @Value("${python.ai.connect-timeout-ms:5000}") long connectTimeoutMs,
            @Value("${python.ai.read-timeout-ms:60000}") long readTimeoutMs,
            @Value("${python.ai.tongue-read-timeout-ms:420000}") long tongueReadTimeoutMs
    ) {
        this.objectMapper = objectMapper;
        this.pythonBaseUrl = trimTrailingSlash(pythonBaseUrl);
        this.chatPath = ensureLeadingSlash(chatPath);
        this.herbPath = ensureLeadingSlash(herbPath);
        this.tongueAnalyzePath = ensureLeadingSlash(tongueAnalyzePath);
        this.tongueHealthPath = ensureLeadingSlash(tongueHealthPath);
        this.toolPlanPath = ensureLeadingSlash(toolPlanPath);
        this.readTimeoutMs = readTimeoutMs;
        this.tongueReadTimeoutMs = tongueReadTimeoutMs;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(connectTimeoutMs))
                .build();
    }

    public String chat(AiChatRequest request) {
        try {
            String payload = objectMapper.writeValueAsString(request);
            String responseBody = postJson(buildUrl(chatPath), payload);
            JsonNode root = objectMapper.readTree(responseBody);
            int code = root.path("code").asInt(500);
            if (code != 200) {
                throw new IllegalStateException(root.path("msg").asText("问诊服务暂时不可用"));
            }
            return root.path("data").asText("");
        } catch (IOException e) {
            throw new IllegalStateException("问诊服务响应解析失败");
        }
    }

    public Map<String, Object> identifyHerb(String filename, byte[] imageBytes) {
        try {
            Map<String, String> payload = new HashMap<>();
            payload.put("filename", filename == null ? "image.jpg" : filename);
            payload.put("imageBase64", Base64.getEncoder().encodeToString(imageBytes));

            String responseBody = postJson(buildUrl(herbPath), objectMapper.writeValueAsString(payload));
            JsonNode root = objectMapper.readTree(responseBody);
            int code = root.path("code").asInt(500);
            if (code != 200) {
                throw new IllegalStateException(root.path("msg").asText("药材识别服务暂时不可用"));
            }
            return objectMapper.convertValue(root.path("data"), objectMapper.getTypeFactory().constructMapType(LinkedHashMap.class, String.class, Object.class));
        } catch (IOException e) {
            throw new IllegalStateException("药材识别服务响应解析失败");
        }
    }

    public Map<String, Object> analyzeTongue(String filename, byte[] imageBytes, String customPrompt, boolean simple) {
        if (imageBytes == null || imageBytes.length == 0) {
            throw new IllegalArgumentException("图片内容为空");
        }

        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("filename", filename == null ? "tongue.jpg" : filename);
            payload.put("imageBase64", Base64.getEncoder().encodeToString(imageBytes));
            payload.put("simple", simple);
            if (customPrompt != null && !customPrompt.isBlank()) {
                payload.put("customPrompt", customPrompt);
            }

            String responseBody = postJson(
                    buildUrl(tongueAnalyzePath),
                    objectMapper.writeValueAsString(payload),
                    tongueReadTimeoutMs
            );
            JsonNode root = objectMapper.readTree(responseBody);
            int code = root.path("code").asInt(500);
            if (code != 200) {
                throw new IllegalStateException(root.path("msg").asText("舌诊服务暂时不可用"));
            }

            return objectMapper.convertValue(
                    root.path("data"),
                    objectMapper.getTypeFactory().constructMapType(LinkedHashMap.class, String.class, Object.class)
            );
        } catch (IOException e) {
            throw new IllegalStateException("舌诊服务响应解析失败");
        }
    }

    public Map<String, Object> tongueHealth() {
        try {
            String responseBody = getJson(buildUrl(tongueHealthPath));
            JsonNode root = objectMapper.readTree(responseBody);
            int code = root.path("code").asInt(500);
            if (code != 200) {
                throw new IllegalStateException(root.path("msg").asText("舌诊健康检查失败"));
            }

            return objectMapper.convertValue(
                    root.path("data"),
                    objectMapper.getTypeFactory().constructMapType(LinkedHashMap.class, String.class, Object.class)
            );
        } catch (IOException e) {
            throw new IllegalStateException("舌诊健康检查响应解析失败");
        }
    }

    public Map<String, Object> planAgentTool(String content, String currentPath, List<Map<String, Object>> tools) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("content", content);
            payload.put("history", new ArrayList<>());
            payload.put("tools", tools == null ? List.of() : tools);
            payload.put("context", Map.of("currentPath", currentPath == null ? "" : currentPath));

            String responseBody = postJson(buildUrl(toolPlanPath), objectMapper.writeValueAsString(payload));
            JsonNode root = objectMapper.readTree(responseBody);
            int code = root.path("code").asInt(500);
            if (code != 200) {
                throw new IllegalStateException(root.path("msg").asText("工具规划服务暂时不可用"));
            }

            return objectMapper.convertValue(
                    root.path("data"),
                    objectMapper.getTypeFactory().constructMapType(LinkedHashMap.class, String.class, Object.class)
            );
        } catch (IOException e) {
            throw new IllegalStateException("工具规划服务响应解析失败");
        }
    }

    private String postJson(String url, String payload) {
        return postJson(url, payload, readTimeoutMs);
    }

    private String postJson(String url, String payload, long timeoutMs) {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofMillis(timeoutMs))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("AI 服务请求失败，状态码: " + response.statusCode());
            }
            return response.body();
        } catch (HttpTimeoutException e) {
            throw new IllegalStateException("AI 服务响应超时，请稍后重试");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("AI 服务请求被中断");
        } catch (IOException e) {
            throw new IllegalStateException("无法连接 AI 服务，请稍后重试");
        }
    }

    private String getJson(String url) {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofMillis(readTimeoutMs))
                .GET()
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("AI 服务请求失败，状态码: " + response.statusCode());
            }
            return response.body();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("AI 服务请求被中断");
        } catch (IOException e) {
            throw new IllegalStateException("无法连接 AI 服务，请稍后重试");
        }
    }

    private String buildUrl(String path) {
        return pythonBaseUrl + path;
    }

    private String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "http://localhost:5000";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private String ensureLeadingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "/";
        }
        return value.startsWith("/") ? value : "/" + value;
    }
}
