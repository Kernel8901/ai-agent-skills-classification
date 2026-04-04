/**
 * Shared utilities for Notion API scripts
 * Common functions for HTTP requests, error handling, and data extraction
 */

const https = require('https');

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_VERSION = '2025-09-03';

/**
 * Make a Notion API request with proper error handling
 */
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
          reject(createDetailedError(res.statusCode, body));
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

/**
 * Create detailed error message based on status code and response
 */
function createDetailedError(statusCode, body) {
  let error;
  try {
    error = JSON.parse(body);
  } catch (e) {
    return new Error(`API error (${statusCode}): ${body}`);
  }

  const errorCode = error.code;
  const errorMessage = error.message;

  switch (statusCode) {
    case 400:
      if (errorCode === 'validation_error') {
        return new Error(`Validation error: ${errorMessage}. Check your input data.`);
      }
      return new Error(`Bad request: ${errorMessage}`);
    
    case 401:
      return new Error('Authentication failed. Check your NOTION_API_KEY environment variable.');
    
    case 404:
      if (errorCode === 'object_not_found') {
        return new Error('Page/database not found. Make sure it is shared with your integration.');
      }
      return new Error(`Not found: ${errorMessage}`);
    
    case 429:
      return new Error('Rate limit exceeded. Wait a moment and try again.');
    
    case 500:
    case 503:
      return new Error(`Notion server error (${statusCode}). Try again later.`);
    
    default:
      return new Error(`API error (${statusCode}): ${errorMessage || body}`);
  }
}

/**
 * Extract title from a page or database object
 */
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

/**
 * Extract value from a property based on its type
 */
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
    case 'created_time':
      return property.created_time;
    case 'last_edited_time':
      return property.last_edited_time;
    default:
      return property[property.type];
  }
}

/**
 * Parse rich text with basic markdown formatting
 */
function parseRichText(text) {
  const richText = [];
  const maxLength = 2000;
  
  // Split text into chunks if needed
  if (text.length <= maxLength) {
    richText.push({
      type: 'text',
      text: { content: text }
    });
  } else {
    // Split into chunks
    for (let i = 0; i < text.length; i += maxLength) {
      richText.push({
        type: 'text',
        text: { content: text.substring(i, i + maxLength) }
      });
    }
  }
  
  return richText;
}

/**
 * Check if NOTION_API_KEY is set
 */
function checkApiKey() {
  if (!NOTION_API_KEY) {
    console.error('Error: NOTION_API_KEY environment variable not set');
    console.error('');
    console.error('Setup:');
    console.error('  1. Create a Notion integration at https://www.notion.so/my-integrations');
    console.error('  2. Store the API key in macOS Keychain');
    console.error('  3. Add to environment loader (e.g., ~/.openclaw/bin/openclaw-env.sh):');
    console.error('     export NOTION_API_KEY="$(security find-generic-password -a "$USER" -s "openclaw.notion_api_key" -w)"');
    console.error('  4. Restart gateway: openclaw gateway restart');
    process.exit(1);
  }
}

/**
 * Format property value for database operations
 */
function formatPropertyValue(propertyType, value) {
  switch (propertyType) {
    case 'select':
      return { select: { name: value } };
    
    case 'multi_select':
      const tags = Array.isArray(value) ? value : value.split(',').map(t => t.trim());
      return { multi_select: tags.map(name => ({ name })) };
    
    case 'checkbox':
      const boolValue = typeof value === 'boolean' ? value : 
                       (value.toLowerCase() === 'true' || value === '1');
      return { checkbox: boolValue };
    
    case 'number':
      return { number: typeof value === 'number' ? value : parseFloat(value) };
    
    case 'url':
      return { url: value };
    
    case 'email':
      return { email: value };
    
    case 'date':
      if (typeof value === 'string') {
        const dates = value.split(',').map(d => d.trim());
        return {
          date: {
            start: dates[0],
            end: dates[1] || null
          }
        };
      }
      return { date: value };
    
    case 'rich_text':
      return {
        rich_text: [{ type: 'text', text: { content: value } }]
      };
    
    case 'title':
      return {
        title: [{ type: 'text', text: { content: value } }]
      };
    
    default:
      throw new Error(`Unsupported property type: ${propertyType}`);
  }
}

module.exports = {
  notionRequest,
  createDetailedError,
  extractTitle,
  extractPropertyValue,
  parseRichText,
  checkApiKey,
  formatPropertyValue,
  NOTION_API_KEY,
  NOTION_VERSION
};
