package com.example.tcm_ai_backend.mapper;

import com.example.tcm_ai_backend.entity.AgentTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AgentTaskRepository extends JpaRepository<AgentTask, Long> {

    List<AgentTask> findByUserIdOrderByCreateTimeDesc(Long userId);

    Optional<AgentTask> findByIdAndUserId(Long id, Long userId);
}
