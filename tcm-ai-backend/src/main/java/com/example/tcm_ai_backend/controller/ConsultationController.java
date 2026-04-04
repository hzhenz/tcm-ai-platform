package com.example.tcm_ai_backend.controller;

import com.example.tcm_ai_backend.utils.Result;
import com.example.tcm_ai_backend.entity.ConsultationLog;
import com.example.tcm_ai_backend.mapper.ConsultationLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/consultation")
@CrossOrigin // 允许 Vue 跨域访问
public class ConsultationController {

    @Autowired
    private ConsultationLogRepository repository;

    @GetMapping("/history")
    public Result<List<ConsultationLog>> getHistory() {
        Long currentUserId = 1L; // 模拟当前登录用户 ID 为 1
        List<ConsultationLog> list = repository.findByUserIdOrderByCreateTimeDesc(currentUserId);
        return Result.success(list);
    }

    // 👇 ===== 我们新增的保存接口 =====
    @PostMapping("/save")
    public Result<ConsultationLog> saveLog(@RequestBody ConsultationLog log) {
        // 1. 强行把当前这条记录绑定给测试用户（ID=1）
        log.setUserId(1L);
        // 2. 补全当前时间 (如果数据库设置了默认时间，这里加上更保险，防止前端立刻查时为空)
        log.setCreateTime(new Date());

        // 3. JPA 的终极魔法：一句 save 搞定插入！
        ConsultationLog savedLog = repository.save(log);

        // 4. 返回保存成功的对象
        return Result.success(savedLog);
    }

    // 👇 新增删除接口
    @DeleteMapping("/delete/{id}")
    public Result<String> deleteLog(@PathVariable Long id) {
        // 根据主键 ID 直接删除数据库里的记录
        repository.deleteById(id);
        return Result.success("删除成功");
    }
}