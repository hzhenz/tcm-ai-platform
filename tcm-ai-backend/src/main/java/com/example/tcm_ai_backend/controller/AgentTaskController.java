package com.example.tcm_ai_backend.controller;

import com.example.tcm_ai_backend.dto.agent.AgentTaskApproveRequest;
import com.example.tcm_ai_backend.dto.agent.AgentTaskCreateRequest;
import com.example.tcm_ai_backend.dto.agent.AgentTaskView;
import com.example.tcm_ai_backend.service.AgentTaskService;
import com.example.tcm_ai_backend.utils.Result;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/agent/tasks")
@CrossOrigin
public class AgentTaskController {

    private final AgentTaskService agentTaskService;

    public AgentTaskController(AgentTaskService agentTaskService) {
        this.agentTaskService = agentTaskService;
    }

    @PostMapping("/create")
    public Result<AgentTaskView> createTask(@Valid @RequestBody AgentTaskCreateRequest request) {
        return Result.success(agentTaskService.createTask(request));
    }

    @GetMapping
    public Result<List<AgentTaskView>> listMyTasks() {
        return Result.success(agentTaskService.listMyTasks());
    }

    @GetMapping("/{id}")
    public Result<AgentTaskView> getTask(@PathVariable Long id) {
        return Result.success(agentTaskService.getTask(id));
    }

    @PostMapping("/{id}/approve")
    public Result<AgentTaskView> approveTask(@PathVariable Long id, @Valid @RequestBody AgentTaskApproveRequest request) {
        return Result.success(agentTaskService.approveTask(id, request));
    }
}
