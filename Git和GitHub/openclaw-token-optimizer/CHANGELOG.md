# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.2] - 2026-02-06
## [1.2.3] - 2026-02-06

### Fixed
- Corrected skill name back to "OpenClaw-Token-Optimizer" (was accidentally changed during v1.2.2 publish)

---


### Security
- **REMOVED:** Local Ollama setup instructions (flagged as high-risk by ClawHub security scan)
  - Removed `curl -fsSL https://ollama.ai/install.sh | sh` commands
  - Removed `docs/LOCAL-FALLBACK.md` entirely
  - Removed all Ollama configuration examples
  - Skill now focuses exclusively on cloud API optimization

### Rationale
ClawHub security scan flagged piping remote scripts to shell (`curl | sh`) as a potential arbitrary code execution vector. The Token Optimizer skill's primary value is cloud API cost reduction through smart routing and context optimization. Local model fallback is a separate concern and should be implemented independently with proper package manager security.

---

## [1.2.0] - 2026-02-06

### Changed
- **Revised savings estimates**: Now 85-95% (was 50-80%)
  - Context optimization: 70-90% reduction (was 50-80%)
  - Model routing: 60-98% cost reduction (was 40-60%)
  - Heartbeat optimization: 90-95% savings (was 50%)
- Detailed cost analysis with real calculations and formulas
- Updated all documentation to reflect accurate savings

### Fixed
- More accurate methodology for calculating combined savings
- Clarified multiplicative effect of context + model optimizations

---

  - `model_router.py providers` — List available providers
  - `model_router.py detect` — Show auto-detected provider
- Provider-agnostic tier system:
  - `cheap` = Haiku / GPT-4.1-nano / Gemini Flash
  - `balanced` = Sonnet / GPT-4.1-mini / Gemini 2.5 Flash
  - `smart` = Opus / GPT-4.1 / Gemini Pro
  - `premium` = GPT-5 (OpenAI only)
- One-line installation instructions in README
- ClawHub-ready SKILL.md with proper metadata
- This CHANGELOG.md file

### Changed
- SKILL.md restructured for ClawHub compatibility
- README updated with clearer installation and usage instructions
- Model router now returns `all_providers` mapping in route results
- Tier names normalized to provider-agnostic format

### Fixed
- Backwards compatibility: legacy tier names (haiku/sonnet/opus) still work

## [1.0.0] - 2026-02-05

### Added
- Initial release of Token Optimizer skill
- **Context Optimizer** (`context_optimizer.py`):
  - Lazy context loading based on prompt complexity
  - `recommend` command for context bundle suggestions
  - `generate-agents` command for optimized AGENTS.md
  - 50-80% token savings on context loading
- **Model Router** (`model_router.py`):
  - Task classification by complexity
  - Communication pattern detection (greetings, thanks, etc.)
  - Background task pattern detection (heartbeat, cron, parsing)
  - Automatic model tier suggestions
- **Heartbeat Optimizer** (`heartbeat_optimizer.py`):
  - Intelligent interval tracking
  - Quiet hours support (23:00-08:00)
  - Check planning and recording
  - 50% reduction in heartbeat API calls
- **Token Tracker** (`token_tracker.py`):
  - Daily budget monitoring
  - Usage alerts (ok/warning/exceeded)
  - Model suggestions based on budget
- **Assets**:
  - `HEARTBEAT.template.md` — Drop-in optimized heartbeat
  - `cronjob-model-guide.md` — Guide for cronjob model selection
  - `config-patches.json` — Advanced configuration examples
- **References**:
  - `PROVIDERS.md` — Alternative providers, pricing, routing strategies

### Notes
- Requires Python 3.7+ (stdlib only, no dependencies)
- Works with any OpenClaw installation
- Expected savings: 50-80% reduction in token costs

---

## Version History

| Version | Date | Summary |
|---------|------|---------|
| 1.2.0 | 2026-02-06 | Local model fallback, revised savings (85-95%) |
| 1.1.0 | 2026-02-06 | Multi-provider support, ClawHub-ready |
| 1.0.0 | 2026-02-05 | Initial release |

## Contributing

When contributing, please:
1. Update this CHANGELOG.md with your changes
2. Follow the [Keep a Changelog](https://keepachangelog.com/) format
3. Use semantic versioning for version bumps
