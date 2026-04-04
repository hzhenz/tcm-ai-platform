package com.example.tcm_ai_backend.mapper;

import com.example.tcm_ai_backend.entity.ConsultationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ConsultationLogRepository extends JpaRepository<ConsultationLog, Long> {
    // 自动根据 userId 查找并按时间倒序排列
    List<ConsultationLog> findByUserIdOrderByCreateTimeDesc(Long userId);
}