# Twilio Skill - Complete Index

All documentation and code for Twilio voice calls, SMS, and two-way messaging.

## 📚 Documentation Files

### Quick Start (Start Here!)
- **[TWO_WAY_SMS_README.md](TWO_WAY_SMS_README.md)** ⭐ START HERE
  - Overview of the two-way SMS system
  - 3-step quick start
  - Usage examples
  - Architecture diagram
  - **Perfect for:** New users, quick overview

### Detailed Guides
- **[SKILL.md](SKILL.md)** - Complete reference
  - All features documented
  - Setup instructions
  - CLI options for all scripts
  - Troubleshooting section
  - Security best practices
  - Integration examples
  - **Perfect for:** In-depth understanding, reference

- **[TWO_WAY_SMS_SETUP.md](TWO_WAY_SMS_SETUP.md)** - Step-by-step setup
  - 5-minute quick start
  - Detailed setup for each component
  - How to expose webhook to internet (ngrok/Tailscale)
  - Webhook configuration in Twilio
  - Testing procedures
  - Troubleshooting with examples
  - **Perfect for:** Setting up for the first time

### Quick Reference
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Cheat sheet
  - Copy-paste commands
  - Common tasks
  - Troubleshooting fixes
  - API reference
  - **Perfect for:** Fast lookups, terminal reference

### Legacy
- **[README.md](README.md)** - Original Twilio skill docs
- **[QUICK_START.md](QUICK_START.md)** - Original quick start

---

## 🔧 Code Files

### Two-Way SMS System (NEW!)

#### webhook_server.py
Listens for incoming SMS from Twilio via webhook.

**What it does:**
- Receives POST requests from Twilio SMS webhook
- Validates Twilio signatures (security)
- Stores messages in conversation database
- Forwards messages to Clawdbot gateway
- Provides conversation query endpoints

**Run:**
```bash
python webhook_server.py --port 5000
```

**Endpoints:**
- `POST /sms` - Receive SMS from Twilio
- `GET /health` - Server health check
- `GET /conversations` - List all conversations
- `GET /conversations/<phone>` - Get specific conversation

**Logs:** `~/.clawd/twilio_webhook.log`
**Database:** `~/.clawd/twilio_conversations.json`

#### respond_sms.py
Send SMS replies and manage conversations.

**What it does:**
- Send SMS to any phone number
- View conversation history
- List all active conversations
- Store sent messages in database
- Phone number format normalization

**Run:**
```bash
# Send reply
python respond_sms.py --to "+19152134309" --message "Hello!"

# View conversation
python respond_sms.py --to "+19152134309" --view

# List conversations
python respond_sms.py --list-conversations
```

### Outbound SMS/Calls (Existing)

#### sms.py
Send individual SMS messages.

**Run:**
```bash
python sms.py --phone "+19152134309" --message "Hello!"
```

#### call.py
Make outbound voice calls with text-to-speech.

**Run:**
```bash
python call.py --phone "+19152134309" --message "Hello, this is a test call"
```

---

## 📋 Configuration Files

- **requirements.txt** - Python dependencies
  - twilio>=9.0.0
  - requests>=2.31.0
  - python-dotenv>=1.0.0
  - flask>=2.0.0

- **.env.example** - Sample environment variables
  - Copy to `.env` and fill with your credentials

---

## 🧪 Testing & Setup

### test_twilio_setup.sh
Comprehensive setup verification script.

**Checks:**
- Python 3.8+ installed
- All dependencies installed
- Environment variables set
- Files exist and have valid syntax
- Port availability
- Gateway connectivity
- Phone number format

**Run:**
```bash
bash test_twilio_setup.sh
```

---

## 📁 File Locations

### Code & Documentation (in repo)
```
~/clawd/skills/twilio/
├── webhook_server.py              ← Receive SMS (NEW)
├── respond_sms.py                 ← Send replies (NEW)
├── sms.py                         ← Send SMS
├── call.py                        ← Make calls
├── requirements.txt               ← Dependencies
├── SKILL.md                       ← Full docs
├── TWO_WAY_SMS_README.md         ← Quick overview (NEW)
├── TWO_WAY_SMS_SETUP.md          ← Setup guide (NEW)
├── QUICK_REFERENCE.md             ← Cheat sheet (NEW)
├── INDEX.md                       ← This file (NEW)
└── test_twilio_setup.sh           ← Test script
```

### Data & Logs (local)
```
~/.clawd/
├── twilio_conversations.json      ← Message history
└── twilio_webhook.log             ← Server logs
```

---

## 🚀 Getting Started

### First Time Users
1. Read: **[TWO_WAY_SMS_README.md](TWO_WAY_SMS_README.md)** (5 min)
2. Follow: **[TWO_WAY_SMS_SETUP.md](TWO_WAY_SMS_SETUP.md)** (15 min)
3. Test: Run `bash test_twilio_setup.sh`
4. Refer: Use **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** for commands

### Returning Users
- **Quick command?** → [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
- **Need full docs?** → [SKILL.md](SKILL.md)
- **Setup help?** → [TWO_WAY_SMS_SETUP.md](TWO_WAY_SMS_SETUP.md)
- **Troubleshooting?** → [SKILL.md](SKILL.md) → Troubleshooting

---

## 📊 Feature Matrix

| Feature | File | Status |
|---------|------|--------|
| Send SMS | `sms.py` | ✅ Existing |
| Make calls | `call.py` | ✅ Existing |
| Receive SMS | `webhook_server.py` | ✅ NEW |
| Reply to SMS | `respond_sms.py` | ✅ NEW |
| Store history | `webhook_server.py` + `respond_sms.py` | ✅ NEW |
| View conversations | `respond_sms.py` | ✅ NEW |
| Forward to gateway | `webhook_server.py` | ✅ NEW |
| Signature validation | `webhook_server.py` | ✅ NEW |
| Health endpoints | `webhook_server.py` | ✅ NEW |

---

## 🔐 Security

✅ **Implemented:**
- Twilio signature validation on webhooks
- Environment variable credentials
- No hardcoded secrets
- HTTPS enforced (ngrok/Tailscale)
- Phone number validation
- Error logging (no sensitive data in logs)

⚠️ **Best Practices:**
- Never share credentials
- Keep `.env` out of version control
- Rotate tokens periodically
- Monitor Twilio logs regularly
- Back up conversation database

See [SKILL.md](SKILL.md) → Security section for details.

---

## 🐛 Troubleshooting Guide

### "webhook_server.py not found"
```bash
cd ~/clawd/skills/twilio
ls -la webhook_server.py
```

### "Port 5000 already in use"
```bash
lsof -i :5000
kill -9 <PID>
# OR use different port
python webhook_server.py --port 5001
```

### "No messages received"
1. Check server is running: `curl http://localhost:5000/health`
2. Check webhook URL in Twilio: https://www.twilio.com/console/phone-numbers/incoming
3. Check ngrok/Tailscale is active
4. Check logs: `tail -f ~/.clawd/twilio_webhook.log`

### "SMS send fails"
1. Verify credentials: `echo $TWILIO_ACCOUNT_SID`
2. Check phone format: Must be `+19152134309`
3. Check account balance
4. See [SKILL.md](SKILL.md) → Troubleshooting

More help: Run `bash test_twilio_setup.sh` to diagnose issues.

---

## 📞 Support Resources

**Official Documentation:**
- Twilio SMS: https://www.twilio.com/docs/sms
- Twilio Voice: https://www.twilio.com/docs/voice
- Twilio Webhooks: https://www.twilio.com/docs/usage/webhooks

**Get Your Credentials:**
- Twilio Console: https://www.twilio.com/console
- API Keys: https://www.twilio.com/console/settings/api-keys
- Phone Numbers: https://www.twilio.com/console/phone-numbers

**Tools:**
- ngrok: https://ngrok.com/ (expose local server)
- Tailscale: https://tailscale.com/ (persistent tunnel)
- ElevenLabs: https://elevenlabs.io/ (TTS voices)

---

## 📝 File Descriptions

### webhook_server.py (10KB)
Flask server for receiving SMS webhooks. Production-ready with logging, signature validation, and conversation storage.

### respond_sms.py (8.5KB)
CLI tool for sending SMS replies and viewing conversations. Includes phone number normalization and JSON output.

### sms.py (2KB)
Original SMS sending script for individual messages.

### call.py (3KB)
Original voice calling script with TTS support.

### test_twilio_setup.sh (5KB)
Automated setup verification with 20+ checks.

### SKILL.md (15KB)
Comprehensive documentation covering all features, setup, usage, and troubleshooting.

### TWO_WAY_SMS_SETUP.md (13KB)
Step-by-step setup guide with detailed instructions for webhook configuration and testing.

### TWO_WAY_SMS_README.md (7KB)
Quick overview of the two-way SMS system with architecture and examples.

### QUICK_REFERENCE.md (7KB)
Copy-paste command reference for common tasks and troubleshooting.

### INDEX.md (This file)
Master index of all files and documentation.

---

## 🎯 Quick Tasks

### I want to...

**...send an SMS**
```bash
python sms.py --to "+19152134309" --message "Hello!"
```
→ See: [SKILL.md](SKILL.md) → Sending SMS Messages

**...receive SMS**
1. Start server: `python webhook_server.py`
2. Expose: `ngrok http 5000` or `tailscale funnel 5000`
3. Configure Twilio webhook
4. Text your number
→ See: [TWO_WAY_SMS_SETUP.md](TWO_WAY_SMS_SETUP.md)

**...reply to a text**
```bash
python respond_sms.py --to "+19152134309" --message "Thanks!"
```
→ See: [QUICK_REFERENCE.md](QUICK_REFERENCE.md) → Reply to SMS

**...view a conversation**
```bash
python respond_sms.py --to "+19152134309" --view
```
→ See: [QUICK_REFERENCE.md](QUICK_REFERENCE.md) → Monitoring

**...make a voice call**
```bash
python call.py --phone "+19152134309" --message "Hello!"
```
→ See: [SKILL.md](SKILL.md) → Making Voice Calls

**...set up for production**
→ See: [TWO_WAY_SMS_SETUP.md](TWO_WAY_SMS_SETUP.md) → Production Checklist

**...troubleshoot issues**
→ See: [SKILL.md](SKILL.md) → Troubleshooting

---

## 📜 License

MIT - Use freely in your projects

---

## 🔄 Version History

### v2.0 (2024-02-03) - Two-Way SMS Update
- ✨ Added webhook_server.py for receiving SMS
- ✨ Added respond_sms.py for sending replies
- ✨ Added conversation history storage
- ✨ Added comprehensive documentation
- ✨ Added test and setup scripts
- ✨ Added quick reference guide

### v1.0 (Original)
- SMS sending (sms.py)
- Voice calling (call.py)
- Basic documentation

---

## 📞 Last Updated

**2024-02-03**

For latest updates, check the repository.

---

**🎉 Ready to start?** Begin with [TWO_WAY_SMS_README.md](TWO_WAY_SMS_README.md)!
