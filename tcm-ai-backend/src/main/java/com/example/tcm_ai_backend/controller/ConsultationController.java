package com.example.tcm_ai_backend.controller;

import com.example.tcm_ai_backend.dto.SaveConsultationRequest;
import com.example.tcm_ai_backend.utils.Result;
import com.example.tcm_ai_backend.entity.ConsultationLog;
import com.example.tcm_ai_backend.service.ConsultationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/consultation")
@CrossOrigin // 允许 Vue 跨域访问
public class ConsultationController {

    private final ConsultationService consultationService;

    public ConsultationController(ConsultationService consultationService) {
        this.consultationService = consultationService;
    }

    @GetMapping("/history")
    public Result<List<ConsultationLog>> getHistory() {
        return Result.success(consultationService.getHistory());
    }

    @PostMapping("/save")
    public Result<ConsultationLog> saveLog(@Valid @RequestBody SaveConsultationRequest request) {
        return Result.success(consultationService.saveLog(request));
    }

    @DeleteMapping("/delete/{id}")
    public Result<String> deleteLog(@PathVariable Long id) {
        consultationService.deleteLog(id);
        return Result.success("删除成功");
    }
}