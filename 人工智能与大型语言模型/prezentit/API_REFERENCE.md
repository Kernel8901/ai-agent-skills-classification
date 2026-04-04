# Prezentit API Reference

Complete API endpoint documentation with request/response examples.

## Authentication

All requests require authentication via API key:

```
Authorization: Bearer pk_your_api_key_here
```

Or:
```
X-API-Key: pk_your_api_key_here
```

---

## Endpoints

### GET /api/v1/me/credits

Check credit balance and pricing.

**Request:**
```bash
curl -H "Authorization: Bearer pk_xxx" \
  https://prezentit.net/api/v1/me/credits
```

**Response:**
```json
{
  "credits": 100,
  "pricing": {
    "outlinePerSlide": 5,
    "designPerSlide": 10,
    "estimatedCostPerSlide": 15
  },
  "rateLimits": {
    "perMinute": 10,
    "perDay": 100
  },
  "_ai": {
    "canGenerate": true,
    "maxSlidesAffordable": 6,
    "nextSteps": ["..."]
  }
}
```

---

### GET /api/v1/themes

List all available themes.

**Request:**
```bash
curl https://prezentit.net/api/v1/themes
```

**Response:**
```json
{
  "themes": [
    { "id": "minimalist", "name": "Minimalist", "category": "Professional" },
    { "id": "corporate", "name": "Corporate Blue", "category": "Professional" }
  ],
  "categories": ["Professional", "Creative", "Tech"],
  "_ai": {
    "nextSteps": ["..."]
  }
}
```

---

### GET /api/v1/themes?search=STYLE

Search for themes by name or style.

**Request:**
```bash
curl https://prezentit.net/api/v1/themes?search=minimal
```

**Response:**
```json
{
  "searchQuery": "minimal",
  "bestMatch": {
    "id": "minimalist",
    "name": "Minimalist",
    "confidence": "exact"
  },
  "matches": [...],
  "_ai": {
    "foundMatch": true,
    "nextSteps": [
      "Use theme: \"minimalist\" in your generation request"
    ]
  }
}
```

---

### GET /api/v1/me/generation/status

Check if you have an active generation and its progress.

**Request:**
```bash
curl -H "Authorization: Bearer pk_xxx" \
  https://prezentit.net/api/v1/me/generation/status
```

**Response (no active generation):**
```json
{
  "hasActiveGeneration": false,
  "_ai": {
    "canStartNew": true,
    "nextSteps": ["You can start a new generation request"]
  }
}
```

**Response (generation in progress):**
```json
{
  "hasActiveGeneration": true,
  "generation": {
    "topic": "Introduction to Machine Learning",
    "stage": "design_progress",
    "progress": 65,
    "designsCompleted": 3,
    "designsTotal": 5,
    "startedAt": "2024-01-15T10:30:00.000Z",
    "estimatedRemainingSeconds": 90
  },
  "_ai": {
    "canStartNew": false,
    "waitingFor": "Current generation to complete",
    "suggestedAction": "Check back in 90 seconds",
    "nextSteps": [
      "Tell user: 'Your presentation is 65% complete'",
      "Wait 30-60 seconds and check again",
      "Or cancel with POST /me/generation/cancel"
    ]
  }
}
```

---

### POST /api/v1/me/generation/cancel

Cancel tracking of active generation (allows starting a new one).

**Request:**
```bash
curl -X POST \
  -H "Authorization: Bearer pk_xxx" \
  https://prezentit.net/api/v1/me/generation/cancel
```

**Response:**
```json
{
  "success": true,
  "message": "Generation tracking cancelled. You can start a new request.",
  "_ai": {
    "canStartNew": true,
    "note": "Previous generation may still complete in background"
  }
}
```

---

### POST /api/v1/presentations/generate

Generate a complete presentation.

**⚠️ CRITICAL: Always include `"stream": false` for AI agents!**

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| topic | string | Yes | What the presentation is about |
| slideCount | number | No | Number of slides (3-50), required if no outline |
| theme | string | No | Theme ID from /themes endpoint |
| stream | boolean | Yes | Must be `false` for AI agents |
| outline | object | No | External outline (skips outline generation) |
| confirmPartial | boolean | No | Set `true` to accept partial generation |

**Partial Generation Flow:**

If user doesn't have enough credits for full generation, you'll get:

```json
{
  "status": "confirmation_required",
  "code": "PARTIAL_GENERATION_AVAILABLE",
  "plan": {
    "willGenerate": { "outlines": 5, "designs": 4 },
    "willSkip": { "designs": 1 },
    "creditsToSpend": 65,
    "creditsRemaining": 0
  },
  "_ai": {
    "askUserForConfirmation": true,
    "userMessage": "You have 65 credits. I can make 5 outlines and 4 designs, but 1 slide won't have a design. Proceed?",
    "nextSteps": [
      "Tell user what will happen",
      "If they agree: Resubmit with confirmPartial: true",
      "If they decline: Offer fewer slides"
    ]
  }
}
```

To proceed after confirmation:
```json
{
  "topic": "...",
  "slideCount": 5,
  "stream": false,
  "confirmPartial": true
}
```

**Request:**
```bash
curl -X POST \
  -H "Authorization: Bearer pk_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Introduction to Machine Learning",
    "slideCount": 5,
    "theme": "minimalist",
    "stream": false
  }' \
  https://prezentit.net/api/v1/presentations/generate
```

**Response (success):**
```json
{
  "success": true,
  "data": {
    "presentationId": "uuid-here",
    "title": "Introduction to Machine Learning",
    "viewUrl": "https://prezentit.net/view/abc123",
    "downloadUrl": "https://prezentit.net/api/v1/presentations/uuid/download",
    "slideCount": 5,
    "creditsUsed": 75,
    "remainingCredits": 25,
    "_ai": {
      "success": true,
      "nextSteps": [
        "IMPORTANT: Share this link with the user immediately: https://prezentit.net/view/abc123",
        "The presentation is ready to view - no waiting needed"
      ],
      "userMessage": "Your presentation is ready! View it here: https://prezentit.net/view/abc123"
    }
  }
}
```

**Request with external outline:**
```json
{
  "topic": "Machine Learning Basics",
  "theme": "minimalist",
  "stream": false,
  "outline": {
    "slides": [
      {
        "title": "What is Machine Learning?",
        "mainIdea": "Machine learning enables computers to learn from data without explicit programming.",
        "talkingPoints": [
          "Definition of machine learning",
          "How it differs from traditional programming",
          "Real-world applications"
        ],
        "visualGuide": "Diagram showing traditional programming vs ML approach"
      }
    ]
  }
}
```

---

### GET /api/v1/docs/outline-format

Get current outline validation constraints.

**Request:**
```bash
curl https://prezentit.net/api/v1/docs/outline-format
```

**Response:**
```json
{
  "version": "1.0.0",
  "constraints": {
    "slide": { "minCount": 3, "maxCount": 50 },
    "title": { "minLength": 3, "maxLength": 100 },
    "mainIdea": { "minLength": 20, "maxLength": 500 },
    "talkingPoints": { "min": 3, "max": 7 },
    "visualGuide": { "minLength": 20, "maxLength": 500 }
  }
}
```

---

### GET /api/v1/presentations/:id

Get details of a specific presentation.

**Request:**
```bash
curl -H "Authorization: Bearer pk_xxx" \
  https://prezentit.net/api/v1/presentations/uuid-here
```

---

### GET /api/v1/presentations/:id/download

Download presentation as PDF.

**Request:**
```bash
curl -H "Authorization: Bearer pk_xxx" \
  -o presentation.pdf \
  https://prezentit.net/api/v1/presentations/uuid-here/download
```

---

## Error Responses

All errors include an `_ai` field with guidance:

```json
{
  "error": "Insufficient credits",
  "code": "INSUFFICIENT_CREDITS",
  "_ai": {
    "whatHappened": "User needs 75 credits but only has 20",
    "nextSteps": [
      "DO NOT retry this request",
      "Option 1: Offer to generate fewer slides",
      "Option 2: Tell user to buy credits"
    ],
    "userMessage": "You need 75 credits but only have 20..."
  }
}
```

---

## Rate Limits

- **5-second cooldown** between generation requests
- **No duplicate requests** within 30 seconds
- Per-API-key minute and daily limits

When rate limited, response includes:
- `retryAfter`: Seconds to wait
- `_ai.waitSeconds`: Same value for easy access
- `_ai.retryAt`: ISO timestamp when you can retry
