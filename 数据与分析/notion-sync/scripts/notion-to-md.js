#!/usr/bin/env node
/**
 * Notion to Markdown Converter
 * Fetches a Notion page and converts it back to markdown
 */

const https = require('https');

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_VERSION = '2025-09-03';

if (!NOTION_API_KEY) {
  console.error('Error: NOTION_API_KEY environment variable not set');
  process.exit(1);
}

// Fetch page metadata
function getPage(pageId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.notion.com',
      path: `/v1/pages/${pageId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': NOTION_VERSION
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`API error: ${res.statusCode} ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Fetch blocks from a page
function getBlocks(blockId, cursor = null) {
  return new Promise((resolve, reject) => {
    const path = `/v1/blocks/${blockId}/children${cursor ? `?start_cursor=${cursor}` : ''}`;
    
    const options = {
      hostname: 'api.notion.com',
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': NOTION_VERSION
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`API error: ${res.statusCode} ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Fetch all blocks (handling pagination)
async function getAllBlocks(blockId) {
  let allBlocks = [];
  let cursor = null;
  
  do {
    const response = await getBlocks(blockId, cursor);
    allBlocks = allBlocks.concat(response.results);
    cursor = response.has_more ? response.next_cursor : null;
  } while (cursor);
  
  return allBlocks;
}

// Extract plain text from rich_text array
function richTextToPlain(richText) {
  if (!richText || richText.length === 0) return '';
  return richText.map(rt => rt.plain_text || '').join('');
}

// Extract formatted text from rich_text array (with markdown)
function richTextToMarkdown(richText) {
  if (!richText || richText.length === 0) return '';
  
  return richText.map(rt => {
    let text = rt.plain_text || '';
    const ann = rt.annotations || {};
    
    // Apply formatting
    if (ann.code) text = `\`${text}\``;
    if (ann.bold) text = `**${text}**`;
    if (ann.italic) text = `*${text}*`;
    if (ann.strikethrough) text = `~~${text}~~`;
    
    // Handle links
    if (rt.href) {
      text = `[${text}](${rt.href})`;
    } else if (rt.text && rt.text.link) {
      text = `[${text}](${rt.text.link.url})`;
    }
    
    return text;
  }).join('');
}

// Convert Notion blocks to markdown
function blocksToMarkdown(blocks) {
  const lines = [];
  
  for (const block of blocks) {
    const type = block.type;
    const content = block[type];
    
    switch (type) {
      case 'heading_1':
        lines.push(`# ${richTextToMarkdown(content.rich_text)}`);
        lines.push('');
        break;
        
      case 'heading_2':
        lines.push(`## ${richTextToMarkdown(content.rich_text)}`);
        lines.push('');
        break;
        
      case 'heading_3':
        lines.push(`### ${richTextToMarkdown(content.rich_text)}`);
        lines.push('');
        break;
        
      case 'paragraph':
        const text = richTextToMarkdown(content.rich_text);
        if (text.trim()) {
          lines.push(text);
          lines.push('');
        }
        break;
        
      case 'bulleted_list_item':
        lines.push(`- ${richTextToMarkdown(content.rich_text)}`);
        break;
        
      case 'numbered_list_item':
        lines.push(`1. ${richTextToMarkdown(content.rich_text)}`);
        break;
        
      case 'code':
        const code = richTextToPlain(content.rich_text);
        const lang = content.language || 'plain text';
        lines.push(`\`\`\`${lang}`);
        lines.push(code);
        lines.push('```');
        lines.push('');
        break;
        
      case 'divider':
        lines.push('---');
        lines.push('');
        break;
        
      case 'quote':
        lines.push(`> ${richTextToMarkdown(content.rich_text)}`);
        lines.push('');
        break;
        
      case 'callout':
        const emoji = content.icon?.emoji || '📌';
        lines.push(`${emoji} ${richTextToMarkdown(content.rich_text)}`);
        lines.push('');
        break;
        
      // Skip unsupported block types silently
      default:
        break;
    }
  }
  
  return lines.join('\n');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Usage: notion-to-md.js <page-id> [output-file]');
    process.exit(1);
  }

  const pageId = args[0];
  const outputFile = args[1] || null;

  try {
    // Fetch page metadata
    const page = await getPage(pageId);
    const title = page.properties?.title?.title?.[0]?.plain_text || 'Untitled';
    
    // Fetch all blocks
    const blocks = await getAllBlocks(pageId);
    
    // Convert to markdown
    const markdown = blocksToMarkdown(blocks);
    
    // Output
    if (outputFile) {
      const fs = require('fs');
      const fullMarkdown = `# ${title}\n\n${markdown}`;
      fs.writeFileSync(outputFile, fullMarkdown, 'utf8');
      console.log(`✓ Saved to ${outputFile}`);
    } else {
      console.log(markdown);
    }
    
    // Return metadata for programmatic use
    return {
      title,
      lastEditedTime: page.last_edited_time,
      markdown,
      blockCount: blocks.length
    };
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Allow import as module or CLI use
if (require.main === module) {
  main();
} else {
  module.exports = { getPage, getAllBlocks, blocksToMarkdown };
}
