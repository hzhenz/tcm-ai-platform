package com.example.tcm_ai_backend.controller;

import com.example.tcm_ai_backend.dto.ai.AiChatRequest;
import com.example.tcm_ai_backend.service.AiGatewayService;
import com.example.tcm_ai_backend.utils.Result;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class AiGatewayController {

    private static final String IMAGE_CONTENT_PREFIX = "image/";

    private final AiGatewayService aiGatewayService;
    private final long maxImageBytes;

    public AiGatewayController(
            AiGatewayService aiGatewayService,
            @Value("${app.upload.max-image-bytes:5242880}") long maxImageBytes
    ) {
        this.aiGatewayService = aiGatewayService;
        this.maxImageBytes = maxImageBytes;
    }

    @PostMapping("/ai/chat")
    public Result<String> chat(@Valid @RequestBody AiChatRequest request) {
        return Result.success(aiGatewayService.chat(request));
    }

    @PostMapping("/herb/identify")
    public Result<Map<String, Object>> identifyHerb(@RequestParam("image") MultipartFile image) {
        validateImage(image);
        try {
            Map<String, Object> data = aiGatewayService.identifyHerb(image.getOriginalFilename(), image.getBytes());
            return Result.success(data);
        } catch (IOException e) {
            throw new IllegalStateException("读取上传图片失败");
        }
    }

    private void validateImage(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("请上传图片文件");
        }
        if (image.getSize() > maxImageBytes) {
            throw new IllegalArgumentException("图片过大，请上传 5MB 以内的图片");
        }
        String contentType = image.getContentType();
        if (contentType == null || !contentType.startsWith(IMAGE_CONTENT_PREFIX)) {
            throw new IllegalArgumentException("仅支持图片格式文件");
        }
    }
}
