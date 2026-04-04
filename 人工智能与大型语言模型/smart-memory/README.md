# Smart Memory for OpenClaw

**Context-aware memory system with dual retrieval modes** — fast vector search when you need speed, curated Focus Agent when you need depth.

```bash
# Install and it just works
npx clawhub install smart-memory

# Optional: sync for better quality
node smart-memory/smart_memory.js --sync
```

## ✨ The Magic

**Same function call. Two modes. You choose.**

```javascript
// Fast mode (default): Direct vector search
memory_search("User principles values")

// Focus mode: Multi-pass curation for complex decisions
memory_mode('focus')
memory_search("What did we decide about the architecture?")
```

| Mode | Best For | How It Works |
|------|----------|--------------|
| **Fast** | Quick lookups, facts | Direct vector similarity (~10ms) |
| **Focus** | Decisions, synthesis | Retrieve → Rank → Synthesize (~100ms) |

## 🚀 Quick Start

### From ClawHub (Recommended)
```bash
npx clawhub install smart-memory
```
Done. `memory_search` now works with automatic mode selection.

### From GitHub
```bash
curl -sL https://raw.githubusercontent.com/BluePointDigital/smart-memory/main/install.sh | bash
```

### Manual
```bash
git clone https://github.com/BluePointDigital/smart-memory.git
cd smart-memory/smart-memory && npm install
```

## 🎯 How It Works

### Dual Retrieval Modes

```
User searches
      │
      ▼
┌─────────────┐
│  Fast Mode? │
└──────┬──────┘
   Yes │    │ No (Focus Mode)
      ▼     ▼
┌────────┐ ┌─────────────┐
│ Vector │ │ Retrieve 20+│
│ Search │ │ chunks      │
└────┬───┘ └──────┬──────┘
     │            ▼
     │     ┌─────────────┐
     │     │ Rank &      │
     │     │ Synthesize  │
     │     └──────┬──────┘
     │            ▼
     │     ┌─────────────┐
     │     │ Curated     │
     │     │ Narrative   │
     └─────┴──────┬──────┘
                  ▼
           ┌────────────┐
           │  Results   │
           └────────────┘
```

### Zero Config Philosophy
1. **Install** → Works immediately (built-in fallback)
2. **Sync** → Gets better (vector embeddings)
3. **Choose mode** → Fast for speed, Focus for depth
4. **Use** → Always best available

## 🎛️ Toggle Modes

```bash
# Enable Focus mode (curated retrieval)
node smart-memory/smart_memory.js --focus

# Disable Focus mode (back to fast)
node smart-memory/smart_memory.js --unfocus

# Check current mode
node smart-memory/smart_memory.js --mode
```

## 📊 Before & After

| Query | Without Skill | With Skill (Fast) | With Skill (Focus) |
|-------|--------------|-------------------|-------------------|
| "User collaboration style" | ⚠️ Weak | ✅ Better | ✅ "work with me, not just for me" + context |
| "What did we decide?" | ⚠️ Scattered | ✅ Related chunks | ✅ Synthesized decision narrative |
| "Compare options A and B" | ⚠️ Manual work | ✅ Related hits | ✅ Structured comparison with sources |

## 🛠️ Usage

### In OpenClaw

```javascript
// Fast search (default)
const results = await memory_search("deployment config", 5);

// Enable focus for complex queries
memory_mode('focus');
const deepResults = await memory_search("architecture decisions", 5);
// Returns: { synthesis, facts, sources, confidence }
```

### CLI

```bash
# Search (uses current mode)
node smart-memory/smart_memory.js --search "your query"

# Search with mode override
node smart-memory/smart_memory.js --search "your query" --focus
node smart-memory/smart_memory.js --search "your query" --fast

# Toggle modes
node smart-memory/smart_memory.js --focus      # Enable focus
node smart-memory/smart_memory.js --unfocus    # Disable focus

# Check status
node smart-memory/smart_memory.js --status
```

## 📁 What's Included

```
smart-memory/
├── smart_memory.js        ← Main entry (auto-selects mode)
├── focus_agent.js         ← Curated retrieval engine
├── memory_mode.js         ← Mode toggle commands
├── db.js                  ← SQLite + hybrid search
├── memory.js              ← OpenClaw wrapper
├── package.json           ← Dependencies
└── references/
    ├── integration.md     ← Setup guide
    └── pgvector.md        ← Scale guide

skills/
└── vector-memory/         ← OpenClaw skill manifest
    ├── skill.json
    └── README.md
```

## 🔧 Requirements

- Node.js 18+
- ~80MB disk space (for model, cached after download)
- OpenClaw (or any Node.js agent)

## 🎛️ Tools

| Tool | Purpose |
|------|---------|
| `memory_search` | Smart search with mode awareness |
| `memory_get` | Retrieve full content |
| `memory_sync` | Index for vector search |
| `memory_mode` | Toggle fast/focus modes |
| `memory_status` | Check mode and database stats |

## 🔄 Auto-Sync (Optional)

Add to `HEARTBEAT.md`:
```bash
if [ -n "$(find memory MEMORY.md -newer smart-memory/.last_sync 2>/dev/null)" ]; then
    node smart-memory/smart_memory.js --sync && touch smart-memory/.last_sync
fi
```

## 📈 Performance

| Mode | Quality | Speed | Best For |
|------|---------|-------|----------|
| Fast | ⭐⭐⭐⭐ | ~10ms | Quick lookups, facts |
| Focus | ⭐⭐⭐⭐⭐ | ~100ms | Decisions, synthesis, planning |

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **"Vector not ready"** | Run: `node smart_memory.js --sync` |
| **No results found** | Check that MEMORY.md exists; try broader query |
| **First sync slow** | Normal - downloading ~80MB model; subsequent syncs fast |
| **Focus mode too slow** | Switch to fast: `node smart_memory.js --unfocus` |
| **Want pure built-in?** | Don't sync - built-in always available as fallback |

## 🧪 Verify Installation

```bash
node smart-memory/smart_memory.js --status
```

Checks: dependencies, vector index, search functionality, memory files, current mode.

## 📋 For Agent Developers

Add to your `AGENTS.md`:
```markdown
## Memory Recall
Before answering about prior work, decisions, preferences:
1. Run memory_search with relevant query
2. Use memory_get for full context
3. Enable focus mode for complex decisions: memory_mode('focus')
4. If low confidence, say you checked
```

See full template in `AGENTS.md`.

## 🗂️ Suggested Memory Structure

```
workspace/
├── MEMORY.md              # Curated long-term memory
└── memory/
    ├── logs/              # Daily activity (YYYY-MM-DD.md)
    ├── projects/          # Project-specific notes
    ├── decisions/         # Important choices
    └── lessons/           # Mistakes learned
```

See `MEMORY_STRUCTURE.md` for templates.

## 🔗 Links

- **GitHub**: https://github.com/BluePointDigital/smart-memory
- **ClawHub**: https://clawhub.ai/BluePointDigital/smart-memory
- **Issues**: https://github.com/BluePointDigital/smart-memory/issues

## 📜 License

MIT

## 🙏 Acknowledgments

- Embeddings: [Xenova Transformers](https://github.com/xenova/transformers.js)
- Model: `sentence-transformers/all-MiniLM-L6-v2`
- Inspired by OpenClaw's memory system and Cognee's knowledge graphs
