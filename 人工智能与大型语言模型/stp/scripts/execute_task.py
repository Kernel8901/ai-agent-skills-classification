#!/usr/bin/env python3
"""
结构化任务规划与执行脚本
从 Markdown 任务文档加载步骤，生成标准化任务目录和步骤文档
支持子任务模式：每个步骤作为独立任务执行
"""

import os
import sys
import re
import json
from datetime import datetime
from pathlib import Path

WORKSPACE_ROOT = Path.home() / ".openclaw" / "workspace" / "tasks"
TASK_COUNTER_FILE = WORKSPACE_ROOT / ".task_counter"


def get_next_task_id() -> int:
    """获取下一个任务 ID"""
    WORKSPACE_ROOT.mkdir(parents=True, exist_ok=True)
    
    if TASK_COUNTER_FILE.exists():
        with open(TASK_COUNTER_FILE, 'r') as f:
            try:
                current = int(f.read().strip())
            except:
                current = 0
    else:
        current = 0
    
    next_id = current + 1
    
    with open(TASK_COUNTER_FILE, 'w') as f:
        f.write(str(next_id))
    
    return next_id


def load_task_from_md(md_path: str) -> tuple:
    """从 Markdown 文件加载任务信息"""
    path = Path(md_path)
    if not path.exists():
        print(f"❌ 错误：任务文件不存在 - {md_path}")
        return None, [], {}

    content = path.read_text(encoding='utf-8')
    task_name = ""
    steps = []
    success_criteria = {}  # {step_num: criteria_text}
    lines = content.split('\n')

    for line in lines:
        if line.strip().startswith('# '):
            task_name = line.strip('# ').strip()
            break
    if not task_name:
        task_name = path.stem

    step_headers = ['步骤', '执行步骤', '任务步骤']
    end_headers = ['附', '参考', '状态说明']
    in_steps_section = False
    current_step = 0

    for line in lines:
        stripped = line.strip()
        
        if stripped.startswith('##') or stripped.startswith('###'):
            header_text = stripped.lstrip('#').strip()
            if in_steps_section:
                if any(end in header_text for end in end_headers):
                    break
            else:
                if any(kw in header_text for kw in step_headers):
                    in_steps_section = True

        if in_steps_section:
            # 解析成功标准（可能在步骤后面或单独段落）
            if stripped.startswith('**成功标准**') or stripped.startswith('成功标准') or stripped.startswith('- **成功标准'):
                if current_step > 0:
                    criteria = stripped.split('：', 1)[-1].strip()
                    if criteria:
                        success_criteria[current_step] = criteria
                continue
            
            # 解析步骤行
            step_match = re.match(r'^-\s*\[\s*\]\s*(?:步骤\s*(\d+)[:：]?\s*)?(.+)$', stripped)
            if step_match:
                step_num = step_match.group(1)
                step_desc = step_match.group(2).strip()
                
                if step_num:
                    current_step = int(step_num)
                else:
                    current_step += 1
                
                if step_desc and len(step_desc) > 2:
                    steps.append({"num": current_step, "desc": step_desc})

    return task_name, steps, success_criteria


def log_exec(task_dir: str, command: str, result_code: int, output: str = ""):
    """记录 exec 命令到日志
    
    用法：
      log_exec("task-1", "python3 script.py", 0, "output content")
    """
    task_path = Path(task_dir)
    log_file = task_path / "task_execution.log"
    
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    
    with open(log_file, 'a', encoding='utf-8') as f:
        f.write(f"\n{'='*80}\n")
        f.write(f"[{ts}] EXEC: {command}\n")
        f.write(f"[{ts}] EXEC_RESULT: exit_code={result_code}\n")
        if output:
            f.write(f"[{ts}] EXEC_OUTPUT:\n---\n{output}\n---\n")
        f.write(f"{'='*80}\n")


def log_step(task_dir: str, step_num: int, status: str, message: str = "", exec_log: str = ""):
    """记录步骤执行日志
    
    用法：
      from execute_task import log_step
      log_step("task-1", 1, "success", "执行了什么")
      log_step("task-1", 2, "failed", "失败原因")
    """
    task_path = Path(task_dir)
    log_file = task_path / "task_execution.log"
    steps_file = task_path / "task_steps.md"
    
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    step_status = "✓" if status == "success" else "✗"
    log_line = f"[{ts}] | {status.upper()} | 步骤{step_num} | {message}"
    
    with open(log_file, 'a', encoding='utf-8') as f:
        f.write(f"\n{'='*80}\n")
        f.write(log_line + "\n")
        if exec_log:
            f.write(f"\n{exec_log}\n")
        f.write(f"{'='*80}\n")
    
    print(f"📝 {log_line}")
    
    # 更新步骤状态
    if steps_file.exists():
        with open(steps_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        new_lines = []
        current_step = 0
        updated = False
        
        for line in lines:
            stripped = line.strip()
            # 检测是否是步骤行
            step_num_match = re.match(r'^-\s*[\[\]✓✗x]\s*(?:步骤\s*(\d+)[:：]?\s*)?(.+)$', stripped)
            if step_num_match:
                line_step_num = step_num_match.group(1)
                if line_step_num:
                    current_step = int(line_step_num)
                else:
                    current_step += 1
                
                if current_step == step_num:
                    # 替换为新状态
                    new_line = line
                    if '[ ]' in new_line:
                        new_line = new_line.replace('[ ]', step_status, 1)
                    elif '[x]' in new_line:
                        new_line = new_line.replace('[x]', step_status, 1)
                    elif '✓' in new_line:
                        new_line = new_line.replace('✓', step_status, 1)
                    elif '✗' in new_line:
                        new_line = new_line.replace('✗', step_status, 1)
                    new_lines.append(new_line)
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


def generate_subtask_prompt(task_dir: str, step_num: int, step_desc: str, 
                           success_criteria: str = "", context: str = "") -> str:
    """生成子任务 prompt
    
    包含步骤描述、成功标准、任务上下文、原始方案约束
    """
    prompt = f"""# 子任务：步骤 {step_num}

## 任务描述
{step_desc}

## ⚠️ 原始方案约束（必须严格遵守！）
- **必须严格按照上述任务描述执行，禁止擅自更改实现方式**
- 如果原方案要求使用特定技术栈/库，必须使用，不可替换
- 遇到技术限制或接口问题 → 按失败处理，不尝试替代方案
- **违反方案约束 = 执行失败**

## 成功标准
"""
    
    if success_criteria:
        prompt += f"{success_criteria}\n"
    else:
        prompt += """请根据以下通用标准判断成功：
1. 预期输出文件/目录已正确生成
2. 命令执行无报错（exit_code = 0）
3. 关键输出包含预期内容/关键词

## 执行要求
- 完成后明确返回 "SUCCESS" 或 "FAILED"
- 如果失败，简要说明原因（技术限制/接口问题/违反约束）
- 不要尝试替代方案，失败即终止
"""
    
    if context:
        prompt += f"\n## 上下文信息\n{context}\n"
    
    return prompt


def generate_subtask_script(task_dir: str, task_info: dict) -> str:
    """生成子任务脚本（供 sessions_spawn 使用）"""
    
    subtask_file = Path(task_dir) / f"subtask_{task_info['step_num']}.json"
    
    subtask_data = {
        "task": "执行步骤",
        "step_num": task_info['step_num'],
        "description": task_info['desc'],
        "success_criteria": task_info.get('criteria', ''),
        "workspace": str(task_dir),
        "model": "minimax/MiniMax-M2.1"
    }
    
    subtask_file.write_text(json.dumps(subtask_data, ensure_ascii=False, indent=2), 
                            encoding='utf-8')
    
    return str(subtask_file)

def main():
    # 特殊命令模式检查（必须在最前处理）
    if len(sys.argv) >= 4 and sys.argv[1] == '--log':
        task_dir = sys.argv[2]
        step_num = int(sys.argv[3])
        status = sys.argv[4]
        
        # 解析剩余参数，支持 --exec-file
        remaining = sys.argv[5:] if len(sys.argv) > 5 else []
        message = ""
        exec_log = ""
        
        i = 0
        while i < len(remaining):
            if remaining[i] == '--exec-file' and i + 1 < len(remaining):
                exec_file_path = remaining[i + 1]
                if Path(exec_file_path).exists():
                    exec_log = Path(exec_file_path).read_text(encoding='utf-8')
                i += 2
            else:
                message += remaining[i] + " "
                i += 1
        message = message.strip()
        
        log_step(task_dir, step_num, status, message, exec_log)
        return
    
    if len(sys.argv) >= 4 and sys.argv[1] == '--exec':
        task_dir = sys.argv[2]
        command = sys.argv[3] if len(sys.argv) > 3 else ""
        result_code = int(sys.argv[4]) if len(sys.argv) > 4 else 0
        output = " ".join(sys.argv[5:]) if len(sys.argv) > 5 else ""
        log_exec(task_dir, command, result_code, output)
        return
    
    if len(sys.argv) >= 3 and sys.argv[1] == '--subtask':
        task_dir = sys.argv[2]
        step_num = int(sys.argv[3])
        criteria = " ".join(sys.argv[4:]) if len(sys.argv) > 4 else ""
        
        steps_file = WORKSPACE_ROOT / task_dir / "task_steps.md"
        if not steps_file.exists():
            print(f"❌ 未找到步骤文档: {steps_file}")
            sys.exit(1)
        
        task_name, steps, _ = load_task_from_md(str(steps_file))
        for step in steps:
            if step['num'] == step_num:
                prompt = generate_subtask_prompt(task_dir, step_num, step['desc'], criteria)
                print(prompt)
                return
        print(f"❌ 未找到步骤 {step_num}")
        sys.exit(1)
    
    if len(sys.argv) < 2 or '--help' in sys.argv:
        print("""📋 结构化任务规划与执行

用法：
  # 生成任务目录和步骤文档
  python3 execute_task.py --task-file <任务文档.md>
  
  # 记录步骤执行日志
  python3 execute_task.py --log <任务目录> <步骤号> success|failed [消息]
  
  # 记录 exec 命令
  python3 execute_task.py --exec <任务目录> "<命令>" <exit_code> [输出]
  
  # 生成子任务 prompt（供 AI 执行使用）
  python3 execute_task.py --subtask <任务目录> <步骤号> [成功标准]

示例：
  python3 execute_task.py --task-file ~/task-docs/stock.md
  python3 execute_task.py --log task-1 1 success "编写股票查询脚本"
  python3 execute_task.py --exec task-1 "python3 test.py" 0 "Test passed"
  python3 execute_task.py --subtask task-1 1 "脚本文件存在且无报错"

输出：
  • tasks/task-XXX/ 任务专属目录
  • task_steps.md 步骤文档（自动更新状态）
  • task_execution.log 完整执行日志（含所有exec）
  • subtask_N.json 子任务配置
  
状态标记：
  • [ ] 待执行
  • ✓ 执行成功
  • ✗ 执行失败（任务终止）
""")
        sys.exit(0)

    task_file = None
    args = sys.argv[1:]
    for i, arg in enumerate(args):
        if arg in ['--task-file', '-f'] and i + 1 < len(args):
            task_file = args[i + 1]
            break
        elif not arg.startswith('-') and not task_file:
            task_file = arg

    if not task_file:
        print("❌ 错误：未指定任务文件")
        sys.exit(1)

    task_file = os.path.expanduser(task_file)
    task_name, steps, success_criteria = load_task_from_md(task_file)
    
    if not task_name:
        print("❌ 错误：无法加载任务文件")
        sys.exit(1)
    
    if not steps:
        print("❌ 错误：未找到有效步骤")
        sys.exit(1)
    
    # 使用自增 ID
    task_id = get_next_task_id()
    task_dir = WORKSPACE_ROOT / f"task-{task_id}"
    task_dir.mkdir(parents=True, exist_ok=True)
    
    (task_dir / "temp" / "scripts").mkdir(parents=True, exist_ok=True)
    (task_dir / "temp" / "downloads").mkdir(parents=True, exist_ok=True)
    
    steps_file = task_dir / "task_steps.md"
    log_file = task_dir / "task_execution.log"
    
    # 初始化日志
    with open(log_file, 'w', encoding='utf-8') as f:
        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
        f.write(f"{'='*80}\n")
        f.write(f"TASK: task-{task_id} - {task_name}\n")
        f.write(f"{'='*80}\n")
        f.write(f"[{ts}] INFO: 任务初始化\n")
        f.write(f"[{ts}] INFO: 源文件: {task_file}\n")
        f.write(f"[{ts}] INFO: 总步骤数: {len(steps)}\n")
    
    # 生成步骤文档
    content = f"""# 任务执行步骤文档

## 任务基础信息
- 任务名称：{task_name}
- 任务ID：task-{task_id}
- 任务创建时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- 源任务文档：{task_file}
- 总步骤数：{len(steps)}

## 核心执行步骤

"""
    for step in steps:
        content += f"- [ ] 步骤 {step['num']}：{step['desc']}\n"
        if step['num'] in success_criteria:
            content += f"\n  **成功标准**：{success_criteria[step['num']]}\n"

    content += """
## 步骤状态说明
- [ ] 待执行
- ✓ 执行成功
- ✗ 执行失败（任务终止）

## 执行规则
1. 每个步骤作为独立子任务执行
2. 按顺序执行，不可跳级
3. 成功标准：符合文档中定义的判断条件
4. 失败策略：一步失败立即终止，不尝试替代方案
5. 所有 exec 命令必须记录到 task_execution.log
"""
    
    steps_file.write_text(content, encoding='utf-8')
    
    with open(log_file, 'a', encoding='utf-8') as f:
        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
        f.write(f"[{ts}] INFO: 步骤文档生成完成\n")
        f.write(f"[{ts}] INFO: 目录创建完成: {task_dir.name}\n")

    print(f"""
╔════════════════════════════════════════════════════════════╗
║                    任务规划完成                           ║
╠════════════════════════════════════════════════════════════╣
║ 任务 ID：task-{task_id:<44}║
║ 任务名称：{task_name[:44]:<44}║
║ 步骤总数：{len(steps):<44}║
╠════════════════════════════════════════════════════════════╣
║ 任务目录：{task_dir.name:<44}║
║ 步骤文档：{steps_file.name:<44}║
║ 执行日志：{log_file.name:<44}║
╚════════════════════════════════════════════════════════════╝

📋 执行方式（推荐）：

  # 方式1：逐个步骤执行（AI 判断成功/失败）
  python3 execute_task.py --subtask {task_dir.name} 1
  # → AI 执行后，调用 --log 更新状态
  
  # 记录执行结果
  python3 execute_task.py --log {task_dir.name} 1 success "执行了什么"
  
  # 记录 exec 命令
  python3 execute_task.py --exec {task_dir.name} "python3 script.py" 0 "输出内容"

  # 失败时
  python3 execute_task.py --log {task_dir.name} 2 failed "失败原因"
  # → 任务自动终止
""")
    
    return task_id


if __name__ == "__main__":
    main()
