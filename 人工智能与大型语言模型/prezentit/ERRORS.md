# Prezentit Error Handling Guide

This document explains how to handle every error from the Prezentit API.

## Quick Error Reference

| HTTP Code | Error Code | Meaning | What to Do |
|-----------|------------|---------|------------|
| 200 | PARTIAL_GENERATION_AVAILABLE | Can only do partial generation | Ask user for confirmation |
| 400 | MISSING_TOPIC | No topic provided | Ask user what the presentation should be about |
| 400 | INVALID_SLIDE_COUNT | Slides not 3-50 | Adjust slide count within range |
| 400 | INVALID_OUTLINE | Outline validation failed | See outline errors section |
| 401 | - | Invalid API key | Check API key configuration |
| 402 | INSUFFICIENT_CREDITS | Not enough credits | Direct user to buy credits |
| 409 | GENERATION_IN_PROGRESS | Already generating | Wait or check status |
| 429 | RATE_LIMITED | Too many requests | Wait and retry (see retryAfter) |
| 429 | DUPLICATE_REQUEST | Same request sent twice | Wait or modify request |
| 500 | - | Server error | Wait 30 seconds and retry |

## Detailed Error Handling

### 200 Partial Generation Available (CONFIRMATION REQUIRED)

```json
{
  "status": "confirmation_required",
  "code": "PARTIAL_GENERATION_AVAILABLE",
  "plan": {
    "willGenerate": { "outlines": 5, "designs": 4 },
    "willSkip": { "designs": 1 },
    "creditsToSpend": 65
  }
}
```

**This is NOT an error** - it's asking for confirmation!

**What to do:**
1. Tell user exactly what will happen
2. Ask if they want to proceed
3. If yes: Resubmit with `"confirmPartial": true`
4. If no: Offer alternatives

**Response to user:**
> "You have 65 credits. I can generate 5 outlines and 4 designs, but 1 slide won't have a design. Should I proceed, or would you prefer a 4-slide presentation with full designs?"

---

### 409 Conflict - Generation Already In Progress

```json
{
  "error": "A generation is already in progress",
  "code": "GENERATION_IN_PROGRESS",
  "activeGeneration": {
    "topic": "Previous Topic",
    "progress": 45,
    "designsCompleted": 2,
    "designsTotal": 5
  }
}
```

**What to do:**
1. DO NOT start another generation
2. Tell user about the ongoing generation
3. Check status: `GET /api/v1/me/generation/status`
4. Wait for completion or offer to cancel

**Response to user:**
> "You already have a presentation being generated ('Previous Topic'). It's 45% complete. Would you like me to check on its progress, or should we wait?"

---

### 401 Unauthorized - Invalid API Key

```json
{
  "error": "Invalid or inactive API key"
}
```

**What to do:**
1. Check if PREZENTIT_API_KEY is configured
2. Verify the key starts with `pk_`
3. Tell user to get a new key at https://prezentit.net/api-keys

---

### 402 Payment Required - Insufficient Credits

```json
{
  "error": "Insufficient credits",
  "code": "INSUFFICIENT_CREDITS",
  "required": 75,
  "available": 20
}
```

**What to do:**
1. Check if partial generation is possible (see plan in response)
2. If not, tell user to buy credits
3. Offer to reduce slide count if possible

**Response to user:**
> "You need 75 credits but only have 20. You can buy more at https://prezentit.net/buy-credits"

---

### 429 Rate Limited

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

**What to do:**
1. DO NOT retry immediately
2. Wait the specified `retryAfter` seconds
3. Then retry the same request

---

### 429 Duplicate Request Blocked

```json
{
  "error": "Duplicate request detected...",
  "code": "DUPLICATE_REQUEST",
  "retryAfter": 25
}
```

**What to do:**
1. DO NOT retry the same request
2. Wait for the original request to complete
3. Or modify the request parameters

---

### 400 Invalid Outline

```json
{
  "error": "Invalid outline format",
  "code": "INVALID_OUTLINE",
  "validationErrors": [...]
}
```

**What to do:**
1. Read each validation error
2. Apply the fix suggestion
3. Resubmit the corrected outline

---

### 500 Server Error

**What to do:**
1. Wait 30 seconds
2. Retry the request once
3. If it fails again, tell user to try later

## Status Endpoint

Use `GET /api/v1/me/generation/status` to check progress:

```json
{
  "hasActiveGeneration": true,
  "generation": {
    "stage": "design_progress",
    "progress": 65,
    "designsCompleted": 3,
    "designsTotal": 5,
    "estimatedRemainingSeconds": 90
  }
}
```

Check every 30-60 seconds while waiting.

## Anti-Spam Protection

The API has built-in spam protection:

1. **One generation at a time** - can't start new while one is running
2. **5-second cooldown** between any generation requests
3. **30-second duplicate detection** - identical requests are blocked
4. **Per-minute and per-day rate limits** on your API key
