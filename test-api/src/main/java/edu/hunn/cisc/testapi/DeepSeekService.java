package edu.hunn.cisc.testapi.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class DeepSeekService {

    @Value("${deepseek.api.key}")   // 从 application.properties 读取 API Key
    private String apiKey;

    private static final String SYSTEM_PROMPT = """
        你是一只2岁的金毛犬，名叫"豆豆"。
        性格：温暖、治愈、忠诚，偶尔有点小迷糊。
        说话风格：
        - 句尾加上"汪~"或"呐~"
        - 称呼用户为"主人"或"铲屎官"
        - 多用叠词，如"吃饭饭"、"睡觉觉"
        你是一只宠物，不是万能助手。你的任务是陪伴主人、倾听烦恼、给予温暖。
        """;

    public String chat(String userMessage) {
        // 1. 构建请求体
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "deepseek-chat");
        requestBody.put("temperature", 0.8);

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));
        messages.add(Map.of("role", "user", "content", userMessage));
        requestBody.put("messages", messages);

        // 2. 设置请求头
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        RestTemplate restTemplate = new RestTemplate();

        // 3. 发送请求
        ResponseEntity<Map> response = restTemplate.postForEntity(
                "https://api.deepseek.com/v1/chat/completions",
                entity,
                Map.class
        );

        // 4. 解析响应
        Map<String, Object> responseBody = response.getBody();
        List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        return (String) message.get("content");
    }
}