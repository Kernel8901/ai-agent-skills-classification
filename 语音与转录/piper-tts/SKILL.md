---
name: piper-tts
description: Local text-to-speech using Piper ONNX voices - fast, private, no cloud needed.
metadata: {"openclaw":{"emoji":"🔊","requires":{"bins":["ffmpeg"]}}}
---

# Local TTS (Piper)

Fast local text-to-speech using [Piper](https://github.com/rhasspy/piper) ONNX voices. Runs entirely offline with no cloud dependencies. Supports multiple languages and voice styles.

## Usage

```bash
# Default voice (en_US-amy-medium)
~/.openclaw/skills/piper-tts/scripts/piper-tts.py "Hello, how are you today?"

# Select a specific voice
~/.openclaw/skills/piper-tts/scripts/piper-tts.py "Guten Tag" -v de_DE-thorsten-medium

# Pipe text from stdin
echo "Read this aloud" | ~/.openclaw/skills/piper-tts/scripts/piper-tts.py -

# Custom output path and format
~/.openclaw/skills/piper-tts/scripts/piper-tts.py "Hello" -o greeting.mp3 -f mp3

# Adjust speaking rate and send to Matrix room
~/.openclaw/skills/piper-tts/scripts/piper-tts.py "Slow and steady" --rate 0.8 --room-id '!abc:matrix.org'

# List available downloaded voices
~/.openclaw/skills/piper-tts/scripts/piper-tts.py --list-voices

# Quiet mode (suppress progress)
~/.openclaw/skills/piper-tts/scripts/piper-tts.py "Hello" --quiet
```

## Options

- `-v/--voice`: Voice model name (default: `en_US-amy-medium`)
- `-o/--output`: Output file path (default: auto-generated in /tmp)
- `-f/--format`: Output format: `wav`, `mp3`, `ogg` (default: `wav`)
- `--rate`: Speaking rate multiplier, 0.5-2.0 (default: 1.0)
- `--room-id`: Matrix room ID to send audio to
- `--list-voices`: List downloaded voice models
- `-q/--quiet`: Suppress progress messages

## Voices

Piper supports [900+ voices](https://rhasspy.github.io/piper-samples/) across 60+ languages. Voice models are auto-downloaded from HuggingFace on first use.

### Popular voices

| Voice | Language | Quality |
|-------|----------|---------|
| `en_US-amy-medium` (default) | English (US) | Medium |
| `en_US-lessac-high` | English (US) | High |
| `en_GB-alba-medium` | English (UK) | Medium |
| `de_DE-thorsten-medium` | German | Medium |
| `fr_FR-siwis-medium` | French | Medium |
| `es_ES-davefx-medium` | Spanish | Medium |

## Benchmark

| Voice Quality | Synthesis Time (100 words) | RTF |
|---------------|---------------------------|-----|
| Medium | ~0.3s | 0.04x |
| High | ~0.8s | 0.10x |

## openclaw.json

```json
{
  "tools": {
    "media": {
      "tts": {
        "enabled": true,
        "models": [
          {
            "type": "cli",
            "command": "~/.openclaw/skills/piper-tts/scripts/piper-tts.py",
            "args": ["--quiet", "-f", "ogg", "-o", "{{OutputPath}}", "{{Text}}"],
            "timeoutSeconds": 30
          }
        ]
      }
    }
  }
}
```
