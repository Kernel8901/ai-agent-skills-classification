#!/usr/bin/env node
/**
 * Smart Markdown to Notion Converter
 * Batches blocks efficiently and handles common markdown structures
 */

const fs = require('fs');
const https = require('https');

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_VERSION = '2025-09-03';

if (!NOTION_API_KEY) {
  console.error('Error: NOTION_API_KEY environment variable not set');
  process.exit(1);
}

// Parse markdown into structured blocks
function parseMarkdown(markdown) {
  const lines = markdown.split('\n');
  const blocks = [];
  let currentParagraph = [];
  let inCodeBlock = false;
  let codeLanguage = '';
  let codeContent = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join('\n').trim();
      if (text) {
        blocks.push({
          type: 'paragraph',
          paragraph: {
            rich_text: parseRichText(text)
          }
        });
      }
      currentParagraph = [];
    }
  };

  for (let line of lines) {
    // Code blocks
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        flushParagraph();
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim() || 'plain text';
        codeContent = [];
      } else {
        blocks.push({
          type: 'code',
          code: {
            language: codeLanguage,
            rich_text: [{ type: 'text', text: { content: codeContent.join('\n') } }]
          }
        });
        inCodeBlock = false;
        codeLanguage = '';
        codeContent = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    // Headings
    if (line.match(/^#{1,3}\s+/)) {
      flushParagraph();
      const level = line.match(/^#+/)[0].length;
      const text = line.replace(/^#+\s+/, '').trim();
      blocks.push({
        type: level === 1 ? 'heading_1' : level === 2 ? 'heading_2' : 'heading_3',
        [level === 1 ? 'heading_1' : level === 2 ? 'heading_2' : 'heading_3']: {
          rich_text: parseRichText(text)
        }
      });
      continue;
    }

    // Horizontal rules
    if (line.match(/^---+$/)) {
      flushParagraph();
      blocks.push({
        type: 'divider',
        divider: {}
      });
      continue;
    }

    // Bullet lists
    if (line.match(/^[-*]\s+/)) {
      flushParagraph();
      const text = line.replace(/^[-*]\s+/, '').trim();
      blocks.push({
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: parseRichText(text)
        }
      });
      continue;
    }

    // Empty lines end paragraphs
    if (line.trim() === '') {
      flushParagraph();
      continue;
    }

    // Regular text accumulates into paragraphs
    currentParagraph.push(line);
  }

  flushParagraph();

  return blocks;
}

// Parse rich text with basic markdown formatting
function parseRichText(text) {
  const richText = [];
  
  // Simple parser for bold, italic, links
  // This is a basic implementation - can be enhanced
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\))/);
  
  for (let part of parts) {
    if (!part) continue;
    
    if (part.startsWith('**') && part.endsWith('**')) {
      // Bold
      richText.push({
        type: 'text',
        text: { content: part.slice(2, -2) },
        annotations: { bold: true }
      });
    } else if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      // Italic
      richText.push({
        type: 'text',
        text: { content: part.slice(1, -1) },
        annotations: { italic: true }
      });
    } else if (part.match(/\[(.*?)\]\((.*?)\)/)) {
      // Link
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      richText.push({
        type: 'text',
        text: { content: match[1], link: { url: match[2] } }
      });
    } else {
      // Plain text
      richText.push({
        type: 'text',
        text: { content: part }
      });
    }
  }
  
  return richText.length > 0 ? richText : [{ type: 'text', text: { content: text } }];
}

// Create a page in Notion
function createNotionPage(parentId, title, blocks) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      parent: { page_id: parentId },
      properties: {
        title: {
          title: [{ text: { content: title } }]
        }
      },
      children: blocks.slice(0, 100) // Notion API limit: 100 blocks per request
    });

    const options = {
      hostname: 'api.notion.com',
      path: '/v1/pages',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
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
    req.write(data);
    req.end();
  });
}

// Append remaining blocks to a page
function appendBlocks(pageId, blocks) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      children: blocks.slice(0, 100)
    });

    const options = {
      hostname: 'api.notion.com',
      path: `/v1/blocks/${pageId}/children`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
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
    req.write(data);
    req.end();
  });
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('Usage: md-to-notion.js <markdown-file> <parent-page-id> <page-title>');
    process.exit(1);
  }

  const [mdFile, parentId, pageTitle] = args;

  try {
    const markdown = fs.readFileSync(mdFile, 'utf8');
    const blocks = parseMarkdown(markdown);

    console.log(`Parsed ${blocks.length} blocks from markdown`);

    // Create page with first 100 blocks
    const page = await createNotionPage(parentId, pageTitle, blocks);
    console.log(`✓ Created page: ${page.url}`);

    // Append remaining blocks in batches of 100
    for (let i = 100; i < blocks.length; i += 100) {
      const batch = blocks.slice(i, i + 100);
      await appendBlocks(page.id, batch);
      console.log(`✓ Appended ${batch.length} blocks (${i}-${i + batch.length})`);
      
      // Rate limiting: wait 350ms between requests
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    console.log(`\n✅ Successfully created Notion page!`);
    console.log(`📄 URL: ${page.url}`);
    console.log(`🆔 Page ID: ${page.id}`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
