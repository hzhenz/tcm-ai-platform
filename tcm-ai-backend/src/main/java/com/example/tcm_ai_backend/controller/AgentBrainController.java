package com.example.tcm_ai_backend.controller;

import com.example.tcm_ai_backend.dto.agent.brain.AgentBrainTurnData;
import com.example.tcm_ai_backend.dto.agent.brain.AgentBrainTurnRequest;
import com.example.tcm_ai_backend.security.AppUserPrincipal;
import com.example.tcm_ai_backend.service.AgentBrainProgressService;
import com.example.tcm_ai_backend.service.AgentBrainService;
import com.example.tcm_ai_backend.utils.Result;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/agent/brain")
@CrossOrigin
public class AgentBrainController {

    private final AgentBrainService agentBrainService;
    private final AgentBrainProgressService agentBrainProgressService;

    public AgentBrainController(AgentBrainService agentBrainService, AgentBrainProgressService agentBrainProgressService) {
        this.agentBrainService = agentBrainService;
        this.agentBrainProgressService = agentBrainProgressService;
    }

    @PostMapping("/turn")
    public Result<AgentBrainTurnData> turn(@Valid @RequestBody AgentBrainTurnRequest request) {
        return Result.success(agentBrainService.handleTurn(request));
    }

    @GetMapping("/progress")
    public Result<Map<String, Object>> progress(
            @RequestParam String sessionId,
            @RequestParam(defaultValue = "0") long since
    ) {
        return Result.success(agentBrainProgressService.fetch(getCurrentUserId(), sessionId, since));
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AppUserPrincipal principal)) {
            throw new IllegalStateException("未登录或登录已过期");
        }
        return principal.getUserId();
    }
}
