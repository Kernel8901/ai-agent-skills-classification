#!/usr/bin/env python3
"""
HTML Writer for TubeScribe
==========================

Generates clean HTML documents from markdown transcript data.
Zero dependencies, opens in any browser, looks great.

Usage:
    from html_writer import create_html_from_markdown
    create_html_from_markdown(md_path, output_path)
"""

import re
from datetime import datetime


def markdown_to_html(md_text: str) -> str:
    """Convert markdown text to HTML."""
    lines = md_text.split('\n')
    html_lines = []
    in_table = False
    table_past_separator = False  # Track if we've passed the header separator
    in_blockquote = False
    blockquote_lines = []
    
    def flush_blockquote():
        """Flush accumulated blockquote lines."""
        nonlocal in_blockquote, blockquote_lines
        if blockquote_lines:
            content = '</p><p>'.join(blockquote_lines)
            html_lines.append(f'<blockquote><p>{content}</p></blockquote>')
            blockquote_lines = []
        in_blockquote = False
    
    for line in lines:
        # Blockquote handling: > text
        if line.startswith('> '):
            if in_table:
                html_lines.append('</table>')
                in_table = False
                table_past_separator = False
            quote_text = process_inline_formatting(line[2:])
            blockquote_lines.append(quote_text)
            in_blockquote = True
            continue
        elif in_blockquote:
            flush_blockquote()
        
        # Headers
        if line.startswith('# '):
            html_lines.append(f'<h1>{escape_html(line[2:])}</h1>')
        elif line.startswith('## '):
            html_lines.append(f'<h2>{escape_html(line[3:])}</h2>')
        elif line.startswith('### '):
            html_lines.append(f'<h3>{escape_html(line[4:])}</h3>')
        elif line.startswith('---'):
            html_lines.append('<hr>')
        elif line.startswith('|'):
            # Table handling
            if not in_table:
                html_lines.append('<table>')
                in_table = True
                table_past_separator = False
            # Check for separator row (contains only |, -, :, and spaces)
            if re.match(r'^[\s|:\-]+$', line):
                table_past_separator = True
                continue  # Skip separator row
            cells = [c.strip() for c in line.split('|')[1:-1]]
            # First row before separator = <th>, all rows after = <td>
            tag = 'td' if table_past_separator else 'th'
            row = ''.join(f'<{tag}>{escape_html(c)}</{tag}>' for c in cells)
            html_lines.append(f'<tr>{row}</tr>')
        elif line.strip() == '':
            if in_table:
                html_lines.append('</table>')
                in_table = False
                table_past_separator = False
            html_lines.append('')
        elif line.lstrip().startswith('<') and not line.lstrip().startswith('<http'):
            # Raw HTML line - pass through without wrapping in <p>
            # Check if it looks like an HTML tag (not a markdown link starting with <http)
            if in_table:
                html_lines.append('</table>')
                in_table = False
                table_past_separator = False
            html_lines.append(line)
        else:
            if in_table:
                html_lines.append('</table>')
                in_table = False
                table_past_separator = False
            # Process inline formatting
            processed = process_inline_formatting(line)
            html_lines.append(f'<p>{processed}</p>')
    
    # Flush any remaining blockquote
    if in_blockquote:
        flush_blockquote()
    
    if in_table:
        html_lines.append('</table>')
    
    return '\n'.join(html_lines)


def escape_html(text: str) -> str:
    """Escape HTML special characters."""
    return (text
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('"', '&quot;'))


def process_inline_formatting(text: str) -> str:
    """Process inline markdown formatting with XSS protection."""
    # FIRST: Escape HTML to prevent XSS (before processing markdown)
    text = escape_html(text)
    
    # Bold: **text** or __text__
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'__(.+?)__', r'<strong>\1</strong>', text)
    
    # Italic: *text* or _text_
    text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', text)
    text = re.sub(r'(?<!\w)_(.+?)_(?!\w)', r'<em>\1</em>', text)
    
    # Links: [text](url) — only allow safe URLs
    # Note: URLs are already escaped, so we need to handle &amp; etc.
    def safe_link(match):
        link_text, url = match.groups()
        # Only allow http, https, and relative URLs (prevent javascript: etc.)
        # URL is already escaped, so check for escaped versions too
        if url.startswith(('http://', 'https://', '/')) or url.startswith(('http://', 'https://')):
            return f'<a href="{url}" target="_blank">{link_text}</a>'
        return f'{link_text} ({url})'  # Don't make unsafe URLs clickable
    
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', safe_link, text)
    
    return text


def create_html_from_markdown(md_path: str, output_path: str) -> str:
    """Convert a markdown file to a styled HTML document."""
    with open(md_path, 'r', encoding='utf-8') as f:
        md_content = f.read()
    
    # Extract title from first H1
    title_match = re.search(r'^# (.+)$', md_content, re.MULTILINE)
    title = title_match.group(1) if title_match else "TubeScribe Transcript"
    
    # Convert content
    html_body = markdown_to_html(md_content)
    
    # Wrap in full HTML document with nice styling
    html_doc = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{escape_html(title)}</title>
    <style>
        :root {{
            --bg: #ffffff;
            --text: #1a1a1a;
            --accent: #0066cc;
            --border: #e0e0e0;
            --quote-bg: #f5f5f5;
        }}
        @media (prefers-color-scheme: dark) {{
            :root {{
                --bg: #1a1a1a;
                --text: #e0e0e0;
                --accent: #66b3ff;
                --border: #333;
                --quote-bg: #252525;
            }}
        }}
        * {{ box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background: var(--bg);
            color: var(--text);
        }}
        h1 {{ 
            font-size: 2rem; 
            border-bottom: 2px solid var(--accent);
            padding-bottom: 0.5rem;
        }}
        h2 {{ 
            font-size: 1.5rem; 
            margin-top: 2rem;
            color: var(--accent);
        }}
        h3 {{ font-size: 1.25rem; }}
        a {{ color: var(--accent); }}
        a:hover {{ text-decoration: none; }}
        hr {{ 
            border: none; 
            border-top: 1px solid var(--border); 
            margin: 2rem 0;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
        }}
        th, td {{
            padding: 0.5rem 1rem;
            text-align: left;
            border: 1px solid var(--border);
        }}
        th {{ background: var(--quote-bg); }}
        p {{ margin: 0.75rem 0; }}
        strong {{ font-weight: 600; }}
        .timestamp {{
            font-family: monospace;
            background: var(--quote-bg);
            padding: 0.1rem 0.3rem;
            border-radius: 3px;
        }}
        footer {{
            margin-top: 3rem;
            padding-top: 1rem;
            border-top: 1px solid var(--border);
            font-size: 0.85rem;
            color: #888;
        }}
    </style>
</head>
<body>
{html_body}
<footer>
    Generated by TubeScribe 🎬 • {datetime.now().strftime('%Y-%m-%d %H:%M')}
</footer>
</body>
</html>'''
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_doc)
    
    return output_path


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        md_path = sys.argv[1]
        out_path = sys.argv[2] if len(sys.argv) > 2 else md_path.replace('.md', '.html')
        result = create_html_from_markdown(md_path, out_path)
        print(f"Created: {result}")
