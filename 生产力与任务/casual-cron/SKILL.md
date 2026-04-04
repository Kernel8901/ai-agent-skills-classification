---
name: casual-cron
description: "Create Clawdbot cron jobs from natural language with strict run-guard rules. Use when: users ask to schedule reminders or messages (recurring or one-shot), especially via Telegram, or when they use /at or /every. Examples: 'Create a daily reminder at 8am', 'Remind me in 20 minutes', 'Send me a Telegram message at 3pm', '/every 2h'."
---

# Casual Cron

Create Clawdbot cron jobs automatically from natural language requests, with safe run-guard rules for reliable delivery.

## Cron Run Guard (Hard Rules)

- When running inside a cron job: do NOT troubleshoot, do NOT restart gateway, and do NOT check time.
- Do NOT send acknowledgements or explanations.
- Output ONLY the exact message payload and then stop.

## Scheduling Rules

When a message starts with `/at` or `/every`, schedule via the CLI (NOT the cron tool API).

Use: `openclaw cron add`

### Telegram Example (DST-safe)

- Default timezone: America/New_York (DST-aware).
- ALWAYS include delivery:
  - `--deliver --channel telegram --to <TELEGRAM_CHAT_ID>`

#### /at (one-shot)
- If user gives a clock time (e.g., "3pm"), convert to ISO with offset computed for America/New_York on that date (DST-safe).
- Prefer relative times for near-term reminders (e.g., `--at "20m"`).
- Use `--session isolated --message "Output exactly: <task>"`.
- Always include `--delete-after-run`.

#### /every (repeating)
- If interval: use `--every "<duration>"` (no timezone needed).
- If clock time: use `--cron "<expr>" --tz "America/New_York"`.
- Use `--session isolated --message "Output exactly: <task>"`.

#### Confirmation
- Always confirm parsed time, job name, and job id.

### Examples (DST-safe)

One-shot, clock time (DST-aware):
openclaw cron add \
  --name "Reminder example" \
  --at "2026-01-28T15:00:00-05:00" \
  --session isolated \
  --message "Output exactly: <TASK>" \
  --deliver \
  --channel telegram \
  --to <TELEGRAM_CHAT_ID> \
  --delete-after-run

One-shot, relative time:
openclaw cron add \
  --name "Reminder in 20m" \
  --at "20m" \
  --session isolated \
  --message "Output exactly: <TASK>" \
  --deliver \
  --channel telegram \
  --to <TELEGRAM_CHAT_ID> \
  --delete-after-run

Repeating, clock time (DST-aware):
openclaw cron add \
  --name "Daily 3pm reminder" \
  --cron "0 15 * * *" \
  --tz "America/New_York" \
  --session isolated \
  --message "Output exactly: <TASK>" \
  --deliver \
  --channel telegram \
  --to <TELEGRAM_CHAT_ID>

Repeating, interval:
openclaw cron add \
  --name "Every 2 hours" \
  --every "2h" \
  --session isolated \
  --message "Output exactly: <TASK>" \
  --deliver \
  --channel telegram \
  --to <TELEGRAM_CHAT_ID>

## Trigger Patterns

Say things like:
- "Create a cron job for..."
- "Set up a reminder..."
- "Schedule a..."
- "Remind me to..."
- "Create a daily/weekly check-in..."
- "Add a recurring..."

## Examples

| You Say | What Happens |
|---------|-------------|
| "Create a daily Ikigai reminder at 8:45am" | Creates daily 8:45am Ikigai journal prompt |
| "Remind me to drink water every 2 hours" | Creates hourly water reminder |
| "Set up a weekly check-in on Mondays at 9am" | Creates Monday 9am weekly review |
| "Wake me at 7am every day" | Creates daily 7am alarm/reminder |
| "Send me a quote every morning at 6:30" | Creates daily quote at 6:30am |

## Supported Time Formats

| You Say | Cron |
|---------|------|
| "8am" | `0 8 * * *` |
| "8:45am" | `45 8 * * *` |
| "9pm" | `0 21 * * *` |
| "noon" | `0 12 * * *` |
| "midnight" | `0 0 * * *` |

## Supported Frequencies

| You Say | Cron |
|---------|------|
| "daily" / "every day" | Daily at specified time |
| "weekdays" | Mon-Fri at specified time |
| "mondays" / "every monday" | Weekly on Monday |
| "hourly" / "every hour" | Every hour at :00 |
| "every 2 hours" | `0 */2 * * *` |
| "weekly" | Weekly (defaults to Monday) |
| "monthly" | Monthly (1st of month) |

## Channels

Just mention the channel in your request:
- "on WhatsApp" → WhatsApp
- "on Telegram" → Telegram
- "on Slack" → Slack
- "on Discord" → Discord

Default: WhatsApp

## Default Messages

The skill auto-generates appropriate messages:

| Type | Default Message |
|------|-----------------|
| Ikigai | Morning journal with purpose, food, movement, connection, gratitude |
| Water | "💧 Time to drink water! Stay hydrated! 🚰" |
| Morning | "🌅 Good morning! Time for your daily check-in." |
| Evening | "🌙 Evening check-in! How was your day?" |
| Weekly | Weekly goals review |
| Default | "⏰ Your scheduled reminder is here!" |
