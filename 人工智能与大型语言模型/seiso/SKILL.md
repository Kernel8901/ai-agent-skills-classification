---
name: seisoai
description: AI image, video, music, audio, 3D, and LLM inference with x402 pay-per-request. Generate images with FLUX/FLUX-2, videos with Veo 3.1/LTX-2, music with CassetteAI, voice clone, lip sync, transcription, and Claude LLM inference. Create custom AI agents. Use when the user wants AI generation, creative content, chat completions, or agentic workflows.
metadata: {"openclaw":{"homepage":"https://seisoai.com","emoji":"🎨"}}
---

# Seisoai

Generate AI images, videos, music, audio, 3D models, and run LLM inference. Pay per request with USDC on Base — no account needed.

**Base URL:** `https://seisoai.com`

---

## Quick Start (Recommended for Agents)

The fastest way to use Seisoai is through the **Gateway API**. One endpoint for everything.

### 1. Discover Available Tools

```
GET /api/gateway/tools
```

Returns all tools with pricing and input schemas.

### 2. Invoke Any Tool

```
POST /api/gateway/invoke/{toolId}
Content-Type: application/json

{
  "prompt": "a sunset over mountains",
  ...tool-specific params
}
```

### 3. Handle x402 Payment

First request returns `HTTP 402`. Decode `PAYMENT-REQUIRED` header, sign payment, retry with `PAYMENT-SIGNATURE` header.

### Common Tool IDs

| Task | Tool ID | Price |
|------|---------|-------|
| Image (fast) | `image.generate.flux-pro-kontext` | $0.065 |
| Image (photorealistic) | `image.generate.flux-2` | $0.0325 |
| Image (premium) | `image.generate.nano-banana-pro` | $0.325 |
| Video (quality) | `video.generate.veo3` | $0.13/sec |
| Video (fast) | `video.generate.ltx-text` | $0.052/sec |
| Music | `music.generate` | $0.026/min |
| Voice clone | `audio.tts` | $0.026 |
| Transcribe | `audio.transcribe` | $0.013 |
| Image to 3D | `3d.image-to-3d` | $0.195 |

---

## When to Use Which Tool

```
User wants an image?
├─ Photorealistic / text in image → flux-2
├─ Fast general purpose → flux-pro-kontext  
├─ 360° panorama → nano-banana-pro
└─ Edit existing image → flux-pro-kontext-edit

User wants a video?
├─ High quality / complex scene → veo3
├─ Fast / simple scene → ltx-text
├─ Animate an image → veo3-image-to-video or ltx-image
└─ First + last frame → veo3-first-last-frame

User wants audio?
├─ Music from description → music.generate
├─ Sound effect → audio.sfx
├─ Clone voice / TTS → audio.tts
├─ Transcribe speech → audio.transcribe
└─ Separate stems → audio.stem-separation

User wants to edit an image?
├─ Swap faces → image.face-swap
├─ Fill in area → image.inpaint
├─ Extend image → image.outpaint
├─ Remove background → image.extract-layer
└─ Upscale → image.upscale

User wants 3D?
└─ Image to GLB model → 3d.image-to-3d

User wants multi-step workflow?
└─ Use /api/gateway/orchestrate with goal description
```

---

## x402 Payment Flow

All endpoints support x402 pay-per-request. No account needed.

```
1. POST /api/gateway/invoke/image.generate.flux-2
   → 402 Payment Required + PAYMENT-REQUIRED header

2. Decode header (base64 JSON):
   {
     "accepts": [{
       "scheme": "exact",
       "network": "eip155:8453",
       "maxAmountRequired": "32500",
       "asset": "USDC",
       "payTo": "0x..."
     }]
   }

3. Sign USDC payment with wallet

4. Retry with header:
   PAYMENT-SIGNATURE: <signed payload>

5. Success response includes:
   { "x402": { "settled": true, "transactionHash": "0x..." } }
```

### User Confirmation Required

Before signing any payment, agents MUST:
- Show amount (e.g., "$0.065 USDC")
- Show what's being purchased
- Get explicit user approval

```
Agent: Generate image of sunset? Cost: $0.065 USDC on Base. [Confirm/Cancel]
User: Confirm
Agent: [signs, generates, returns image]
```

---

## Core Endpoints

### Image Generation

**POST /api/generate/image**

```json
{
  "prompt": "a sunset over mountains, oil painting style",
  "model": "flux-pro",
  "aspect_ratio": "16:9",
  "num_images": 1
}
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `prompt` | string | required | Image description |
| `model` | string | `flux-pro` | `flux-pro`, `flux-2`, `nano-banana-pro` |
| `aspect_ratio` | string | `1:1` | `1:1`, `16:9`, `9:16`, `4:3`, `3:4` |
| `num_images` | int | 1 | 1-4 |
| `image_url` | string | - | Reference image for editing |
| `seed` | int | - | Reproducibility seed |

**Response:**
```json
{
  "success": true,
  "images": ["https://fal.media/files/..."],
  "x402": { "settled": true, "transactionHash": "0x..." }
}
```

---

### Video Generation

**POST /api/generate/video**

```json
{
  "prompt": "a cat walking through a garden",
  "model": "veo",
  "duration": "6s",
  "generate_audio": true
}
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `prompt` | string | required | Video description |
| `model` | string | `veo` | `veo` (quality) or `ltx` (fast) |
| `duration` | string | `6s` | `4s`, `6s`, `8s` for Veo; 1-10s for LTX |
| `generate_audio` | bool | true | Generate synchronized audio |
| `first_frame_url` | string | - | Starting frame image |
| `last_frame_url` | string | - | Ending frame image |

**Response:**
```json
{
  "success": true,
  "video": { "url": "https://fal.media/files/...", "content_type": "video/mp4" },
  "x402": { "settled": true, "transactionHash": "0x..." }
}
```

---

### Music Generation

**POST /api/generate/music**

```json
{
  "prompt": "upbeat jazz with piano and drums, 120 BPM",
  "duration": 60,
  "selectedGenre": "jazz"
}
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `prompt` | string | required | Music description (include genre, instruments, mood, tempo) |
| `duration` | int | 60 | Duration in seconds (10-180) |
| `selectedGenre` | string | - | `lo-fi`, `electronic`, `orchestral`, `rock`, `jazz` |

---

### Voice Clone / TTS

**POST /api/audio/voice-clone**

```json
{
  "text": "Hello, this is a test of voice cloning.",
  "voice_url": "https://example.com/reference-voice.wav",
  "language": "en"
}
```

---

### Speech-to-Text

**POST /api/audio/transcribe**

```json
{
  "audio_url": "https://example.com/speech.mp3",
  "task": "transcribe"
}
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `audio_url` | string | required | Audio/video URL |
| `task` | string | `transcribe` | `transcribe` or `translate` (to English) |
| `chunk_level` | string | `segment` | `segment` or `word` for timestamps |

---

### Sound Effects

**POST /api/audio/sfx**

```json
{
  "prompt": "thunder rumbling in the distance",
  "duration": 5
}
```

---

### Image to 3D

**POST /api/model3d/generate**

```json
{
  "image_url": "https://example.com/object.jpg",
  "generate_type": "Normal"
}
```

| Type | Price | Output |
|------|-------|--------|
| `Normal` | $0.195 | Full textured GLB |
| `Geometry` | $0.13 | Geometry only |
| `LowPoly` | $0.104 | Low-poly mesh |

---

## Image Tools

### Face Swap
```
POST /api/image-tools/face-swap
{ "source_image_url": "...", "target_image_url": "..." }
Price: $0.026
```

### Inpainting
```
POST /api/image-tools/inpaint
{ "image_url": "...", "mask_url": "...", "prompt": "a red sports car" }
Price: $0.026
```

### Outpainting
```
POST /api/image-tools/outpaint
{ "image_url": "...", "prompt": "extend the landscape", "direction": "all" }
Price: $0.026
```

### Background Removal
```
POST /api/extract/layers
{ "image_url": "..." }
Price: $0.039
```

### Upscale
```
POST /api/generate/upscale
{ "image_url": "..." }
Price: $0.039
```

### Describe Image
```
POST /api/image-tools/describe
{ "image_url": "...", "detail_level": "detailed" }
Price: $0.013
```

---

## Multi-Step Orchestration

Let Seisoai plan and execute complex workflows automatically.

**POST /api/gateway/orchestrate**

```json
{
  "goal": "Create a music video: generate an image of a sunset, animate it to video, add jazz music",
  "planOnly": false
}
```

The orchestrator will:
1. Generate the sunset image
2. Convert to video with Veo
3. Generate jazz music
4. Combine audio + video

**Response includes step-by-step results with all generated assets.**

---

## Pre-built Workflows

| Workflow | Endpoint | Description | Est. Cost |
|----------|----------|-------------|-----------|
| AI Influencer | `POST /api/workflows/ai-influencer` | Portrait → Voice → Lip Sync | ~$0.15 |
| Music Video | `POST /api/workflows/music-video` | Image → Video → Music | ~$1.00 |
| Avatar Creator | `POST /api/workflows/avatar-creator` | Description → Variations | ~$0.20 |
| Stem Separator | `POST /api/workflows/remix-visualizer` | Audio → Separated Stems | ~$0.05 |

---

## LLM Chat

**POST /api/chat-assistant/message**

```json
{
  "message": "Help me create a prompt for a fantasy landscape",
  "model": "claude-sonnet-4-5"
}
```

| Model | Best for |
|-------|----------|
| `claude-haiku-4-5` | Fast, simple tasks |
| `claude-sonnet-4-5` | Balanced (default) |
| `claude-opus-4-6` | Complex reasoning |

---

## Pricing Summary

| Category | Tool | Price |
|----------|------|-------|
| **Image** | FLUX Pro | $0.065 |
| | FLUX-2 | $0.0325 |
| | Nano Banana Pro | $0.325 |
| **Video** | Veo 3.1 | $0.13/sec |
| | LTX-2 | $0.052/sec |
| **Audio** | Music | $0.026/min |
| | SFX | $0.039 |
| | Voice Clone | $0.026 |
| | Transcribe | $0.013 |
| **Image Tools** | Face Swap | $0.026 |
| | Inpaint/Outpaint | $0.026 |
| | Upscale | $0.039 |
| | Background Remove | $0.039 |
| | Describe | $0.013 |
| **3D** | Image to 3D | $0.13-$0.195 |
| **Training** | LoRA | $0.0026/step |

All prices are final (include 30% markup over API costs).

---

## Error Handling

| Code | Meaning | Action |
|------|---------|--------|
| 402 | Payment required | Decode `PAYMENT-REQUIRED` header, sign, retry |
| 400 | Bad request | Check required params in error message |
| 500 | Server error | Retry or report issue |

---

## For Agent Developers

### Minimal Integration

```python
import requests
import base64
import json

BASE = "https://seisoai.com"

def generate_image(prompt, wallet_sign_fn):
    # First request gets 402
    r = requests.post(f"{BASE}/api/gateway/invoke/image.generate.flux-2", 
                      json={"prompt": prompt})
    
    if r.status_code == 402:
        # Decode payment requirements
        payment_req = json.loads(base64.b64decode(r.headers["PAYMENT-REQUIRED"]))
        amount = payment_req["accepts"][0]["maxAmountRequired"]
        
        # Get user confirmation
        if not confirm_with_user(f"Generate image for ${int(amount)/1e6:.4f} USDC?"):
            return None
        
        # Sign and retry
        signature = wallet_sign_fn(payment_req)
        r = requests.post(f"{BASE}/api/gateway/invoke/image.generate.flux-2",
                          json={"prompt": prompt},
                          headers={"PAYMENT-SIGNATURE": signature})
    
    return r.json()["images"][0] if r.ok else None
```

### Best Practices

1. **Use Gateway API** - One interface for all tools
2. **Cache tool list** - `GET /api/gateway/tools` doesn't change often
3. **Handle 402 gracefully** - It's expected, not an error
4. **Always confirm payments** - Never auto-sign without user approval
5. **Use orchestrate for complex tasks** - Let Seisoai plan multi-step workflows

---

## Config

```json
{
  "skills": {
    "entries": {
      "seisoai": {
        "enabled": true,
        "config": {
          "apiUrl": "https://seisoai.com"
        }
      }
    }
  }
}
```
