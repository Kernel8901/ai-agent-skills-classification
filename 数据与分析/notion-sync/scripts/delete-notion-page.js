#!/usr/bin/env node
/**
 * Archive/delete a Notion page
 */

const https = require('https');

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_VERSION = '2025-09-03';

function notionRequest(path, method, data) {
  return new Promise((resolve, reject) => {
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

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

(async () => {
  const pageId = process.argv[2];
  
  if (!pageId) {
    console.error('Usage: delete-notion-page.js <page-id>');
    process.exit(1);
  }
  
  console.log(`Archiving page: ${pageId}`);
  
  const result = await notionRequest(`/v1/pages/${pageId}`, 'PATCH', {
    archived: true
  });
  
  console.log('✓ Page archived successfully');
  console.log('Page ID:', result.id);
  console.log('Archived:', result.archived);
})().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
