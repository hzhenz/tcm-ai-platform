"""
日志工具
"""

import logging
import sys
from pathlib import Path
from typing import Optional


def setup_logger(name: str, log_file: Optional[Path] = None, level: str = "INFO"):
    """设置日志记录器"""
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper()))
    logger.handlers = []  # 清除已有处理器
    
    # 格式化
    formatter = logging.Formatter(
        '%(asctime)s  [%(name)s] - [%(levelname)s] : %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # 控制台输出
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # 文件输出
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    return logger
