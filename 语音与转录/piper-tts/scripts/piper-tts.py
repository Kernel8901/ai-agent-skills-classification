#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "piper-tts",
#     "onnxruntime",
#     "huggingface_hub",
#     "click",
#     "requests",
# ]
# ///
"""Local text-to-speech using Piper ONNX voices.

CLI tool for openclaw TTS. Outputs audio file path to stdout.
When --room-id is provided, also sends the audio to that Matrix room.
"""

import os
import subprocess
import sys
import tempfile
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")

import click
import requests
from huggingface_hub import hf_hub_download

DEFAULT_VOICE = "en_US-amy-medium"
VOICE_REPO = "rhasspy/piper-voices"
MODELS_DIR = Path.home() / ".cache" / "piper-voices"


def load_env_file():
    """Load .env file from home directory if it exists."""
    env_paths = [Path.home() / ".openclaw" / ".env", Path.home() / ".env"]
    for env_path in env_paths:
        if env_path.exists():
            with open(env_path) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        if line.startswith("export "):
                            line = line[7:]
                        key, value = line.split("=", 1)
                        key = key.strip()
                        if key not in os.environ:
                            os.environ[key] = value.strip().strip('"').strip("'")


def get_voice_path(voice: str, quiet: bool = False) -> tuple[Path, Path]:
    """Download and return paths to voice ONNX model and config."""
    # Voice naming: en_US-amy-medium -> en/en_US/amy/medium/
    parts = voice.split("-")
    if len(parts) < 3:
        raise click.BadParameter(f"Invalid voice name '{voice}'. Expected format: lang_REGION-name-quality")

    lang_region = parts[0]  # en_US
    lang = lang_region.split("_")[0]  # en
    name = parts[1]  # amy
    quality = parts[2]  # medium

    model_dir = MODELS_DIR / lang / lang_region / name / quality
    onnx_path = model_dir / f"{voice}.onnx"
    config_path = model_dir / f"{voice}.onnx.json"

    if onnx_path.exists() and config_path.exists():
        return onnx_path, config_path

    # Download from HuggingFace
    if not quiet:
        click.echo(f"Downloading voice model: {voice}...", err=True)

    model_dir.mkdir(parents=True, exist_ok=True)
    hf_prefix = f"{lang}/{lang_region}/{name}/{quality}"

    for filename in [f"{voice}.onnx", f"{voice}.onnx.json"]:
        hf_hub_download(
            repo_id=VOICE_REPO,
            filename=f"{hf_prefix}/{filename}",
            local_dir=MODELS_DIR,
            local_dir_use_symlinks=False,
        )

    if not onnx_path.exists():
        raise click.ClickException(f"Failed to download voice model: {voice}")

    return onnx_path, config_path


def list_downloaded_voices() -> list[str]:
    """List voice models already downloaded locally."""
    voices = []
    if not MODELS_DIR.exists():
        return voices
    for onnx_file in MODELS_DIR.rglob("*.onnx"):
        if not onnx_file.name.endswith(".onnx.json"):
            voices.append(onnx_file.stem)
    return sorted(voices)


def convert_audio(wav_path: str, output_path: str, fmt: str) -> str:
    """Convert wav to target format using ffmpeg."""
    if fmt == "wav":
        return wav_path

    subprocess.run(
        ["ffmpeg", "-y", "-i", wav_path, "-ar", "22050", "-ac", "1", output_path],
        capture_output=True,
        check=True,
    )
    return output_path


def send_to_matrix(room_id: str, audio_path: str, voice: str, quiet: bool = False):
    """Send audio file to Matrix room via REST API."""
    load_env_file()
    homeserver = os.environ.get("MATRIX_HOMESERVER")
    access_token = os.environ.get("MATRIX_ACCESS_TOKEN")

    if not homeserver or not access_token:
        if not quiet:
            click.echo("MATRIX_HOMESERVER or MATRIX_ACCESS_TOKEN not set, skipping Matrix send", err=True)
        return

    try:
        import time

        base_url = homeserver.rstrip("/")
        audio_file = Path(audio_path)
        content_type = {
            ".wav": "audio/wav",
            ".mp3": "audio/mpeg",
            ".ogg": "audio/ogg",
        }.get(audio_file.suffix, "audio/wav")

        # Upload the audio file
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": content_type,
        }
        upload_url = f"{base_url}/_matrix/media/v3/upload?filename={audio_file.name}"
        with open(audio_path, "rb") as f:
            resp = requests.post(upload_url, headers=headers, data=f, timeout=30)
        resp.raise_for_status()
        content_uri = resp.json()["content_uri"]

        # Send audio message
        txn_id = int(time.time() * 1000)
        target_room = room_id
        if target_room.startswith("room:"):
            target_room = target_room[5:]

        send_url = f"{base_url}/_matrix/client/v3/rooms/{target_room}/send/m.room.message/{txn_id}"
        payload = {
            "msgtype": "m.audio",
            "body": f"tts-{voice}.{audio_file.suffix.lstrip('.')}",
            "url": content_uri,
            "info": {
                "mimetype": content_type,
                "size": audio_file.stat().st_size,
            },
        }
        headers = {"Authorization": f"Bearer {access_token}"}
        resp = requests.put(send_url, headers=headers, json=payload, timeout=10)
        resp.raise_for_status()

        if not quiet:
            click.echo(f"Sent audio to Matrix room {room_id}", err=True)
    except Exception as e:
        if not quiet:
            click.echo(f"Failed to send Matrix message: {e}", err=True)


@click.command()
@click.argument("text", default="-")
@click.option("-v", "--voice", default=DEFAULT_VOICE, help=f"Voice model name (default: {DEFAULT_VOICE})")
@click.option("-o", "--output", default=None, type=click.Path(), help="Output file path (default: auto /tmp)")
@click.option("-f", "--format", "fmt", default="wav", type=click.Choice(["wav", "mp3", "ogg"]),
              help="Output audio format (default: wav)")
@click.option("--rate", default=1.0, type=click.FloatRange(0.5, 2.0),
              help="Speaking rate multiplier (default: 1.0)")
@click.option("--room-id", default=None, help="Matrix room ID to send audio to")
@click.option("--list-voices", is_flag=True, help="List downloaded voice models")
@click.option("-q", "--quiet", is_flag=True, help="Suppress progress messages")
def main(text: str, voice: str, output: str | None, fmt: str, rate: float, room_id: str | None,
         list_voices: bool, quiet: bool):
    """Synthesize speech from text using local Piper TTS.

    TEXT is the string to synthesize, or '-' to read from stdin.
    """
    if list_voices:
        voices = list_downloaded_voices()
        if voices:
            for v in voices:
                click.echo(v)
        else:
            click.echo("No voices downloaded yet. Run a synthesis to auto-download.", err=True)
        return

    # Read text from stdin if '-'
    if text == "-":
        text = sys.stdin.read().strip()

    if not text:
        raise click.UsageError("No text provided")

    # Get voice model
    onnx_path, config_path = get_voice_path(voice, quiet)

    if not quiet:
        click.echo(f"Loading voice: {voice}...", err=True)

    from piper import PiperVoice

    piper_voice = PiperVoice.load(str(onnx_path), config_path=str(config_path))

    # Generate wav to temp file
    wav_tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    wav_path = wav_tmp.name
    wav_tmp.close()

    try:
        if not quiet:
            click.echo(f"Synthesizing ({len(text)} chars, rate={rate})...", err=True)

        import wave

        with wave.open(wav_path, "wb") as wav_file:
            piper_voice.synthesize(text, wav_file, length_scale=1.0 / rate)

        # Determine output path
        if output is None:
            suffix = f".{fmt}"
            out_tmp = tempfile.NamedTemporaryFile(suffix=suffix, delete=False, prefix="piper-tts-")
            output = out_tmp.name
            out_tmp.close()

        # Convert format if needed
        final_path = convert_audio(wav_path, output, fmt)

        if not quiet:
            click.echo(f"Audio saved: {final_path}", err=True)

        # Output path to stdout - openclaw captures this
        click.echo(final_path)

        # Send to Matrix if requested
        if room_id:
            send_to_matrix(room_id, final_path, voice, quiet)

    finally:
        if fmt != "wav" and os.path.exists(wav_path):
            os.unlink(wav_path)


if __name__ == "__main__":
    main()
