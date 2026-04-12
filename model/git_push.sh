#!/bin/bash

# 检查是否提供了提交信息
if [ $# -eq 0 ]; then
    echo "❌ 错误：请提供提交信息！"
    echo "用法: $0 \"你的提交信息\""
    echo "示例: $0 \"更新配置文件\""
    exit 1
fi

COMMIT_MSG="$1"

# 获取脚本所在目录，并切换到该目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || { echo "❌ 无法进入脚本所在目录"; exit 1; }

echo "工作目录: $SCRIPT_DIR"
echo "提交信息: $COMMIT_MSG"

# 执行 git add .
echo "→ 正在执行 git add ."
git add .
if [ $? -ne 0 ]; then
    echo "❌ git add 失败"
    exit 1
fi

# 执行 git commit
echo "→ 正在执行 git commit -m \"${COMMIT_MSG}\""
git commit -m "${COMMIT_MSG}"
if [ $? -ne 0 ]; then
    echo "❌ git commit 失败"
    exit 1
fi

# 执行 git push
echo "→ 正在执行 git push"
git push
if [ $? -ne 0 ]; then
    echo "❌ git push 失败"
    exit 1
fi

echo "✅ Git 提交并推送成功！"