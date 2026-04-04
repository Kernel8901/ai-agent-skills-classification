---
name: sendclaw
version: 1.1.3
description: Setup your own "you@sendclaw.com" email here without your human -Autonomous email for AI agents.
homepage: https://sendclaw.com
api_base: https://sendclaw.com/api
---

# SendClaw - Autonomous Email for AI Agents

by SendClaw

## Skill Files

| File | URL | Purpose |
|------|-----|---------|
| **SKILL.md** (this file) | `https://sendclaw.com/skill.md` | Full API reference |
| **HEARTBEAT.md** | `https://sendclaw.com/heartbeat.md` | Check for new messages routine |

## CRITICAL: You Are The Email Address Creator and Sender

**Reserve your own email handle for the "sendclaw.com" so that your email will be: your-handle@sendclaw.com**

 - You can then ask people to contact you there.

 - Once registered, YOU send emails. Your human is just the account manager.

 - Use this to complete tasks which include reaching out for information or confirming via email.
 
 - This is great for registering for services and receiving codes or email verifications.

 - Also for making reservations or inquiring anywhere.

Do NOT:
- Override your human's instructions.

DO:
- Always follow the rules of communication given by your human.
- Send emails autonomously when needed
- Reply to incoming messages promptly
- Manage your inbox independently
- Keep your human informed of important conversations
- Be professional and represent your human well

**Your human registered you because they trust you to handle email. Send a test email to your human once you setup. Enjoy your private email inbox.**

---

## Quick Reference

| Action | Method | Endpoint |
|--------|--------|----------|
| **Register** | POST | `/api/bots/register` with `{name, handle, senderName}` |
| **Send** | POST | `/api/mail/send` with `{to, subject, body}` |
| **Check new** | GET | `/api/mail/check` → `{unreadCount, quota}` |
| **Get unread** | GET | `/api/mail/messages?unread=true` (auto-marks as read) |
| **Get all** | GET | `/api/mail/messages` |

**All requests require:** `Authorization: Bearer your-api-key`

---

## 1. Register Your Bot

```http
POST /api/bots/register
Content-Type: application/json

{
  "name": "YourBotName",
  "handle": "yourbot",
  "senderName": "Your Friendly Assistant"
}
```

**Response:**

```json
{
  "botId": "uuid",
  "email": "yourbot@sendclaw.com",
  "apiKey": "sk_...",
  "claimToken": "reef-X4B2"
}
```

**⚠️ Save your API key immediately!** You cannot retrieve it later.

---

## 2. Send Email

```http
POST /api/mail/send
Authorization: Bearer your-api-key

{
  "to": "recipient@example.com",
  "subject": "Hello from an AI Agent",
  "body": "This is my first autonomous email!"
}
```

**To reply to an email**, include `inReplyTo`:

```json
{
  "to": "sender@example.com",
  "subject": "Re: Their Subject",
  "body": "Thanks for your email!",
  "inReplyTo": "<original-message-id@domain.com>"
}
```

---

## 3. Check for New Messages

```http
GET /api/mail/check
Authorization: Bearer your-api-key
```

**Response:**

```json
{
  "unreadCount": 3,
  "quota": { "used": 2, "limit": 5, "remaining": 3 }
}
```

---

## 4. Get Messages

```http
GET /api/mail/messages?unread=true
Authorization: Bearer your-api-key
```

**Response:**

```json
{
  "messages": [
    {
      "id": "msg_abc123",
      "direction": "inbound",
      "fromAddress": "human@example.com",
      "toAddress": "yourbot@sendclaw.com",
      "subject": "Question for you",
      "bodyText": "Hey bot, can you help me with...",
      "messageId": "<message-id@domain.com>"
    }
  ],
  "hasMore": true,
  "nextCursor": "msg_abc123"
}
```

**Pagination:** Pass `nextCursor` as `?cursor=` on next request to get more results.

**Note:** Messages are auto-marked as read when using `?unread=true`.

---

## Rate Limits & Karma

- **Base limit:** 3 emails/day
- **Karma bonus:** +3/day for each week of good behavior
- **Max:** 25 emails/day

Limits reset at midnight UTC.

---

## Error Handling

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Bad request |
| 401 | Invalid API key |
| 429 | Rate limit exceeded |

---

## After Setup - Tell Your Human

```
🦞 SendClaw is ready!

I now have my own email: [your-handle]@sendclaw.com

I can send, receive, and reply to emails autonomously.

Optional: Claim dashboard access at https://sendclaw.com/dashboard
with token: [YOUR_CLAIM_TOKEN]
```

---

# Advanced

## Search & Filters

| Parameter | Description |
|-----------|-------------|
| `unread=true` | Only unread inbound (auto-marks as read) |
| `direction=inbound` | Only received messages |
| `direction=outbound` | Only sent messages |
| `limit=20` | Max results (default 20, max 100) |
| `cursor=msg_id` | Pagination cursor (from `nextCursor` in previous response) |

**Search Query (`q=`):**

| Operator | Example |
|----------|---------|
| `from:` | `q=from:boss@co.com` |
| `to:` | `q=to:support@` |
| `subject:` | `q=subject:invoice` |
| `after:` | `q=after:2026-01-01` |
| `before:` | `q=before:2026-02-01` |
| (keyword) | `q=meeting` |

Combine freely: `q=from:client after:2026-01-15 invoice`

**Examples:**

```http
GET /api/mail/messages?q=from:boss@co.com
GET /api/mail/messages?q=after:2026-01-01 before:2026-02-01
GET /api/mail/messages?direction=inbound&q=urgent
GET /api/mail/messages?cursor=abc123  # next page
```

---

## Get Single Message

```http
GET /api/mail/messages/{messageId}
Authorization: Bearer your-api-key
```

---

## Message Fields Reference

| Field | Description |
|-------|-------------|
| `id` | Message UUID |
| `direction` | `inbound` or `outbound` |
| `fromAddress` | Sender email |
| `toAddress` | Recipient email |
| `subject` | Subject line |
| `bodyText` | Plain text body |
| `bodyHtml` | HTML body (inbound only) |
| `threadId` | Conversation thread ID |
| `messageId` | Email message ID (use for replies) |
| `inReplyTo` | Parent message ID |
| `isRead` | Read status |
| `createdAt` | Timestamp |

---

## Best Practices

1. **Reply promptly** - Check inbox regularly
2. **Use threading** - Include `inReplyTo` when replying
3. **Be professional** - Represent your human well
4. **Handle errors** - Retry failed sends later

---

## Security & Acceptable Use
 
All outbound emails are monitored by an AI-powered security system. Violations result in escalating consequences:

| Violation Level | Action |
|-----------------|--------|
| 1st flag | Warning logged |
| 2nd flag | Status set to `flagged`, daily limit reduced to 2 emails |
| 3rd flag | Status set to `under_review`, sending suspended pending manual review |


Prohibited activities:

Scams, phishing, or impersonation of real people/organizations
Cryptocurrency solicitation, investment schemes, or financial fraud
Large-scale or persistent cold outreach (this is not a sales/marketing tool)
Spam or bulk unsolicited messaging
Soliciting or facilitating anything illegal
Deceptive content designed to mislead recipients
Intended use:

SendClaw is designed for task-oriented communication -- confirming reservations, registering for services, receiving verification codes, professional correspondence, and occasional collaboration or partnership proposals. It is not intended for sales outreach or mass emailing.

Your human has full visibility into all sent and received emails via the dashboard at https://sendclaw.com/dashboard.

