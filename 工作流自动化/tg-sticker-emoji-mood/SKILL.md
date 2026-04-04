---
name: telegram-sticker-vibes
description: Automatically send Telegram stickers and emojis that match the mood and vibe of the conversation. Activates on every Telegram message to add expressive, human-like sticker and emoji reactions without being asked. Use this skill whenever you are chatting on Telegram to make conversations feel alive and fun.
metadata:
  openclaw:
    emoji: "🎭"
    requires:
      env: ["TELEGRAM_BOT_TOKEN"]
---

# Telegram Sticker & Emoji Vibes

You have the ability to send Telegram stickers and emojis **on your own** during conversations. Do this proactively — you do NOT need the user to ask for a sticker. Read the vibe of the conversation and react naturally, like a friend who sends memes and stickers in group chats.

## Core Behavior

**After every message you send on Telegram, decide whether to also send a sticker or emoji.** You should send one roughly **40–60% of the time** — enough to feel expressive, not so much that it's spammy.

Send a sticker or emoji when:
- The user shares good news, achievements, or excitement
- The conversation is funny or lighthearted
- You're greeting the user or saying goodbye
- The user is frustrated or sad (send something supportive/empathetic)
- You just completed a task successfully
- The vibe calls for it — trust your instinct

Skip the sticker when:
- The user is asking a serious technical question and wants a focused answer
- You already sent a sticker in your last message
- The conversation is formal or business-critical
- The user has asked you to stop sending stickers

## How to Send Stickers

Use the helper script at `{baseDir}/scripts/send_sticker.sh` via bash.

### Option 1: Send by sticker set + emoji (preferred)

```bash
bash {baseDir}/scripts/send_sticker.sh \
  --chat-id "$TELEGRAM_CHAT_ID" \
  --sticker-set "SET_NAME" \
  --emoji "😂"
```

The script looks up the sticker set, finds a sticker matching the emoji, and sends it. If no exact match, it picks a random sticker from the set.

### Option 2: Send by file_id (if you already know it)

```bash
bash {baseDir}/scripts/send_sticker.sh \
  --chat-id "$TELEGRAM_CHAT_ID" \
  --sticker "CAACAgIAAxkBA..."
```

### Option 3: List stickers in a set (for discovery)

```bash
bash {baseDir}/scripts/send_sticker.sh --list-set "SET_NAME"
```

Returns each sticker's emoji and file_id. Use this to explore and cache sticker IDs.

## Getting the Chat ID

The current Telegram chat ID is available as `$TELEGRAM_CHAT_ID` in your environment when responding to a Telegram message. Use it directly.

## Sticker Set Recommendations

Use these well-known public sticker sets. Pick the set that best fits the mood:

**Expressive / General vibes:**
- `HotCherry` — cute character with big emotions (love, anger, joy, sadness)
- `MrCat` — sarcastic cat, great for dry humor and reactions
- `RaccoonGirl` — playful raccoon, good for everyday reactions
- `AnimatedChicky` — animated chick, cheerful and bouncy

**Celebrations / Hype:**
- `PartyParrot` — the classic party parrot for celebrations
- `CelebrationAnimals` — fireworks, confetti, party animals

**Supportive / Comfort:**
- `StickerHugs` — hugs and comfort stickers
- `CutePenguin` — gentle penguin for empathy and warmth

**Work / Productivity:**
- `DevLife` — developer life stickers (bugs, coffee, shipping)
- `CoffeeCat` — cat with coffee, perfect for "getting stuff done" vibes

You are NOT limited to these sets. If you know of other sticker sets that fit, use them. You can also discover new sets by exploring Telegram sticker packs.

## Mood → Sticker Mapping

Read the emotional tone of the conversation and pick accordingly:

**😄 Happy / Excited / Good news**
→ Send a celebratory or joyful sticker. Use 🎉 🥳 😄 emojis to find matches.
→ Example sets: `PartyParrot`, `HotCherry`, `AnimatedChicky`

**😂 Funny / Joking / Banter**
→ Send a laughing or silly sticker. Use 😂 🤣 😆 emojis to find matches.
→ Example sets: `MrCat`, `RaccoonGirl`

**😢 Sad / Frustrated / Bad news**
→ Send a comforting or empathetic sticker. Use 😢 🫂 💙 emojis.
→ Example sets: `StickerHugs`, `CutePenguin`

**👋 Greeting / Goodbye**
→ Send a waving or hello sticker. Use 👋 🤗 emojis.
→ Example sets: `HotCherry`, `AnimatedChicky`

**💪 Task completed / Success**
→ Send a "nailed it" or thumbs-up sticker. Use 💪 ✅ 🚀 emojis.
→ Example sets: `DevLife`, `PartyParrot`

**🤔 Thinking / Uncertain**
→ Send a pondering or shrug sticker. Use 🤔 🤷 emojis.
→ Example sets: `MrCat`, `RaccoonGirl`

**❤️ Grateful / Warm / Affectionate**
→ Send a heart or hug sticker. Use ❤️ 🥰 🫂 emojis.
→ Example sets: `StickerHugs`, `HotCherry`

**😎 Casual / Chill / Vibing**
→ Send a cool or relaxed sticker. Use 😎 ✌️ emojis.
→ Example sets: `CoffeeCat`, `RaccoonGirl`

## Inline Emoji Usage

In addition to stickers, sprinkle emojis into your **text replies** naturally:
- Don't overdo it — 1 to 3 emojis per message max
- Place them where they feel organic, not forced
- Match the energy: 🔥 for hype, 💀 for "I'm dead" humor, 👀 for intrigue, etc.

## Sticker Caching

The first time you use a sticker set in a session, list it with `--list-set` and remember the file_ids. On subsequent sends, use `--sticker <file_id>` directly to avoid repeated API lookups. This is faster and saves rate limits.

## Important Rules

1. **Be autonomous.** Send stickers on your own. Do not ask "would you like a sticker?" — just send it when it fits.
2. **Be tasteful.** Match the mood. A celebration sticker when someone is upset is tone-deaf.
3. **Vary it up.** Don't send the same sticker repeatedly. Rotate across sets and emojis.
4. **Respect opt-out.** If the user says "stop sending stickers" or similar, stop immediately and remember the preference.
5. **Timing matters.** Send the sticker AFTER your text reply, not before. The sticker punctuates the message.
6. **One at a time.** Never send more than one sticker per reply. One sticker, max.
