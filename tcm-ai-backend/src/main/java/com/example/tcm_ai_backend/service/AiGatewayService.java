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
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class AiGatewayService {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String pythonBaseUrl;
    private final String chatPath;
    private final String herbPath;
    private final long readTimeoutMs;

    public AiGatewayService(
            ObjectMapper objectMapper,
            @Value("${python.ai.base-url:http://localhost:5000}") String pythonBaseUrl,
            @Value("${python.ai.chat-path:/api/ai/chat}") String chatPath,
            @Value("${python.ai.herb-path:/api/herb/identify}") String herbPath,
            @Value("${python.ai.connect-timeout-ms:5000}") long connectTimeoutMs,
            @Value("${python.ai.read-timeout-ms:60000}") long readTimeoutMs
    ) {
        this.objectMapper = objectMapper;
        this.pythonBaseUrl = trimTrailingSlash(pythonBaseUrl);
        this.chatPath = ensureLeadingSlash(chatPath);
        this.herbPath = ensureLeadingSlash(herbPath);
        this.readTimeoutMs = readTimeoutMs;
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

    private String postJson(String url, String payload) {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofMillis(readTimeoutMs))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
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
