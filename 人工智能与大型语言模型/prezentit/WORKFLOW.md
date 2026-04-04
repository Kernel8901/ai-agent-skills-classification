# Prezentit Workflow Guide

This document explains the complete workflow for generating presentations.

## ⚠️ CRITICAL: One Generation at a Time

Users can only have ONE generation in progress at a time. Before starting a new generation:
1. Check if one is already running: `GET /api/v1/me/generation/status`
2. If in progress, wait for it to complete or cancel it
3. Only then start a new generation

## Step-by-Step Workflow

### Step 1: Check for Active Generation
**Always start here!**

```bash
GET /api/v1/me/generation/status
```

**If generation is in progress:**
- DO NOT start another one
- Tell user their previous presentation is still being generated
- Check progress and wait

**If no generation in progress:** Proceed to Step 2

### Step 2: Check Credits
```bash
GET /api/v1/me/credits
```

**What you'll get:**
- Current credit balance
- Cost per slide (outline + design)
- Rate limits

**Decision tree:**
- If credits >= needed → Proceed to Step 3
- If credits < needed → Tell user to buy credits at https://prezentit.net/buy-credits

### Step 3: Find a Theme (Optional but Recommended)
**If user wants a specific style:**

```bash
GET /api/v1/themes?search=minimalist
```

### Step 4: Generate Presentation
**The main action:**

```bash
POST /api/v1/presentations/generate
{
  "topic": "Your topic",
  "slideCount": 5,
  "theme": "theme-id-from-step-3",
  "stream": false  ← CRITICAL for AI agents
}
```

**IMPORTANT**: Generation takes 1-3 minutes for 5 slides. With `stream: false`, the API waits and returns the complete result.

### Step 5: Handle Partial Generation Confirmation

If user doesn't have enough credits for full generation, you'll receive:

```json
{
  "status": "confirmation_required",
  "code": "PARTIAL_GENERATION_AVAILABLE",
  "plan": {
    "willGenerate": { "outlines": 5, "designs": 4 },
    "willSkip": { "designs": 1 }
  }
}
```

**You MUST ask the user:**
- "You have X credits. I can generate Y outlines and Z designs. W slide(s) won't have designs. Proceed?"
- If user confirms: Add `"confirmPartial": true` to your request
- If user declines: Offer alternatives (fewer slides or buy credits)

### Step 6: Present Results to User
**What to tell the user:**

1. ✅ "Your presentation is ready!"
2. 🔗 Share the `viewUrl` link
3. 💳 Mention remaining credits
4. 📥 Mention they can download from the link

## Status Checking (While Waiting)

If you need to check progress of an ongoing generation:

```bash
GET /api/v1/me/generation/status
```

Returns:
- Current stage (outline, design, etc.)
- Progress percentage
- Designs completed vs total
- Estimated time remaining

**Check every 30-60 seconds** - don't spam the endpoint!

## Cancelling a Generation

If user wants to cancel:

```bash
POST /api/v1/me/generation/cancel
```

Note: Already-spent credits are not refunded.

## Timing Expectations

| Slide Count | Estimated Time |
|-------------|----------------|
| 3-5 slides | 1-2 minutes |
| 6-10 slides | 2-4 minutes |
| 11-20 slides | 4-8 minutes |
| 20+ slides | 8-15 minutes |

## Credit Calculations

| Scenario | Formula |
|----------|---------|
| Standard generation | slides × 15 credits |
| With external outline | slides × 10 credits |

**Example:** 5-slide presentation = 75 credits (or 50 with your own outline)

## Error Recovery Guide

See [ERRORS.md](./ERRORS.md) for detailed error handling.
