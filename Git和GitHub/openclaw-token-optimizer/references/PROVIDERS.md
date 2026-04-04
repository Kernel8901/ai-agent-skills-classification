# Alternative AI Providers & Models

Cost-effective alternatives to reduce token spend while maintaining quality.
Updated for multi-provider support in Token Optimizer v1.1.0.

## Provider Comparison

### Anthropic (Direct)

| Model | Input $/MTok | Output $/MTok | Use Case |
|-------|-------------|---------------|----------|
| Claude Opus 4 | $15.00 | $75.00 | Best reasoning, use sparingly |
| Claude Sonnet 4.5 | $3.00 | $15.00 | Balanced, recommended default |
| Claude Haiku 4 | $0.25 | $1.25 | Fast, cheap, great for simple tasks |

**Tier mapping:** haiku=cheap, sonnet=balanced, opus=smart

### OpenAI (Direct)

| Model | Input $/MTok | Output $/MTok | Use Case |
|-------|-------------|---------------|----------|
| GPT-5 | $10.00 | $30.00 | Premium reasoning (OpenAI's best) |
| GPT-4.1 | $2.00 | $8.00 | Comparable to Opus, excellent reasoning |
| GPT-4.1-mini | $0.40 | $1.60 | Good for most tasks |
| GPT-4.1-nano | $0.10 | $0.40 | Cheapest, great for simple tasks |
| o1/o3-mini | Varies | Varies | Reasoning models, higher cost |

**Tier mapping:** nano=cheap, mini=balanced, gpt-4.1=smart, gpt-5=premium

### Google (Direct or via Vertex AI)

| Model | Input $/MTok | Output $/MTok | Use Case |
|-------|-------------|---------------|----------|
| Gemini 2.5 Pro | $1.25 | $5.00 | Best Google model, great reasoning |
| Gemini 2.5 Flash | $0.15 | $0.60 | Production-ready, balanced |
| Gemini 2.0 Flash | $0.075 | $0.30 | Very cheap, good for bulk |
| Gemini 2.0 Flash Exp | FREE | FREE | Free tier (10M tokens/day) |

**Tier mapping:** flash=cheap, 2.5-flash=balanced, pro=smart

### OpenRouter (Unified API)

Provides access to multiple providers through one API with automatic failover.

| Model | Input $/MTok | Output $/MTok | Use Case |
|-------|-------------|---------------|----------|
| anthropic/claude-opus-4 | $15.00 | $75.00 | Same as direct |
| anthropic/claude-sonnet-4.5 | $3.00 | $15.00 | Same as direct |
| anthropic/claude-haiku-4 | $0.25 | $1.25 | Same as direct |
| google/gemini-2.5-flash | $0.15 | $0.60 | Google via OpenRouter |
| openai/gpt-4.1 | $2.00 | $8.00 | OpenAI via OpenRouter |

Website: https://openrouter.ai

### Together.ai

| Model | Input $/MTok | Output $/MTok | Use Case |
|-------|-------------|---------------|----------|
| Llama 3.3 70B | $0.18 | $0.18 | Open model, fast |
| Qwen 2.5 72B | $0.18 | $0.18 | Strong at code and reasoning |
| DeepSeek V3 | $0.07 | $0.07 | Extremely cheap, capable |

Website: https://together.ai

### Local (Ollama)

| Model | Cost | Use Case |
|-------|------|----------|
| Llama 3.3 | FREE | Offline, unlimited |
| Qwen 2.5 | FREE | Offline, code-focused |
| Mistral | FREE | Offline, fast |

Note: Requires local GPU and Ollama installation.

---

## Token Optimizer Tier Mappings

The Token Optimizer uses a provider-agnostic tier system:

| Tier | Anthropic | OpenAI | Google | Description |
|------|-----------|--------|--------|-------------|
| **cheap** | claude-haiku-4 | gpt-4.1-nano | gemini-2.0-flash | Simple tasks, background ops |
| **balanced** | claude-sonnet-4-5 | gpt-4.1-mini | gemini-2.5-flash | Default for most work |
| **smart** | claude-opus-4 | gpt-4.1 | gemini-2.5-pro | Complex reasoning |
| **premium** | — | gpt-5 | — | Best available (OpenAI only) |

---

## Routing Strategy

### By Task Type

| Task Type | Recommended Tier | Example Models |
|-----------|------------------|----------------|
| Greetings, thanks, acknowledgments | cheap | Haiku, Nano, Flash |
| Heartbeat checks, cron jobs | cheap | Haiku, Nano, Flash |
| File reading, status checks | cheap | Haiku, Nano, Flash |
| Code writing, debugging | balanced | Sonnet, Mini, 2.5 Flash |
| Explanations, documentation | balanced | Sonnet, Mini, 2.5 Flash |
| Architecture design | smart | Opus, GPT-4.1, Pro |
| Deep analysis, complex reasoning | smart | Opus, GPT-4.1, Pro |

### Communication Patterns → ALWAYS Cheap

These should NEVER use balanced or smart tier:
- `hi`, `hey`, `hello`, `yo`
- `thanks`, `thank you`, `thx`
- `ok`, `sure`, `got it`, `understood`
- `yes`, `no`, `yep`, `nope`
- Single word responses
- Casual acknowledgments

### Background Tasks → ALWAYS Cheap

- Heartbeat checks
- Cronjob execution
- Log parsing
- Status monitoring
- Data extraction

---

## Cost-Optimized Stacks

### Development/Testing
1. **Gemini 2.0 Flash Exp** (free up to 10M/day)
2. **Haiku/Nano** (cheap fallback when free exhausted)
3. **Sonnet/Mini** (when quality matters)

**Monthly cost:** ~$0 for development

### Production (Personal)
1. **Haiku** for 70% of tasks (simple, background)
2. **Sonnet** for 25% of tasks (user interactions)
3. **Opus** for 5% of tasks (complex only)

**Monthly cost:** ~$3-5 for typical usage

### Production (Hosting 100 Users)
1. **Gemini Flash** via OpenRouter for bulk (80%)
2. **Haiku/Nano** for background tasks (10%)
3. **Sonnet/Mini** for user interactions (9%)
4. **Opus/GPT-4.1** for critical decisions (1%)

**Monthly cost:** ~$50-100 (vs $500+ without optimization)

### High-Volume (10,000+ requests/day)
1. **OpenRouter** with auto-failover
2. **Together.ai** for open model fallback
3. **Local Ollama** for overflow/offline
4. Aggressive routing: 85% cheap, 14% balanced, 1% smart

**Monthly cost:** Varies, 90%+ savings vs unoptimized

---

## Fallback Chains

### Rate-Limited Scenario

When your primary provider hits rate limits:

1. **Primary:** Anthropic (direct API)
2. **Fallback 1:** OpenRouter (same Claude models)
3. **Fallback 2:** OpenAI (equivalent tier)
4. **Fallback 3:** Together.ai (open models)
5. **Fallback 4:** Local Ollama (offline)

### Cost-Optimized Fallback

For maximum savings:

1. **First choice:** Gemini Flash (cheapest quality)
2. **Fallback:** Haiku (still cheap)
3. **If needed:** Sonnet (balanced)
4. **Only when required:** Opus (smart)

---

## API Key Management

### Environment Variables

```bash
# Primary provider (auto-detected)
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-proj-..."
export GOOGLE_API_KEY="AIza..."
export OPENROUTER_API_KEY="sk-or-v1-..."

# Optional: Together.ai for fallback
export TOGETHER_API_KEY="..."
```

### OpenClaw Configuration

In `~/.openclaw/openclaw.json`:

```json
{
  "providers": {
    "anthropic": {
      "apiKey": "sk-ant-...",
      "models": {
        "default": "claude-sonnet-4-5"
      }
    },
    "openai": {
      "apiKey": "sk-proj-...",
      "models": {
        "default": "gpt-4.1-mini"
      }
    }
  }
}
```

### Multiple Keys (Rate Limit Protection)

OpenClaw supports multiple API keys for the same provider:

```json
{
  "providers": {
    "anthropic": {
      "apiKeys": [
        "sk-ant-key1...",
        "sk-ant-key2...",
        "sk-ant-key3..."
      ]
    }
  }
}
```

Keys are rotated when rate limits are hit.

---

## Cost Estimation Tool

### Quick Calculation

```
Daily Cost = (tokens × model_price_per_mtok) / 1,000,000
Monthly Cost = Daily Cost × 30
```

### Example: 100K tokens/day

| Provider + Model | Input Cost | Output Cost | Total/Day | Total/Month |
|------------------|------------|-------------|-----------|-------------|
| Anthropic Opus | $1.50 | $3.75 | $5.25 | $157.50 |
| Anthropic Sonnet | $0.30 | $0.75 | $1.05 | $31.50 |
| Anthropic Haiku | $0.025 | $0.0625 | $0.0875 | $2.63 |
| OpenAI GPT-4.1 | $0.20 | $0.40 | $0.60 | $18.00 |
| OpenAI Nano | $0.01 | $0.02 | $0.03 | $0.90 |
| Google Flash | $0.0075 | $0.015 | $0.0225 | $0.68 |

### With Token Optimizer (70% context + 40% model savings)

| Baseline | Optimized | Monthly Savings |
|----------|-----------|-----------------|
| $157.50 (Opus) | $28.35 | $129.15 |
| $31.50 (Sonnet) | $5.67 | $25.83 |
| $2.63 (Haiku) | $0.47 | $2.16 |

---

## When NOT to Optimize

**Prioritize quality over cost:**
- User-facing final responses
- Critical business decisions
- Complex debugging (save time > save money)
- Creative writing where quality matters

**Use cheaper models for:**
- Background operations
- Internal processes
- First-pass analysis (escalate if needed)
- Routine checks

---

## Provider-Specific Notes

### Anthropic
- Best for safety-critical applications
- Excellent at following complex instructions
- Prompt caching available (50% savings on cached tokens)

### OpenAI
- Best developer experience
- Function calling is excellent
- Consider o1/o3 for complex reasoning tasks

### Google
- Best value for high-volume
- Free tier excellent for development
- Gemini Flash is surprisingly capable

### OpenRouter
- Best for multi-provider redundancy
- Single API, multiple backends
- Automatic failover when one provider is down

### Together.ai
- Best for open model experimentation
- No vendor lock-in
- Good for privacy-sensitive workloads

---

## Resources

- [OpenRouter Pricing](https://openrouter.ai/pricing)
- [Anthropic Pricing](https://anthropic.com/pricing)
- [OpenAI Pricing](https://openai.com/pricing)
- [Google AI Pricing](https://ai.google.dev/pricing)
- [Together.ai Pricing](https://together.ai/pricing)
