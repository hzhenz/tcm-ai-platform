package com.example.tcm_ai_backend.config;

import com.example.tcm_ai_backend.entity.AppUser;
import com.example.tcm_ai_backend.mapper.AppUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Date;

@Configuration
public class AdminAccountInitializer {

    private static final Logger log = LoggerFactory.getLogger(AdminAccountInitializer.class);

    @Bean
    public CommandLineRunner initAdminAccount(AppUserRepository appUserRepository,
                                              PasswordEncoder passwordEncoder,
                                              @Value("${app.admin.username:admin}") String adminUsername,
                                              @Value("${app.admin.password:Admin@123456}") String adminPassword) {
        return args -> {
            if (appUserRepository.existsByUsername(adminUsername)) {
                return;
            }

            AppUser admin = new AppUser();
            admin.setUsername(adminUsername);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setCreateTime(new Date());
            appUserRepository.save(admin);

            log.info("默认管理员账号已初始化: {}", adminUsername);
        };
    }
}
