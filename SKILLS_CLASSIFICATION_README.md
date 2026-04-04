# OpenClaw 技能库分类系统

## 快速开始

### 📂 新的分类结构

你现在有三个相关目录：

| 目录 | 说明 |
|------|------|
| **技能库参考/** | 原始的 OpenClaw 技能库（保留备份） |
| **skills_classify/** | 📍 新分类后的技能库（按 46 个类别组织） |
| **skill-classifier/** | 分类工具（脚本和文档） |

### 🎯 5,552 个技能已按以下 46 个类别分类：

- 🤖 人工智能与大型语言模型 (1,647 个)
- 💻 CLI 工具 (449 个)
- 🌐 网页与前端开发 (264 个)
- ☁️ DevOps 与云计算 (110 个)
- 📊 数据与分析 (162 个)
- 🔐 安全与密码 (108 个)
- ... 等 40 个其他类别

**详见**: [CLASSIFICATION_REPORT.md](CLASSIFICATION_REPORT.md)

---

## 📚 使用分类后的技能库

### 浏览特定类别

```bash
# 查看 AI & LLM 技能
ls skills_classify/人工智能与大型语言模型/ | head -20

# 查看所有类别
ls -la skills_classify/
```

### 搜索技能

```bash
# 在分类结果中搜索关键词
grep -r "react" skills_classify/网页与前端开发/

# 查找特定技能的元数据
cat skills_classify/人工智能与大型语言模型/某个技能/_meta.json
```

### 导入到你的项目

```bash
# 方案 1: 直接使用分类目录
import from skills_classify.人工智能与大型语言模型 import ...

# 方案 2: 引用原始位置，但用分类目录作为索引
# (保持灵活性，同时获得分类的便利)
```

---

## 🔧 重新分类或调整

### 使用分类脚本

```bash
# 重新分类（预览模式，不修改文件）
python skill-classifier/classifier.py \
  --source "技能库参考/awesome-openclaw-skills-main/skills-main/skills-main/skills" \
  --dry-run \
  --verbose

# 正式分类（覆盖现有 skills_classify）
python skill-classifier/classifier.py \
  --source "技能库参考/awesome-openclaw-skills-main/skills-main/skills-main/skills" \
  --target "skills_classify" \
  --strategy copy
```

### 调整分类规则

编辑 `skill-classifier/classifier.py` 中的 `CATEGORY_KEYWORDS` 字典，修改关键词映射后重新运行。

---

## 📈 分类统计

| 指标 | 值 |
|------|-----|
| 总技能数 | 5,552 |
| 总类别数 | 46 |
| 平均每类 | 121 个技能 |
| 最大类 | AI & LLM (1,647) |
| 最小类 | 硬件控制 (2) |
| 需手动分类 | 109 个（归入"其他"） |

---

## 📖 文档参考

- **分类脚本文档**: [skill-classifier/SKILL.md](skill-classifier/SKILL.md)
- **分类报告**: [CLASSIFICATION_REPORT.md](CLASSIFICATION_REPORT.md)
- **分类脚本代码**: [skill-classifier/classifier.py](skill-classifier/classifier.py)

---

## 💡 最佳实践

1. ✅ 保留原始 `技能库参考/` 作为备份
2. ✅ 使用 `skills_classify/` 作为主要索引
3. ✅ 定期重新分类以纳入新技能
4. ✅ 根据需要调整关键词库
5. ✅ 在分类前运行 `--dry-run` 预览结果

---

**创建日期**: 2026-02-07  
**分类工具**: OpenClaw Skill Classifier  
**技能总数**: 5,552  
**类别总数**: 46
