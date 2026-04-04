#!/usr/bin/env node
/**
 * Search Notion for pages and databases
 * Usage: search-notion.js <query> [--filter page|database] [--limit 10]
 */

const https = require('https');

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_VERSION = '2025-09-03';

if (!NOTION_API_KEY) {
  console.error('Error: NOTION_API_KEY environment variable not set');
  process.exit(1);
}

function notionRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const requestData = JSON.stringify(data);
    
    const options = {
      hostname: 'api.notion.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          const error = JSON.parse(body);
          if (res.statusCode === 404 && error.code === 'object_not_found') {
            reject(new Error('Page/database not found. Make sure it is shared with your integration.'));
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
    req.write(requestData);
    req.end();
  });
}

async function searchNotion(query, filter = null, pageSize = 10) {
  const searchPayload = {
    query: query,
    page_size: pageSize
  };

  if (filter) {
    searchPayload.filter = {
      property: 'object',
      value: filter // 'page' or 'database'
    };
  }

  console.error(`Searching for: "${query}"${filter ? ` (filter: ${filter})` : ''}`);
  
  const result = await notionRequest('/v1/search', 'POST', searchPayload);
  
  return result.results.map(item => ({
    id: item.id,
    object: item.object,
    title: extractTitle(item),
    url: item.url,
    lastEdited: item.last_edited_time,
    parent: item.parent
  }));
}

function extractTitle(item) {
  if (item.object === 'page') {
    const titleProp = Object.values(item.properties || {}).find(p => p.type === 'title');
    if (titleProp && titleProp.title && titleProp.title.length > 0) {
      return titleProp.title[0].plain_text;
    }
  } else if (item.object === 'database' || item.object === 'data_source') {
    if (item.title && item.title.length > 0) {
      return item.title[0].plain_text;
    }
  }
  return '(Untitled)';
}

// Main execution
(async () => {
  try {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === '--help') {
      console.log('Usage: search-notion.js <query> [options]');
      console.log('');
      console.log('Options:');
      console.log('  --filter <page|database>  Filter by object type');
      console.log('  --limit <number>          Maximum results (default: 10)');
      console.log('');
      console.log('Examples:');
      console.log('  search-notion.js "newsletter"');
      console.log('  search-notion.js "research" --filter page');
      console.log('  search-notion.js "AI" --limit 20');
      process.exit(0);
    }

    const query = args[0];
    let filter = null;
    let limit = 10;

    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--filter' && args[i + 1]) {
        filter = args[i + 1];
        i++;
      } else if (args[i] === '--limit' && args[i + 1]) {
        limit = parseInt(args[i + 1]);
        i++;
      }
    }

    const results = await searchNotion(query, filter, limit);
    
    console.log(JSON.stringify(results, null, 2));
    console.error(`\n✓ Found ${results.length} result(s)`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
