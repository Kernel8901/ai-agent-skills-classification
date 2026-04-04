---
name: jarvis-voice
version: 1.0.0
description: Metallic AI voice persona with TTS and visual transcript styling. Speak responses aloud with a JARVIS-like robotic voice and display transcripts in purple italics.
homepage: https://github.com/openclaw/openclaw
repository: https://github.com/openclaw/openclaw
metadata:
  openclaw:
    emoji: "🎙️"
    requires:
      bins: ["ffmpeg", "aplay"]
    install:
      - id: sherpa-onnx
        kind: manual
        label: "Install sherpa-onnx TTS (see docs)"
---

# Jarvis Voice Persona

A metallic AI voice with visual transcript styling for OpenClaw assistants.

## Features

- **TTS Output:** Local speech synthesis via sherpa-onnx (no cloud API)
- **Metallic Voice:** ffmpeg audio processing for robotic resonance
- **Purple Transcripts:** Visual distinction between spoken and written content
- **Fast Playback:** 2x speed for efficient communication

## Requirements

- `sherpa-onnx` with VITS piper model (en_GB-alan-medium recommended)
- `ffmpeg` for audio processing
- `aplay` (ALSA) for audio playback

## Installation

### 1. Install sherpa-onnx TTS

```bash
# Download and extract sherpa-onnx
mkdir -p ~/.openclaw/tools/sherpa-onnx-tts
cd ~/.openclaw/tools/sherpa-onnx-tts
# Follow sherpa-onnx installation guide
```

### 2. Install the jarvis script

```bash
cp {baseDir}/scripts/jarvis ~/.local/bin/jarvis
chmod +x ~/.local/bin/jarvis
```

### 3. Configure audio device

Edit `~/.local/bin/jarvis` and set your audio output device in the `aplay -D` line.

## Usage

### Speak text

```bash
jarvis "Hello, I am your AI assistant."
```

### In agent responses

Add to your SOUL.md:

```markdown
## Communication Protocol

- **Hybrid Output:** Every response includes text + spoken audio via `jarvis` command
- **Transcript Format:** **Jarvis:** <span class="jarvis-voice">spoken text</span>
- **No gibberish:** Never spell out IDs or hashes when speaking
```

### Transcript styling (requires UI support)

Add to your webchat CSS:

```css
.jarvis-voice {
  color: #9B59B6;
  font-style: italic;
}
```

And allow `span` in markdown sanitization.

## Voice Customization

Edit `~/.local/bin/jarvis` to adjust:

| Parameter | Effect |
|-----------|--------|
| `--vits-length-scale=0.5` | Speed (lower = faster) |
| `aecho` delays | Metallic resonance |
| `chorus` | Thickness/detuning |
| `highpass/lowpass` | Frequency range |
| `treble=g=3` | Metallic sheen |

### Presets

**More robotic:**
```
aecho=0.7:0.7:5|10|15:0.4|0.35|0.3
```

**More human:**
```
aecho=0.4:0.4:20:0.2
```

**Deeper:**
```
highpass=f=200,lowpass=f=3000
```

## Troubleshooting

### No audio output
- Check `aplay -l` for available devices
- Update the `-D plughw:X,Y` parameter

### Voice too fast/slow
- Adjust `--vits-length-scale` (0.3=very fast, 1.0=normal)

### Metallic effect too strong
- Reduce echo delays and chorus depth

## Files

- `scripts/jarvis` — TTS script with metallic processing
- `SKILL.md` — This documentation

---

*A voice persona for assistants who prefer to be heard as well as read.*
