---
name: knowledge-base
version: 1.0.0
description: Personal knowledge base with SQLite + FTS5. Index contacts, documents, ChatGPT exports, and WhatsApp data. Query everything instantly with full-text search. Use for contact lookups, conversation history search, document retrieval, and building persistent memory systems.
homepage: https://github.com/openclaw/openclaw
repository: https://github.com/openclaw/openclaw
---

# Knowledge Base

A local SQLite database for indexing and querying personal data with full-text search.

## What It Indexes

| Source | Data |
|--------|------|
| **WhatsApp** | Contacts, groups, memberships (from `whatsapp-contacts-full.json`) |
| **Documents** | All markdown files in `memory/` |
| **ChatGPT** | Conversation exports (from `chatgpt-export/`) |
| **Contacts** | VCF exports from phone |

## Quick Start

```bash
# Initialize database (first time)
python3 skills/knowledge-base/scripts/init_db.py

# Query
python3 skills/knowledge-base/scripts/query.py search "term"
python3 skills/knowledge-base/scripts/query.py contact "+34659..."
python3 skills/knowledge-base/scripts/query.py stats
```

## Commands

| Command | Description |
|---------|-------------|
| `search <term>` | Full-text search across all content |
| `contact <phone\|name>` | Look up contact + their groups |
| `groups <phone>` | List groups a phone is in |
| `members <group>` | List members of a group |
| `chatgpt <term>` | Search ChatGPT message history |
| `doc <term>` | Search documents only |
| `stats` | Database statistics |
| `sql <query>` | Run raw SQL |

## Data Sources

### WhatsApp Contacts
Export via the WhatsApp skill's contact extraction (produces `bank/whatsapp-contacts-full.json`).

### ChatGPT Export
Use the chatgpt-exporter skill or manual export. Place JSON in `chatgpt-export/` directory.

Supported formats:
- `{ "conversations": [...] }` — custom format with `id`, `title`, `created`, `messages`
- Native ChatGPT export format with `mapping` structure

### VCF Contacts
Export from phone (Android: Contacts → Settings → Export). Run:
```bash
python3 skills/knowledge-base/scripts/import_vcf.py path/to/contacts.vcf
```

### Documents
Automatically indexes all `*.md` files in `memory/` directory.

## Database Location

`db/jarvis.db` in workspace root.

## Re-indexing

To refresh the database with new data:
```bash
rm db/jarvis.db
python3 skills/knowledge-base/scripts/init_db.py
```

Or for incremental updates:
```bash
python3 skills/knowledge-base/scripts/sync.py  # (if available)
```

## Schema

See `references/schema.md` for full table definitions.

Key tables:
- `contacts` — phone, name, source
- `wa_groups` — WhatsApp group metadata
- `wa_memberships` — who is in which group
- `documents` — markdown files with FTS
- `chatgpt_conversations` — conversation metadata
- `chatgpt_messages` — individual messages with FTS

## Example Queries

```sql
-- Find all groups someone is in
SELECT g.name FROM wa_groups g
JOIN wa_memberships m ON m.group_jid = g.jid
WHERE m.phone = '+34659418105';

-- Search ChatGPT for a topic
SELECT c.title, m.content FROM chatgpt_fts f
JOIN chatgpt_messages m ON m.conversation_id = f.conv_id
JOIN chatgpt_conversations c ON c.id = m.conversation_id
WHERE chatgpt_fts MATCH 'spirituality';

-- Find contacts in a specific group
SELECT c.phone, c.name FROM contacts c
JOIN wa_memberships m ON m.phone = c.phone
JOIN wa_groups g ON g.jid = m.group_jid
WHERE g.name LIKE '%Family%';
```

## WhatsApp Group Allowlist Management

The database enables easy management of WhatsApp group allowlists for security.

### Find a group's JID
```bash
python3 skills/knowledge-base/scripts/query.py sql \
  "SELECT jid, name, participant_count FROM wa_groups WHERE name LIKE '%Family%'"
```

### List all allowed groups (cross-reference with config)
```bash
python3 skills/knowledge-base/scripts/query.py sql \
  "SELECT name, participant_count FROM wa_groups WHERE jid IN (
    '34609572036-1370260813@g.us',
    '34659418105-1561917865@g.us'
    -- add your allowlist JIDs here
  )"
```

### Add a group to allowlist
1. Find the JID: `query.py sql "SELECT jid, name FROM wa_groups WHERE name LIKE '%GroupName%'"`
2. Add to config: `channels.whatsapp.groupAllowFrom`
3. Restart gateway

### Security rationale
- `groupPolicy: "open"` = any group can trigger the bot (risky with large public groups)
- `groupPolicy: "allowlist"` = only specified groups can interact (recommended)
- Reduces prompt injection attack surface by ~95%

## Tips

1. **No contact names?** WhatsApp only provides phone numbers. Import your phone's VCF to add names.
2. **Search not finding?** FTS5 uses word boundaries. Use `*` for prefix matching: `Bas*` matches "Bashar".
3. **Large exports?** ChatGPT exports can be 50MB+. First import may take 30-60 seconds.
