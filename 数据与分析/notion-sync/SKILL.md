---
name: notion-sync
description: Bi-directional sync and management for Notion pages and databases. Use when working with Notion workspaces for collaborative editing, research tracking, project management, or when you need to sync markdown files to/from Notion pages or monitor Notion pages for changes.
---

# Notion Sync

Bi-directional sync between markdown files and Notion pages, plus database management utilities for research tracking and project management.

## Setup

### API Key Configuration

Store the Notion API key in macOS Keychain:

```bash
# Add to keychain (will prompt for the secret)
security add-generic-password -a "$USER" -s "openclaw.notion_api_key" -w

# Add to environment loader (e.g., ~/.openclaw/bin/openclaw-env.sh)
export NOTION_API_KEY="$(security find-generic-password -a "$USER" -s "openclaw.notion_api_key" -w)"

# Restart gateway to load the key
openclaw gateway restart
```

### Integration Setup

1. Go to https://www.notion.so/my-integrations
2. Create a new integration or use an existing one
3. Copy the "Internal Integration Token" (starts with `secret_`)
4. Store it in Keychain as shown above
5. Share your Notion pages/databases with the integration:
   - Open the page/database in Notion
   - Click "Share" → "Invite"
   - Select your integration

## Core Operations

### 1. Search Pages and Databases

Search across your Notion workspace by title or content.

```bash
node scripts/search-notion.js "<query>" [--filter page|database] [--limit 10]
```

**Examples:**
```bash
# Search for newsletter-related pages
node scripts/search-notion.js "newsletter"

# Find only databases
node scripts/search-notion.js "research" --filter database

# Limit results
node scripts/search-notion.js "AI" --limit 5
```

**Output:**
```json
[
  {
    "id": "page-id-here",
    "object": "page",
    "title": "Newsletter Draft",
    "url": "https://notion.so/...",
    "lastEdited": "2026-02-01T09:00:00.000Z"
  }
]
```

### 2. Query Databases with Filters

Query database contents with advanced filters and sorting.

```bash
node scripts/query-database.js <database-id> [--filter <json>] [--sort <json>] [--limit 10]
```

**Examples:**
```bash
# Get all items
node scripts/query-database.js xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Filter by Status = "Complete"
node scripts/query-database.js <db-id> \
  --filter '{"property": "Status", "select": {"equals": "Complete"}}'

# Filter by Tags containing "AI"
node scripts/query-database.js <db-id> \
  --filter '{"property": "Tags", "multi_select": {"contains": "AI"}}'

# Sort by Date descending
node scripts/query-database.js <db-id> \
  --sort '[{"property": "Date", "direction": "descending"}]'

# Combine filter + sort
node scripts/query-database.js <db-id> \
  --filter '{"property": "Status", "select": {"equals": "Complete"}}' \
  --sort '[{"property": "Date", "direction": "descending"}]'
```

**Common filter patterns:**
- Select equals: `{"property": "Status", "select": {"equals": "Done"}}`
- Multi-select contains: `{"property": "Tags", "multi_select": {"contains": "AI"}}`
- Date after: `{"property": "Date", "date": {"after": "2024-01-01"}}`
- Checkbox is true: `{"property": "Published", "checkbox": {"equals": true}}`
- Number greater than: `{"property": "Count", "number": {"greater_than": 100}}`

### 3. Update Page Properties

Update properties for database pages (status, tags, dates, etc.).

```bash
node scripts/update-page-properties.js <page-id> <property-name> <value> [--type <type>]
```

**Supported types:** select, multi_select, checkbox, number, url, email, date, rich_text

**Examples:**
```bash
# Set status
node scripts/update-page-properties.js <page-id> Status "Complete" --type select

# Add multiple tags
node scripts/update-page-properties.js <page-id> Tags "AI,Leadership,Research" --type multi_select

# Set checkbox
node scripts/update-page-properties.js <page-id> Published true --type checkbox

# Set date
node scripts/update-page-properties.js <page-id> "Publish Date" "2024-02-01" --type date

# Set URL
node scripts/update-page-properties.js <page-id> "Source URL" "https://example.com" --type url

# Set number
node scripts/update-page-properties.js <page-id> "Word Count" 1200 --type number
```

### 4. Markdown → Notion Sync

Push markdown content to Notion with full formatting support.

```bash
node scripts/md-to-notion.js \
  "<markdown-file-path>" \
  "<notion-parent-page-id>" \
  "<page-title>"
```

**Example:**
```bash
node scripts/md-to-notion.js \
  "projects/newsletter-draft.md" \
  "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" \
  "Newsletter Draft - Feb 2026"
```

**Supported formatting:**
- Headings (H1-H3)
- Bold/italic text
- Links
- Bullet lists
- Code blocks with syntax highlighting
- Horizontal dividers
- Paragraphs

**Features:**
- Batched uploads (100 blocks per request)
- Automatic rate limiting (350ms between batches)
- Returns Notion page URL and ID

**Output:**
```
Parsed 294 blocks from markdown
✓ Created page: https://www.notion.so/[title-and-id]
✓ Appended 100 blocks (100-200)
✓ Appended 94 blocks (200-294)

✅ Successfully created Notion page!
```

### 5. Notion → Markdown Sync

Pull Notion page content and convert to markdown.

```bash
node scripts/notion-to-md.js <page-id> [output-file]
```

**Example:**
```bash
node scripts/notion-to-md.js \
  "abc123-example-page-id-456def" \
  "newsletter-updated.md"
```

**Features:**
- Converts Notion blocks to markdown
- Preserves formatting (headings, lists, code, quotes)
- Optional file output (writes to file or stdout)

### 6. Change Detection & Monitoring

Monitor Notion pages for edits and compare with local markdown files.

```bash
node scripts/watch-notion.js "<page-id>" "<local-markdown-path>"

# Or use environment variables
export NOTION_WATCH_PAGE_ID="<your-page-id>"
export NOTION_WATCH_LOCAL_PATH="/path/to/your/draft.md"
node scripts/watch-notion.js
```

**Example:**
```bash
node scripts/watch-notion.js \
  "abc123-example-page-id-456def" \
  "projects/newsletter-draft.md"
```

**State tracking:** Maintains state in `memory/notion-watch-state.json`:
```json
{
  "pages": {
    "<page-id>": {
      "lastEditedTime": "2026-01-30T08:57:00.000Z",
      "lastChecked": "2026-01-31T19:41:54.000Z",
      "title": "Your Page Title"
    }
  }
}
```

**Output:**
```json
{
  "pageId": "<page-id>",
  "title": "Your Page Title",
  "lastEditedTime": "2026-01-30T08:57:00.000Z",
  "hasChanges": false,
  "localPath": "/path/to/your-draft.md",
  "actions": ["✓ No changes since last check"]
}
```

**Integration with heartbeat:** Add to `HEARTBEAT.md` for automated monitoring:
```markdown
## Notion Page Monitoring (Every 2-3 hours during work hours)

Check if enough time has passed since last Notion check.

If >2 hours since last check AND during work hours (9 AM - 9 PM):
1. Run: `node scripts/watch-notion.js "<your-page-id>" "<your-local-path>"`
2. If `hasChanges: true` → notify user via message tool
3. Update check timestamp
```

### 7. Database Management

#### Add Markdown Content to Database

Add a markdown file as a new page in any Notion database.

```bash
node scripts/add-to-database.js <database-id> "<page-title>" <markdown-file-path>
```

**Examples:**
```bash
# Add research output
node scripts/add-to-database.js \
  xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
  "Research Report - Feb 2026" \
  projects/research-insights.md

# Add project notes
node scripts/add-to-database.js \
  <project-db-id> \
  "Sprint Retrospective" \
  docs/retro-2026-02.md

# Add meeting notes
node scripts/add-to-database.js \
  <notes-db-id> \
  "Weekly Team Sync" \
  notes/sync-2026-02-06.md
```

**Features:**
- Creates database page with title property
- Converts markdown to Notion blocks (headings, paragraphs, dividers)
- Handles large files with batched uploads
- Returns page URL for immediate access

**Note:** Additional properties (Type, Tags, Status, etc.) must be set manually in Notion UI after creation.

#### Inspect Database Schema

```bash
node scripts/get-database-schema.js <database-id>
```

**Example output:**
```json
{
  "object": "database",
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "title": [{"plain_text": "Ax Resources"}],
  "properties": {
    "Name": {"type": "title"},
    "Type": {"type": "select"},
    "Tags": {"type": "multi_select"}
  }
}
```

**Use when:**
- Setting up new database integrations
- Debugging property names/types
- Understanding database structure

#### Archive Pages

```bash
node scripts/delete-notion-page.js <page-id>
```

**Note:** This archives the page (sets `archived: true`), not permanent deletion.

## Common Workflows

### Collaborative Editing Workflow

1. **Push local draft to Notion:**
   ```bash
   node scripts/md-to-notion.js draft.md <parent-id> "Draft Title"
   ```

2. **User edits in Notion** (anywhere, any device)

3. **Monitor for changes:**
   ```bash
   node scripts/watch-notion.js
   # Returns hasChanges: true when edited
   ```

4. **Pull updates back:**
   ```bash
   node scripts/notion-to-md.js <page-id> draft-updated.md
   ```

5. **Repeat as needed** (update same page, don't create v2/v3/etc.)

### Research Output Tracking

1. **Generate research locally** (e.g., via sub-agent)

2. **Sync to Notion database:**
   ```bash
   node scripts/add-research-to-db.js
   ```

3. **User adds metadata in Notion UI** (Type, Tags, Status properties)

4. **Access from anywhere** via Notion web/mobile

### Page ID Extraction

From Notion URL: `https://notion.so/Page-Title-abc123-example-page-id-456def`

Extract: `abc123-example-page-id-456def` (last part after title)

Or use the 32-char format: `abc123examplepageid456def` (hyphens optional)

## Limitations

- **Property updates:** Database properties (Type, Tags, Status) must be added manually in Notion UI after page creation. API property updates can be temperamental with inline databases.
- **Block limits:** Very large markdown files (>1000 blocks) may take several minutes to sync due to rate limiting.
- **Formatting:** Some complex markdown (tables, nested lists >3 levels) may not convert perfectly.

## Troubleshooting

**"Could not find page" error:**
- Ensure page/database is shared with your integration
- Check page ID format (32 chars, alphanumeric + hyphens)

**"Module not found" error:**
- Scripts use built-in Node.js https module (no npm install needed)
- Ensure running from correct directory with `cd ~/clawd`

**Rate limiting:**
- Notion API has rate limits (~3 requests/second)
- Scripts handle this automatically with 350ms delays between batches

## Resources

### scripts/

**Core Sync:**
- **md-to-notion.js** - Markdown → Notion sync with full formatting
- **notion-to-md.js** - Notion → Markdown conversion
- **watch-notion.js** - Change detection and monitoring

**Search & Query:**
- **search-notion.js** - Search pages and databases by query
- **query-database.js** - Query databases with filters and sorting
- **update-page-properties.js** - Update database page properties

**Database Management:**
- **add-to-database.js** - Add markdown files as database pages
- **get-database-schema.js** - Inspect database structure
- **delete-notion-page.js** - Archive pages

**Utilities:**
- **notion-utils.js** - Shared utilities (error handling, property formatting, API requests)

All scripts use only built-in Node.js modules (https, fs) - no external dependencies required.

### references/

- **database-patterns.md** - Common database schemas and property patterns
