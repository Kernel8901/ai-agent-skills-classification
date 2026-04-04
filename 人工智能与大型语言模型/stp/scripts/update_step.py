#!/usr/bin/env python3
"""
步骤状态更新工具
用法：
  python3 update_step.py <任务目录> <步骤编号> <状态> [--message "附加信息"]

状态：
  success - 成功
  failed  - 失败
"""

import sys
import os
from pathlib import Path
from datetime import datetime

def main():
    if len(sys.argv) < 4:
        print("""用法：
  python3 update_step.py <任务目录> <步骤编号> <状态> [--message "信息"]

状态：success / failed
""")
        sys.exit(1)
    
    task_dir = Path(sys.argv[1])
    step_num = int(sys.argv[2])
    status = sys.argv[3]
    
    steps_file = task_dir / "task_steps.md"
    log_file = task_dir / "task_execution.log"
    
    if not steps_file.exists():
        print(f"❌ 错误：步骤文件不存在 {steps_file}")
        sys.exit(1)
    
    # 读取日志
    message = " ".join(sys.argv[4:]) if '--message' in sys.argv else ""
    if '--message' in sys.argv:
        msg_idx = sys.argv.index('--message')
        message = " ".join(sys.argv[msg_idx+1:])
    
    # 写入日志
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    step_status = "✓" if status == "success" else "✗"
    log_line = f"[{ts}] | {status.upper()} | 步骤{step_num} | {message}"
    
    with open(log_file, 'a', encoding='utf-8') as f:
        f.write(log_line + "\n")
    
    print(log_line)
    
    # 更新步骤状态
    with open(steps_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    current_step = 0
    updated = False
    
    for line in lines:
        if line.strip().startswith('- [ ] 步骤') or line.strip().startswith('- ✓ 步骤') or line.strip().startswith('- ✗ 步骤'):
            current_step += 1
            if current_step == step_num:
                new_lines.append(line.replace('[ ]', step_status, 1))
                updated = True
            else:
                new_lines.append(line)
        else:
            new_lines.append(line)
    
    if updated:
        with open(steps_file, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print(f"✅ 步骤 {step_num} 状态已更新为 {step_status}")
    else:
        print(f"⚠️ 未找到步骤 {step_num}")


if __name__ == "__main__":
    main()
