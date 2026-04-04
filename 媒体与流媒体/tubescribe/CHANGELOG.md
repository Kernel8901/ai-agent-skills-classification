# Changelog

All notable changes to TubeScribe.

## [1.1.2] - 2026-02-06

### Fixed
- **Stale queue detection crash** — timezone-aware/naive datetime comparison caused TypeError, leaving queue permanently stuck
- **Config file corruption** — `_save_kokoro_cache()` was writing internal wrapper keys (`_raw`, flat keys) back to config.json
- **HTML table rendering** — all rows rendered as `<th>` headers; body rows now correctly use `<td>`
- **XSS vulnerability in HTML output** — paragraph text was not escaped before inline formatting; `<script>` tags could pass through
- **`--no-audio` CLI flag** — was defined but never wired up
- **Empty title filenames** — videos with empty titles produced `.docx` filename; now falls back to video ID
- **URL validation** — accepted any domain with `?v=` parameter; now validates YouTube domains only
- **Comment HTML double-wrapping** — `<p align="right">` tags got wrapped in another `<p>`; raw HTML now passes through
- **`safe_unescape()` fragility** — replaced encode/decode chain with `json.loads()` approach

### Removed
- **python-docx fallback** — was a half-broken DOCX generator; fallback chain is now pandoc → HTML (cleaner, better output)
- **`set_current()` dead code** — was never called; queue uses `pop_from_queue()` instead
- **`afconvert` dependency** — `say` now outputs WAV directly via `--data-format`; no intermediate AIFF conversion

### Changed
- **Built-in TTS** — simplified from `say` → AIFF → `afconvert` → WAV to just `say` → WAV directly
- **Timestamps** — replaced `subprocess.run(["date"])` with native `datetime.now().astimezone().isoformat()`
- **Queue file locking** — added `fcntl.flock()` advisory locking to prevent corruption from concurrent access
- **Config cleanup** — removed stale flat keys from config.json

### Added
- **HTML blockquotes** — `> text` lines now render as `<blockquote>` blocks
- **`sanitize_filename()` fallback parameter** — accepts video ID as fallback for empty titles

---

## [1.1.1] - 2026-02-06

- **Non-blocking async workflow** — Sub-agent handles entire pipeline (extract → process → DOCX → audio → cleanup)
- **Queue processing** — More robust handling of multiple videos
- **Comments section** — Viewer sentiment analysis and best comments

---

## [1.1.0] - 2026-02-06

### Added
- **YouTube comments** — Fetches top 50 comments, adds Viewer Sentiment + Best Comments sections

### Changed
- **Bold headings** — Title and section headers use explicit bold (`# **Title**`) for consistent DOCX rendering

### Fixed
- Comment text and attribution were merging into single line in DOCX output

---

## [1.0.9] - 2026-02-06

### Added
- **YouTube comments** — Fetches top 50 comments, adds Comment Summary + Best Comments sections
- **yt-dlp support** — Auto-install to `~/.openclaw/tools/yt-dlp/` if not present
- **Progress feedback** — Clear step-by-step output with stages
- **Video metadata** — Channel name, upload date, and duration in output
- **Better error messages** — Human-readable errors for common issues:
  - Private videos, removed videos, no captions
  - Age-restricted, region-blocked, live streams
  - Invalid URLs, network errors, timeouts
- **CLI batch processing** — Process multiple URLs: `tubescribe url1 url2 url3`
- **Session queue** — Queue management for processing multiple videos:
  - `--queue-add URL` — Add to queue
  - `--queue-status` — Show current + queued items
  - `--queue-next` — Process next from queue
  - `--queue-clear` — Clear queue
- **Processing time estimates** — Shows estimated time based on word count

### Fixed
- **Code injection vulnerability** — Text now properly escaped with `json.dumps()`
- **Config schema compatibility** — Setup and runtime use same config format
- **Missing import** — Added `import json` for `--quiet --check-only` mode
- **Output directory default** — Now uses config value instead of current directory
- **Comment sorting** — Uses `comment_sort=top` to get highest-liked (not newest)
- **Unicode escape crash** — `safe_unescape()` handles edge cases in video descriptions
- **YouTube Shorts/Live URLs** — Now extracts video ID from `/shorts/` and `/live/` URLs

### New Config Options
- `comments.max_count` — Number of comments to fetch (default: 50)
- `comments.timeout` — Timeout for comment fetching (default: 90s)
- `queue.stale_minutes` — Consider processing stale after N minutes (default: 30)

### Output Format
- **Clickable URL** — Video URL in header is now a markdown link
- **Bold table headers** — Participants table uses `| **Name** | **Role** |`
- **Section separators** — `---` between all major sections
- **Best Comments** — Two-line format: comment text, then `   ▲ likes @Author`
- **Viewer Sentiment** — Flat section (not nested under "Comment Highlights")

### Changed
- **Metadata extraction** — Now uses `yt-dlp` if available (better data), falls back to HTML scraping
- **Transcript timeout** — Increased from 60s to 120s for long videos
- **SKILL.md output format** — Now includes video info block (channel, date, duration, URL)

## [1.0.8] - 2026-02-05

### Fixed
- Recovered from ClawHub publish disaster via `clawhub undelete`

## [1.0.7] - 2026-02-04

### Added
- Kokoro TTS integration with dynamic path detection
- Path caching for instant Kokoro startup (2.5s → 0.1ms)
- Smart dependency detection (system pip → known locations → fallback venv)
- Transcript segment merging in SKILL.md instructions

### Fixed
- MP3 output was using macOS `say` instead of Kokoro

## [1.0.0] - 2026-02-04

### Added
- Initial release
- YouTube transcript extraction via `summarize` CLI
- Sub-agent processing for speaker detection and summarization
- Document output (HTML, DOCX, Markdown)
- Audio summary generation (Kokoro TTS or macOS built-in)
- Setup wizard with dependency checking
