#!/usr/bin/env node
/**
 * Query Notion database with filters and sorts
 * Usage: query-database.js <database-id> [--filter <json>] [--sort <json>] [--limit 10]
 */

const https = require('https');

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_VERSION = '2025-09-03';

if (!NOTION_API_KEY) {
  console.error('Error: NOTION_API_KEY environment variable not set');
  process.exit(1);
}

function notionRequest(path, method, data = null) {
  return new Promise((resolve, reject) => {
    const requestData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: 'api.notion.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json'
      }
    };

    if (requestData) {
      options.headers['Content-Length'] = Buffer.byteLength(requestData);
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          const error = JSON.parse(body);
          if (res.statusCode === 404 && error.code === 'object_not_found') {
            reject(new Error('Database not found. Make sure it is shared with your integration.'));
          } else if (res.statusCode === 401) {
            reject(new Error('Authentication failed. Check your NOTION_API_KEY.'));
          } else if (res.statusCode === 429) {
            reject(new Error('Rate limit exceeded. Wait a moment and try again.'));
          } else {
            reject(new Error(`API error (${res.statusCode}): ${error.message || body}`));
          }
        }
      });
    });

    req.on('error', reject);
    if (requestData) {
      req.write(requestData);
    }
    req.end();
  });
}

async function queryDatabase(databaseId, filter = null, sorts = null, pageSize = 10) {
  // In Notion API 2025-09-03, we need the data_source_id for queries
  // Get the database first to extract data_source_id
  console.error(`Fetching database info: ${databaseId}`);
  const dbInfo = await notionRequest(`/v1/databases/${databaseId}`, 'GET');
  
  const dataSourceId = dbInfo.data_sources && dbInfo.data_sources.length > 0 
    ? dbInfo.data_sources[0].id 
    : databaseId; // Fallback to database_id if no data_source found
  
  console.error(`Querying data source: ${dataSourceId}`);
  
  const queryPayload = {
    page_size: pageSize
  };

  if (filter) {
    queryPayload.filter = filter;
    console.error('Filter:', JSON.stringify(filter, null, 2));
  }

  if (sorts) {
    queryPayload.sorts = sorts;
    console.error('Sort:', JSON.stringify(sorts, null, 2));
  }
  
  const result = await notionRequest(`/v1/data_sources/${dataSourceId}/query`, 'POST', queryPayload);
  
  return result.results.map(page => {
    const properties = {};
    for (const [key, value] of Object.entries(page.properties)) {
      properties[key] = extractPropertyValue(value);
    }
    
    return {
      id: page.id,
      url: page.url,
      lastEdited: page.last_edited_time,
      properties: properties
    };
  });
}

function extractPropertyValue(property) {
  switch (property.type) {
    case 'title':
      return property.title.map(t => t.plain_text).join('');
    case 'rich_text':
      return property.rich_text.map(t => t.plain_text).join('');
    case 'number':
      return property.number;
    case 'select':
      return property.select?.name || null;
    case 'multi_select':
      return property.multi_select.map(s => s.name);
    case 'date':
      return property.date ? {
        start: property.date.start,
        end: property.date.end
      } : null;
    case 'checkbox':
      return property.checkbox;
    case 'url':
      return property.url;
    case 'email':
      return property.email;
    case 'phone_number':
      return property.phone_number;
    case 'relation':
      return property.relation.map(r => r.id);
    default:
      return property[property.type];
  }
}

// Main execution
(async () => {
  try {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === '--help') {
      console.log('Usage: query-database.js <database-id> [options]');
      console.log('');
      console.log('Options:');
      console.log('  --filter <json>  Filter expression (JSON)');
      console.log('  --sort <json>    Sort expression (JSON)');
      console.log('  --limit <num>    Maximum results (default: 10)');
      console.log('');
      console.log('Examples:');
      console.log('  # Get all items');
      console.log('  query-database.js xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
      console.log('');
      console.log('  # Filter by status');
      console.log('  query-database.js <db-id> --filter \'{"property": "Status", "select": {"equals": "Complete"}}\'');
      console.log('');
      console.log('  # Filter by tag (multi-select contains)');
      console.log('  query-database.js <db-id> --filter \'{"property": "Tags", "multi_select": {"contains": "AI"}}\'');
      console.log('');
      console.log('  # Sort by date descending');
      console.log('  query-database.js <db-id> --sort \'[{"property": "Date", "direction": "descending"}]\'');
      console.log('');
      console.log('  # Combine filter + sort');
      console.log('  query-database.js <db-id> \\');
      console.log('    --filter \'{"property": "Status", "select": {"equals": "Complete"}}\' \\');
      console.log('    --sort \'[{"property": "Date", "direction": "descending"}]\'');
      process.exit(0);
    }

    const databaseId = args[0];
    let filter = null;
    let sorts = null;
    let limit = 10;

    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--filter' && args[i + 1]) {
        filter = JSON.parse(args[i + 1]);
        i++;
      } else if (args[i] === '--sort' && args[i + 1]) {
        sorts = JSON.parse(args[i + 1]);
        i++;
      } else if (args[i] === '--limit' && args[i + 1]) {
        limit = parseInt(args[i + 1]);
        i++;
      }
    }

    const results = await queryDatabase(databaseId, filter, sorts, limit);
    
    console.log(JSON.stringify(results, null, 2));
    console.error(`\n✓ Found ${results.length} result(s)`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
