-- tcm-ai-platform 数据库初始化脚本（对应当前代码）
-- 适用：全新初始化

CREATE DATABASE IF NOT EXISTS tcm_ai DEFAULT CHARSET utf8mb4;
USE tcm_ai;

-- 1) 用户表：对应实体 AppUser（JWT 登录注册）
CREATE TABLE IF NOT EXISTS `app_user` (
	`id` BIGINT AUTO_INCREMENT PRIMARY KEY,
	`username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
	`password` VARCHAR(100) NOT NULL COMMENT 'BCrypt 哈希密码',
	`create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='平台用户表';

-- 2) 问诊记录表：对应实体 ConsultationLog
CREATE TABLE IF NOT EXISTS `consultation_log` (
	`id` BIGINT AUTO_INCREMENT PRIMARY KEY,
	`user_id` BIGINT NOT NULL COMMENT '用户ID',
	`title` VARCHAR(100) NOT NULL COMMENT '问诊主题',
	`messages` TEXT COMMENT '聊天内容(JSON字符串)',
	`create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '问诊时间',
	INDEX `idx_consultation_user_time` (`user_id`, `create_time`),
	CONSTRAINT `fk_consultation_app_user`
		FOREIGN KEY (`user_id`) REFERENCES `app_user` (`id`)
		ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='问诊记录表';

-- 说明：
-- 1. 当前密码必须是 BCrypt 哈希，建议通过 /api/auth/register 注册用户生成。
-- 2. 若是老库升级，请执行“数据库2.txt”中的迁移脚本。