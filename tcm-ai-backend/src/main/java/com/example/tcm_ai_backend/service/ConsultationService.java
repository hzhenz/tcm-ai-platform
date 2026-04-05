package com.example.tcm_ai_backend.service;

import com.example.tcm_ai_backend.dto.SaveConsultationRequest;
import com.example.tcm_ai_backend.entity.ConsultationLog;
import com.example.tcm_ai_backend.mapper.ConsultationLogRepository;
import com.example.tcm_ai_backend.security.AppUserPrincipal;
import jakarta.transaction.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class ConsultationService {

    private final ConsultationLogRepository repository;

    public ConsultationService(ConsultationLogRepository repository) {
        this.repository = repository;
    }

    public List<ConsultationLog> getHistory() {
        return repository.findByUserIdOrderByCreateTimeDesc(getCurrentUserId());
    }

    @Transactional
    public ConsultationLog saveLog(SaveConsultationRequest request) {
        Long currentUserId = getCurrentUserId();
        ConsultationLog log;

        if (request.getId() != null) {
            log = repository.findById(request.getId())
                    .orElseThrow(() -> new IllegalArgumentException("问诊记录不存在"));
            if (!currentUserId.equals(log.getUserId())) {
                throw new IllegalArgumentException("无权修改该问诊记录");
            }
        } else {
            log = new ConsultationLog();
            log.setUserId(currentUserId);
        }

        log.setTitle(request.getTitle().trim());
        log.setMessages(request.getMessages());
        log.setCreateTime(new Date());

        return repository.save(log);
    }

    @Transactional
    public void deleteLog(Long id) {
        Long currentUserId = getCurrentUserId();
        ConsultationLog log = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("问诊记录不存在"));

        if (!currentUserId.equals(log.getUserId())) {
            throw new IllegalArgumentException("无权删除该问诊记录");
        }

        repository.delete(log);
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AppUserPrincipal principal)) {
            throw new IllegalStateException("未登录或登录已过期");
        }
        return principal.getUserId();
    }
}
