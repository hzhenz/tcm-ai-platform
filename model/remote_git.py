import os
import subprocess
import sys

def run_command(command, cwd):
    """运行 shell 命令，并检查是否成功"""
    try:
        subprocess.run(command, cwd = cwd)
    except:
        pass

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # print(os.path.abspath(__file__))
    print(f"工作目录: {script_dir}")

