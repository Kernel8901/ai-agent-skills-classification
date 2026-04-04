#!/usr/bin/env node
/**
 * Update Notion page properties (for database pages)
 * Usage: update-page-properties.js <page-id> <property-name> <value> [--type select|multi_select|checkbox|number|url|email|date]
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
            reject(new Error('Page not found. Make sure it is shared with your integration.'));
          } else if (res.statusCode === 401) {
            reject(new Error('Authentication failed. Check your NOTION_API_KEY.'));
          } else if (res.statusCode === 400 && error.code === 'validation_error') {
            reject(new Error(`Validation error: ${error.message}. Check property name and type.`));
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

function formatPropertyValue(propertyType, value) {
  switch (propertyType) {
    case 'select':
      return { select: { name: value } };
    
    case 'multi_select':
      // Value can be comma-separated: "AI,Leadership,Research"
      const tags = value.split(',').map(t => t.trim());
      return { multi_select: tags.map(name => ({ name })) };
    
    case 'checkbox':
      const boolValue = value.toLowerCase() === 'true' || value === '1';
      return { checkbox: boolValue };
    
    case 'number':
      return { number: parseFloat(value) };
    
    case 'url':
      return { url: value };
    
    case 'email':
      return { email: value };
    
    case 'date':
      // Value can be "2024-01-15" or "2024-01-15,2024-01-20" for range
      const dates = value.split(',').map(d => d.trim());
      return {
        date: {
          start: dates[0],
          end: dates[1] || null
        }
      };
    
    case 'rich_text':
      return {
        rich_text: [{ type: 'text', text: { content: value } }]
      };
    
    default:
      throw new Error(`Unsupported property type: ${propertyType}. Supported: select, multi_select, checkbox, number, url, email, date, rich_text`);
  }
}

async function updatePageProperties(pageId, propertyName, value, propertyType = 'select') {
  const properties = {};
  properties[propertyName] = formatPropertyValue(propertyType, value);

  console.error(`Updating page: ${pageId}`);
  console.error(`Property: ${propertyName} (${propertyType})`);
  console.error(`Value: ${value}`);
  
  const result = await notionRequest(`/v1/pages/${pageId}`, 'PATCH', { properties });
  
  return {
    id: result.id,
    url: result.url,
    updated: result.last_edited_time
  };
}

// Main execution
(async () => {
  try {
    const args = process.argv.slice(2);
    
    if (args.length < 3 || args[0] === '--help') {
      console.log('Usage: update-page-properties.js <page-id> <property-name> <value> [--type <type>]');
      console.log('');
      console.log('Options:');
      console.log('  --type <type>  Property type (default: select)');
      console.log('');
      console.log('Supported types:');
      console.log('  select          Single choice (e.g., "Complete")');
      console.log('  multi_select    Multiple choices, comma-separated (e.g., "AI,Leadership")');
      console.log('  checkbox        Boolean (e.g., "true" or "false")');
      console.log('  number          Numeric value (e.g., "1200")');
      console.log('  url             URL string');
      console.log('  email           Email address');
      console.log('  date            Date or range (e.g., "2024-01-15" or "2024-01-15,2024-01-20")');
      console.log('  rich_text       Text content');
      console.log('');
      console.log('Examples:');
      console.log('  # Set status to Complete');
      console.log('  update-page-properties.js <page-id> Status Complete --type select');
      console.log('');
      console.log('  # Add multiple tags');
      console.log('  update-page-properties.js <page-id> Tags "AI,Leadership,Research" --type multi_select');
      console.log('');
      console.log('  # Set checkbox');
      console.log('  update-page-properties.js <page-id> Published true --type checkbox');
      console.log('');
      console.log('  # Set date');
      console.log('  update-page-properties.js <page-id> "Publish Date" 2024-02-01 --type date');
      console.log('');
      console.log('  # Set URL');
      console.log('  update-page-properties.js <page-id> "Source URL" "https://example.com" --type url');
      process.exit(0);
    }

    const pageId = args[0];
    const propertyName = args[1];
    const value = args[2];
    let propertyType = 'select';

    for (let i = 3; i < args.length; i++) {
      if (args[i] === '--type' && args[i + 1]) {
        propertyType = args[i + 1];
        i++;
      }
    }

    const result = await updatePageProperties(pageId, propertyName, value, propertyType);
    
    console.log(JSON.stringify(result, null, 2));
    console.error(`\n✓ Page updated successfully`);
    console.error(`  URL: ${result.url}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
