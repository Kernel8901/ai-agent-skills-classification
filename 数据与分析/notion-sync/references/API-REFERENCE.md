# Notion Sync API Reference

Detailed technical reference for all Notion sync scripts and utilities.

## Environment Setup

### Required Environment Variable

```bash
export NOTION_API_KEY="secret_..."
```

### Keychain Storage (macOS)

```bash
# Store in keychain
security add-generic-password -a "$USER" -s "openclaw.notion_api_key" -w

# Load from keychain
export NOTION_API_KEY="$(security find-generic-password -a "$USER" -s "openclaw.notion_api_key" -w)"
```

## Scripts Reference

### search-notion.js

Search pages and databases by title or content.

**Signature:**
```bash
node scripts/search-notion.js "<query>" [--filter page|database] [--limit 10]
```

**Options:**
- `query` (required): Search term
- `--filter`: Restrict to `page` or `database`
- `--limit`: Max results (default: 10)

**Returns:** JSON array of matching pages/databases with id, title, url, lastEdited

### query-database.js

Query database contents with advanced filters and sorting.

**Signature:**
```bash
node scripts/query-database.js <database-id> [--filter <json>] [--sort <json>] [--limit 10]
```

**Filter Patterns:**

| Type | Example |
|------|---------|
| Select equals | `{"property": "Status", "select": {"equals": "Done"}}` |
| Multi-select contains | `{"property": "Tags", "multi_select": {"contains": "AI"}}` |
| Date after | `{"property": "Date", "date": {"after": "2024-01-01"}}` |
| Checkbox | `{"property": "Published", "checkbox": {"equals": true}}` |
| Number | `{"property": "Count", "number": {"greater_than": 100}}` |

**Sort Format:**
```json
[{"property": "Date", "direction": "descending"}]
```

### update-page-properties.js

Update database page properties.

**Signature:**
```bash
node scripts/update-page-properties.js <page-id> <property-name> <value> [--type <type>]
```

**Property Types:**
- `select`: Single selection (e.g., Status)
- `multi_select`: Multiple tags (comma-separated)
- `checkbox`: Boolean (true/false)
- `number`: Numeric value
- `url`: URL string
- `email`: Email address
- `date`: ISO date (YYYY-MM-DD)
- `rich_text`: Plain text

### md-to-notion.js

Convert markdown to Notion page.

**Signature:**
```bash
node scripts/md-to-notion.js "<markdown-file>" "<parent-page-id>" "<title>"
```

**Supported Markdown:**
- Headings: `#`, `##`, `###`
- Bold: `**text**`
- Italic: `*text*`
- Links: `[text](url)`
- Lists: `- item`
- Code: ` ```lang ... ``` `
- Dividers: `---`

**Output:** Notion page URL and ID

**Rate Limiting:** 350ms between batch uploads (100 blocks per batch)

### notion-to-md.js

Convert Notion page to markdown.

**Signature:**
```bash
node scripts/notion-to-md.js <page-id> [output-file]
```

**Output:** Writes markdown to file or stdout

### watch-notion.js

Monitor page for changes.

**Signature:**
```bash
node scripts/watch-notion.js
```

**State File:** `memory/notion-watch-state.json`

**State Schema:**
```json
{
  "pages": {
    "<page-id>": {
      "lastEditedTime": "ISO timestamp",
      "lastChecked": "ISO timestamp",
      "title": "Page Title"
    }
  }
}
```

**Returns:** JSON with `hasChanges`, `localDiffers`, `actions`

### get-database-schema.js

Inspect database structure.

**Signature:**
```bash
node scripts/get-database-schema.js <database-id>
```

**Returns:** JSON with database properties and their types

### delete-notion-page.js

Archive page (soft delete).

**Signature:**
```bash
node scripts/delete-notion-page.js <page-id>
```

**Note:** Sets `archived: true`, doesn't permanently delete

## Notion API Utilities

### notion-utils.js

Shared utilities for all scripts.

**Exports:**

#### `notionRequest(path, method, body)`
Makes authenticated API requests to Notion.

**Parameters:**
- `path`: API endpoint (e.g., `/v1/pages`)
- `method`: HTTP method (GET, POST, PATCH, DELETE)
- `body`: Optional request body (object)

**Returns:** Promise resolving to response JSON

**Error Handling:** Throws with detailed Notion API error messages

#### `formatProperty(type, value)`
Formats property values for Notion API.

**Supported Types:**
- select, multi_select, checkbox, number, url, email, date, rich_text

**Returns:** Notion API property object

#### `extractPageId(input)`
Extracts clean page ID from URL or ID string.

**Input Formats:**
- URL: `https://notion.so/Title-abc123...`
- With hyphens: `abc123-example-page-id-456def`
- Without hyphens: `abc123examplepageid456def`

**Returns:** 32-char UUID with hyphens

## Rate Limits

Notion API limits:
- ~3 requests/second
- Scripts implement 350ms delays between batches
- Large operations (>100 blocks) auto-batch with delays

## Common Issues

### Authentication Errors

**Error:** `"Could not find page"`

**Solutions:**
1. Verify page/database is shared with your integration
2. Check page ID format (32 chars, no extra characters)
3. Confirm `NOTION_API_KEY` is set and valid

### Property Update Failures

**Issue:** Property updates don't persist

**Cause:** Database is inline (embedded in a page) rather than standalone

**Solution:** Create standalone database or update properties manually in Notion UI

### Module Not Found

**Error:** `Cannot find module 'https'`

**Solution:** Ensure using Node.js v18+ (built-in modules)

## Page ID Extraction

From Notion URL:
```
https://notion.so/Page-Title-abc123-example-page-id-456def
                            └─────────── Extract this part ──────────┘
```

Both formats work:
- With hyphens: `abc123-example-page-id-456def`
- Without hyphens: `abc123examplepageid456def`

## Integration Permissions

Required Notion integration capabilities:
- ✓ Read content
- ✓ Update content
- ✓ Insert content
- ✓ Read comments (optional)

Share settings:
- Must explicitly share each page/database with the integration
- Child pages inherit parent permissions
- Databases require explicit sharing even if parent is shared
