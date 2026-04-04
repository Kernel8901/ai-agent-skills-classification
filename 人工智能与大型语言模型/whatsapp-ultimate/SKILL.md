---
name: whatsapp-ultimate
version: 1.1.0
description: "The most comprehensive WhatsApp skill for AI agents. Full messaging (text, media, polls, stickers, voice), reactions, replies, edits, unsend, and complete group management. Native Baileys integration - no external services required."
homepage: https://github.com/openclaw/openclaw
metadata:
  openclaw:
    emoji: "📱"
    requires:
      channels: ["whatsapp"]
---

# WhatsApp Ultimate

**Everything you can do in WhatsApp, your AI agent can do too.**

This skill documents all WhatsApp capabilities available through OpenClaw's native channel integration. No external Docker services, no CLI wrappers — just direct WhatsApp Web protocol via Baileys.

---

## Prerequisites

- OpenClaw with WhatsApp channel configured
- WhatsApp account linked via QR code (`openclaw whatsapp login`)

---

## Capabilities Overview

| Category | Features |
|----------|----------|
| **Messaging** | Text, media, polls, stickers, voice notes, GIFs |
| **Interactions** | Reactions, replies/quotes, edit, unsend |
| **Groups** | Create, rename, icon, description, participants, admin, invite links |

**Total: 22 distinct actions**

---

## Messaging

### Send Text
```
message action=send channel=whatsapp to="+34612345678" message="Hello!"
```

### Send Media (Image/Video/Document)
```
message action=send channel=whatsapp to="+34612345678" message="Check this out" filePath=/path/to/image.jpg
```
Supported: JPG, PNG, GIF, MP4, PDF, DOC, etc.

### Send Poll
```
message action=poll channel=whatsapp to="+34612345678" pollQuestion="What time?" pollOption=["3pm", "4pm", "5pm"]
```

### Send Sticker
```
message action=sticker channel=whatsapp to="+34612345678" filePath=/path/to/sticker.webp
```
Must be WebP format, ideally 512x512.

### Send Voice Note
```
message action=send channel=whatsapp to="+34612345678" filePath=/path/to/audio.ogg asVoice=true
```
**Critical:** Use OGG/Opus format for WhatsApp voice notes. MP3 may not play correctly.

### Send GIF
```
message action=send channel=whatsapp to="+34612345678" filePath=/path/to/animation.mp4 gifPlayback=true
```
Convert GIF to MP4 first (WhatsApp requires this):
```bash
ffmpeg -i input.gif -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" output.mp4 -y
```

---

## Interactions

### Add Reaction
```
message action=react channel=whatsapp chatJid="34612345678@s.whatsapp.net" messageId="ABC123" emoji="🚀"
```

### Remove Reaction
```
message action=react channel=whatsapp chatJid="34612345678@s.whatsapp.net" messageId="ABC123" remove=true
```

### Reply/Quote Message
```
message action=reply channel=whatsapp to="34612345678@s.whatsapp.net" replyTo="QUOTED_MSG_ID" message="Replying to this!"
```

### Edit Message (Own Messages Only)
```
message action=edit channel=whatsapp chatJid="34612345678@s.whatsapp.net" messageId="ABC123" message="Updated text"
```

### Unsend/Delete Message
```
message action=unsend channel=whatsapp chatJid="34612345678@s.whatsapp.net" messageId="ABC123"
```

---

## Group Management

### Create Group
```
message action=group-create channel=whatsapp name="Project Team" participants=["+34612345678", "+34687654321"]
```

### Rename Group
```
message action=renameGroup channel=whatsapp groupId="123456789@g.us" name="New Name"
```

### Set Group Icon
```
message action=setGroupIcon channel=whatsapp groupId="123456789@g.us" filePath=/path/to/icon.jpg
```

### Set Group Description
```
message action=setGroupDescription channel=whatsapp groupJid="123456789@g.us" description="Team chat for Q1 project"
```

### Add Participant
```
message action=addParticipant channel=whatsapp groupId="123456789@g.us" participant="+34612345678"
```

### Remove Participant
```
message action=removeParticipant channel=whatsapp groupId="123456789@g.us" participant="+34612345678"
```

### Promote to Admin
```
message action=promoteParticipant channel=whatsapp groupJid="123456789@g.us" participants=["+34612345678"]
```

### Demote from Admin
```
message action=demoteParticipant channel=whatsapp groupJid="123456789@g.us" participants=["+34612345678"]
```

### Leave Group
```
message action=leaveGroup channel=whatsapp groupId="123456789@g.us"
```

### Get Invite Link
```
message action=getInviteCode channel=whatsapp groupJid="123456789@g.us"
```
Returns: `https://chat.whatsapp.com/XXXXX`

### Revoke Invite Link
```
message action=revokeInviteCode channel=whatsapp groupJid="123456789@g.us"
```

### Get Group Info
```
message action=getGroupInfo channel=whatsapp groupJid="123456789@g.us"
```
Returns: name, description, participants, admins, creation date.

---

## Access Control

### DM Policy
Control who can DM your agent in `openclaw.json`:

```json
{
  "channels": {
    "whatsapp": {
      "dmPolicy": "allowlist",
      "allowFrom": ["+34612345678", "+14155551234"],
      "triggerPrefix": "Jarvis"
    }
  }
}
```

| Policy | Behavior |
|--------|----------|
| `"open"` | Anyone can DM |
| `"allowlist"` | Only numbers in `allowFrom` can DM |
| `"pairing"` | Unknown senders get pairing code prompt |
| `"disabled"` | No DMs accepted |

### Group Policy
```json
{
  "channels": {
    "whatsapp": {
      "groupPolicy": "open",
      "groupAllowFrom": ["+34612345678", "+14155551234"]
    }
  }
}
```

| Policy | Behavior |
|--------|----------|
| `"open"` | Responds to mentions in any group |
| `"allowlist"` | Only from senders in `groupAllowFrom` |
| `"disabled"` | Ignores all group messages |

### Self-Chat Mode
```json
{
  "channels": {
    "whatsapp": {
      "selfChatMode": true
    }
  }
}
```
Allows messaging yourself (your "Note to Self" chat) to interact with the agent.

### Trigger Prefix
```json
{
  "channels": {
    "whatsapp": {
      "triggerPrefix": "Jarvis"
    }
  }
}
```
Messages must start with this prefix to trigger the agent. Works in:
- Self-chat
- Allowed DMs
- Any DM where you (the owner) message with the prefix

---

## JID Formats

WhatsApp uses JIDs (Jabber IDs) internally:

| Type | Format | Example |
|------|--------|---------|
| Individual | `<number>@s.whatsapp.net` | `34612345678@s.whatsapp.net` |
| Group | `<id>@g.us` | `123456789012345678@g.us` |

When using `to=` with phone numbers, OpenClaw auto-converts to JID format.

---

## Tips

### Voice Notes
Always use OGG/Opus format:
```bash
ffmpeg -i input.wav -c:a libopus -b:a 64k output.ogg
```

### Stickers
Convert images to WebP stickers:
```bash
ffmpeg -i input.png -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000" output.webp
```

### Rate Limits
WhatsApp has anti-spam measures. Avoid:
- Bulk messaging to many contacts
- Rapid-fire messages
- Messages to contacts who haven't messaged you first

### Message IDs
To react/edit/unsend, you need the message ID. Incoming messages include this in the event payload. For your own sent messages, the send response includes the ID.

---

## Comparison with Other Skills

| Feature | whatsapp-ultimate | wacli | whatsapp-automation | gif-whatsapp |
|---------|-------------------|-------|---------------------|--------------|
| Native integration | ✅ | ❌ (CLI) | ❌ (Docker) | N/A |
| Send text | ✅ | ✅ | ❌ | ❌ |
| Send media | ✅ | ✅ | ❌ | ❌ |
| Polls | ✅ | ❌ | ❌ | ❌ |
| Stickers | ✅ | ❌ | ❌ | ❌ |
| Voice notes | ✅ | ❌ | ❌ | ❌ |
| GIFs | ✅ | ❌ | ❌ | ✅ |
| Reactions | ✅ | ❌ | ❌ | ❌ |
| Reply/Quote | ✅ | ❌ | ❌ | ❌ |
| Edit | ✅ | ❌ | ❌ | ❌ |
| Unsend | ✅ | ❌ | ❌ | ❌ |
| Group create | ✅ | ❌ | ❌ | ❌ |
| Group management | ✅ (full) | ❌ | ❌ | ❌ |
| Receive messages | ✅ | ✅ | ✅ | ❌ |
| Two-way chat | ✅ | ❌ | ❌ | ❌ |
| External deps | None | Go binary | Docker + WAHA | ffmpeg |

---

## Troubleshooting

### Messages from family/friends not reaching agent
**Symptom:** You added someone to `groupAllowFrom` but their DMs don't work.

**Fix:** Add them to `allowFrom` too. `groupAllowFrom` only controls group message access, not DMs.

```json
{
  "allowFrom": ["+34612345678", "+14155551234"],
  "groupAllowFrom": ["+34612345678", "+14155551234"]
}
```

### Can't tell who sent which message in a DM
**Symptom:** All messages in a DM conversation show the same phone number.

**Cause:** Prior to OpenClaw 2026.2.1, DM messages showed the *chat ID* (the other person's number) instead of the *actual sender*.

**Fix:** Update to latest OpenClaw. The agent now correctly distinguishes between messages you send and messages the other person sends in the same conversation.

### Voice notes won't play on WhatsApp
**Symptom:** Audio file sends but shows as unplayable.

**Fix:** Use OGG/Opus format, not MP3:
```bash
ffmpeg -i input.mp3 -c:a libopus -b:a 64k output.ogg
```
Then send with `asVoice=true`.

---

## Architecture

```
Your Agent
    ↓
OpenClaw message tool
    ↓
WhatsApp Channel Plugin
    ↓
Baileys (WhatsApp Web Protocol)
    ↓
WhatsApp Servers
```

No external services. No Docker. No CLI tools. Direct protocol integration.

---

## License

MIT — Part of OpenClaw

---

## Links

- OpenClaw: https://github.com/openclaw/openclaw
- Baileys: https://github.com/WhiskeySockets/Baileys
- ClawHub: https://clawhub.com
