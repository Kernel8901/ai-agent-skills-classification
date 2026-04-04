# 🎴 Feishu Interactive Cards

Create and send interactive cards to Feishu (Lark) with buttons, forms, polls, and rich UI elements. Use when replying to Feishu messages and there is ANY uncertainty - send an interactive card instead of plain text to let users choose via buttons.

## ✨ Features

- 🎯 **Interactive Buttons** - Let users respond with clicks instead of typing
- 📝 **Forms & Inputs** - Collect structured data easily
- 📊 **Polls & Surveys** - Quick voting and feedback
- ✅ **Todo Lists** - Task management with checkboxes
- 🔄 **Auto Callbacks** - Long-polling mode (no public IP needed)
- 🔒 **Security First** - Built-in input validation and safe APIs

## 🚀 Quick Start

### 1. Install

```bash
clawhub install feishu-interactive-cards
```

### 2. Start Callback Server

```bash
cd ~/.openclaw/skills/feishu-interactive-cards/scripts
node card-callback-server.js
```

### 3. Send Your First Card

```bash
node scripts/send-card.js confirmation "Confirm delete file?" --chat-id oc_xxx
```

## 📚 Documentation

See [SKILL.md](SKILL.md) for complete documentation including:
- Card templates and examples
- Callback handling patterns
- Security best practices
- Integration guide

## 🔒 Security

**Version 1.0.2** includes critical security fixes:
- ✅ Fixed command injection vulnerability (v1.0.1)
- ✅ Fixed arbitrary file read vulnerability (v1.0.2)
- ✅ Safe file operations using Node.js APIs
- ✅ Path validation and sanitization
- ✅ Template file restrictions (only allowed directories)
- ✅ Comprehensive security documentation

See [references/security-best-practices.md](references/security-best-practices.md) for details.

## 📦 What's Included

```
feishu-interactive-cards/
├── SKILL.md                    # Main documentation
├── CHANGELOG.md                # Version history
├── examples/                   # Card templates
│   ├── confirmation-card.json
│   ├── todo-card.json
│   ├── poll-card.json
│   └── form-card.json
├── scripts/                    # Helper scripts
│   ├── card-callback-server.js
│   └── send-card.js
└── references/                 # Guides
    ├── gateway-integration.md
    ├── card-design-guide.md
    └── security-best-practices.md
```

## 🤝 Contributing

Contributions welcome! Please ensure:
- All user input is validated
- No shell command injection vulnerabilities
- Security best practices are followed

## 📄 License

MIT

## 🔗 Links

- [OpenClaw Docs](https://docs.openclaw.ai)
- [ClawHub](https://clawhub.com)
- [Feishu Open Platform](https://open.feishu.cn)
