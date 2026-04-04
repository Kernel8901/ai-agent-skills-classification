---
name: content-distributor
description: 多平台内容分发工具。用于在知乎、豆瓣、微博等中文平台发布内容。支持：(1) 发布帖子/文章 (2) 管理多平台账号 (3) 批量分发内容 (4) 追踪发布状态。触发词：发帖、发布、分发、知乎、豆瓣、微博、推广。
---

# Content Distributor

多平台内容分发系统，支持中文社交平台的自动化发布。

## 支持的平台

| 平台 | 发帖类型 | 状态 |
|------|----------|------|
| 知乎 | 回答、文章、想法（纯文字） | ✅ 已实现 |
| 知乎 | 想法（带图片） | ⚠️ 需手动添加图片 |
| 豆瓣 | 日记、广播、小组帖 | ⚠️ 仅国内 IP |
| 微博 | 微博正文 | 🔜 待实现 |

## 快速开始

### 1. 查看内容模板

发布前可参考模板文件，也可根据需要自定义：

```bash
cat references/templates.md
```

详见 [references/templates.md](references/templates.md)

### 2. 配置凭据

首次使用前，需要配置平台凭据：

```bash
python3 scripts/configure.py --platform zhihu
python3 scripts/configure.py --platform douban
```

凭据存储在 `~/clawd/secrets/content-distributor.json`（不进 git）

### 3. 发布内容

**知乎回答：**
```bash
python3 scripts/post.py --platform zhihu --type answer \
  --question-url "https://www.zhihu.com/question/123456" \
  --content "你的回答内容"
```

**知乎文章：**
```bash
python3 scripts/post.py --platform zhihu --type article \
  --title "文章标题" \
  --content "文章正文"
```

**豆瓣日记：**
```bash
python3 scripts/post.py --platform douban --type diary \
  --title "日记标题" \
  --content "日记内容"
```

**豆瓣小组帖：**
```bash
python3 scripts/post.py --platform douban --type group \
  --group-id "group_id_here" \
  --title "帖子标题" \
  --content "帖子内容"
```

### 4. 批量分发

将同一内容分发到多个平台：

```bash
python3 scripts/distribute.py \
  --platforms zhihu,douban \
  --title "AI下一帧：本周精选" \
  --content-file content.md
```

## 凭据配置

详见 [references/credentials.md](references/credentials.md)

每个平台的认证方式不同：
- **知乎**: Cookie 认证（从浏览器获取）
- **豆瓣**: Cookie 认证（从浏览器获取）
- **微博**: Cookie 或 App Token

## 内容格式

- 支持 Markdown 格式（自动转换为平台格式）
- 支持从文件读取长文内容
- 自动处理平台字数限制

## 错误处理

- **凭据过期**: 脚本会提示重新配置
- **发布频率限制**: 自动等待或提示稍后重试
- **内容审核**: 返回平台的审核状态

## 添加新平台

参考 [references/extending.md](references/extending.md) 了解如何添加新平台支持。
