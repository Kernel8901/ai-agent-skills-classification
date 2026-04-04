#!/usr/bin/env python3
"""
Cron Creator - Natural language to openclaw cron command

Usage: python3 cron_creator.py "[natural language request]"
Output: JSON with parsed fields and command

Examples:
  python3 cron_creator.py "Create a daily reminder at 8am"
  python3 cron_creator.py "Remind me to drink water every 2 hours"
"""

import json
import re
import sys
from typing import Dict, Optional, Tuple

# Time patterns
TIME_PATTERNS = {
    r'(\d{1,2})(?::(\d{2}))?\s*(am|pm)': '12h',
    r'(\d{1,2}):(\d{2})\s*(am|pm)?': '12h',
    r'(\d{1,2})\s*(am|pm)': '12h',
    r'(\d{1,2}):(\d{2})': '24h',
    r'(\d{1,2})(?::00)?\s*(am|pm)?': '24h',
    r'noon': 'noon',
    r'midnight': 'midnight',
}

# Frequency patterns
FREQUENCY_PATTERNS = {
    r'every\s*(\d+)\s*(hour|hours|hr|hrs)': 'hourly',
    r'every\s*(\d+)\s*(day|days)': 'daily',
    r'every\s*(\d+)\s*(week|weeks|wk|wks)': 'weekly',
    r'every\s*(\d+)\s*(month|months|mo|mos)': 'monthly',
    r'daily|every\s*day': 'daily',
    r'weekdays?|mon-fri|work\s*days': 'weekdays',
    r'mondays?|every\s*monday': 'mondays',
    r'tuesdays?|every\s*tuesday': 'tuesdays',
    r'wednesdays?|every\s*wednesday': 'wednesdays',
    r'thursdays?|every\s*thursday': 'thursdays',
    r'fridays?|every\s*friday': 'fridays',
    r'saturdays?|every\s*saturday': 'saturdays',
    r'sundays?|every\s*sunday': 'sundays',
    r'weekly|once\s*a\s*week': 'weekly',
    r'monthly|once\s*a\s*month': 'monthly',
    r'hourly|every\s*hour': 'hourly',
}

# Channel patterns
CHANNEL_PATTERNS = {
    r'whatsapp|on\s*whatsapp': 'whatsapp',
    r'telegram|on\s*telegram': 'telegram',
    r'slack|on\s*slack': 'slack',
    r'discord|on\s*discord': 'discord',
    r'signal|on\s*signal': 'signal',
    r'imessage|on\s*imessage': 'imessage',
    r'google\s*chat|on\s*google\s*chat': 'googlechat',
    r'mattermost|on\s*mattermost': 'mattermost',
}

# Purpose keywords to default messages
PURPOSE_MESSAGES = {
    'ikigai': '🌅 Ikigai Journal\n\n1. Purpose - What gives you energy today?\n2. Food - Hara Hachi Bu goal?\n3. Movement - One move today?\n4. Connection - Who will you connect with?\n5. Gratitude - One thing grateful for?',
    'journal': '📝 Journal Time\n\nWhat\'s on your mind today? Reflect and write.',
    'water|hydrate|drink': '💧 Time to drink water! Stay hydrated! 🚰',
    'learning|learn|study': '📚 Learning time! What did you learn today? Even one new thing counts!',
    'exercise|workout|movement': '🏃 Time to move! Even a 10-minute walk makes a difference.',
    'meditation| mindfulness|calm': '🧘 Take a moment to breathe. 5 minutes of stillness.',
    'morning': '🌅 Good morning! Time for your daily check-in. How are you feeling?',
    'evening|night': '🌙 Evening check-in! How was your day?',
    'weekly|week': '📊 Weekly check-in!\n\n1. What went well this week?\n2. What could improve?\n3. Goal for next week?',
    'health|wellness': '💚 Take care of yourself today. Small healthy choices add up!',
    'default': '⏰ Your scheduled reminder is here! Take a moment for yourself.',
}


def parse_time(text: str) -> Optional[str]:
    """Extract time from text and return cron minute/hour."""
    text_lower = text.lower()
    
    # Special cases
    if 'noon' in text_lower:
        return '0 12 * * *'
    if 'midnight' in text_lower:
        return '0 0 * * *'
    
    # Match patterns - support both : and . as separator, and standalone am/pm
    patterns = [
        (r'(\d{1,2})[.:](\d{2})\s*(am|pm)?', '12h'),  # 8.45am or 8:45am
        (r'(\d{1,2})\s*(am|pm)', '12h'),  # 9am, 8pm
        (r'(\d{1,2})[.:](\d{2})', '24h'),
        (r'^(\d{1,2})$', '24h'),
    ]
    
    for pattern, fmt in patterns:
        match = re.search(pattern, text_lower)
        if match:
            groups = match.groups()
            if fmt == '12h':
                hour = int(groups[0])
                # Check if second group is a number (minute) or meridian
                if groups[1].isdigit():
                    minute = int(groups[1])
                    meridian = groups[2] if len(groups) > 2 and groups[2] else ''
                else:
                    minute = 0
                    meridian = groups[1] if groups[1] in ('am', 'pm') else ''
                if meridian == 'pm' and hour != 12:
                    hour += 12
                elif meridian == 'am' and hour == 12:
                    hour = 0
                return f'{minute} {hour} * * *'
            elif fmt == '24h':
                hour = int(groups[0])
                minute = int(groups[1]) if groups[1].isdigit() else 0
                return f'{minute} {hour} * * *'
    
    return None


def parse_frequency(text: str) -> Tuple[str, Optional[str]]:
    """Extract frequency from text. Returns (frequency, day_of_week)."""
    text_lower = text.lower()
    
    # Check for "every X hours/days" pattern first
    every_match = re.search(r'every\s+(\d+)\s+(hour|hours|day|days|week|weeks|month|months)', text_lower)
    if every_match:
        num = int(every_match.group(1))
        unit = every_match.group(2)
        if 'hour' in unit:
            if num == 1:
                return 'hourly', None
            else:
                return 'every_n_hours', str(num)
        if 'day' in unit:
            return 'daily', None
        if 'week' in unit:
            return 'weekly', None
        if 'month' in unit:
            return 'monthly', None
    
    # Check for specific day patterns
    day_patterns = {
        'mondays': 'mondays',
        'tuesdays': 'tuesdays',
        'wednesdays': 'wednesdays',
        'thursdays': 'thursdays',
        'fridays': 'fridays',
        'saturdays': 'saturdays',
        'sundays': 'sundays',
    }
    
    for pattern, day in day_patterns.items():
        if pattern in text_lower or f'every {day}' in text_lower:
            day_map = {'mondays': 1, 'tuesdays': 2, 'wednesdays': 3, 'thursdays': 4, 
                      'fridays': 5, 'saturdays': 6, 'sundays': 0}
            return 'weekly', str(day_map[day])
    
    # Check for other frequencies
    freq_map = {
        'weekdays|mon-fri|work.?day': ('weekdays', None),
        'daily|every.?day': ('daily', None),
        'hourly|every.?hour': ('hourly', None),
        'weekly|once.?a.?week': ('weekly', None),
        'monthly|once.?a.?month': ('monthly', None),
    }
    
    for pattern, (freq, dow) in freq_map.items():
        if re.search(pattern, text_lower):
            return freq, dow
    
    return 'daily', None  # Default


def parse_channel(text: str) -> str:
    """Extract channel from text."""
    text_lower = text.lower()
    for pattern, channel in CHANNEL_PATTERNS.items():
        if re.search(pattern, text_lower):
            return channel
    return 'whatsapp'  # Default


def parse_destination(text: str, channel: str) -> str:
    """Extract destination from text."""
    # Look for phone number
    phone_match = re.search(r'\+?[\d\s\-\(\)]{10,}', text)
    if phone_match:
        return phone_match.group().strip()
    
    # Look for channel identifier
    channel_match = re.search(r'(#\w+|@\w+)', text)
    if channel_match:
        return channel_match.group()
    
    # Default destinations based on channel
    defaults = {
        'whatsapp': '<YOUR_PHONE>',
        'telegram': 'main',
        'slack': '#general',
        'discord': '#general',
    }
    
    return defaults.get(channel, 'main')


def parse_purpose(text: str) -> str:
    """Determine purpose and return appropriate message."""
    text_lower = text.lower()
    
    for pattern, message in PURPOSE_MESSAGES.items():
        if re.search(pattern, text_lower):
            return message
    
    return PURPOSE_MESSAGES['default']


def generate_name(purpose: str, frequency: str, time_cron: str = None) -> str:
    """Generate a descriptive job name."""
    # Try to infer purpose from message
    purpose_lower = purpose.lower()
    
    if 'ikigai' in purpose_lower:
        name = "Ikigai"
    elif 'journal' in purpose_lower:
        name = "Journal"
    elif 'water' in purpose_lower or 'hydrate' in purpose_lower:
        name = "Water Reminder"
    elif 'learning' in purpose_lower or 'learn' in purpose_lower:
        name = "Learning Reminder"
    elif 'exercise' in purpose_lower or 'workout' in purpose_lower:
        name = "Exercise Reminder"
    elif 'meditation' in purpose_lower or 'mindfulness' in purpose_lower:
        name = "Meditation"
    elif 'morning' in purpose_lower:
        name = "Morning Check-in"
    elif 'evening' in purpose_lower or 'night' in purpose_lower:
        name = "Evening Check-in"
    elif 'weekly' in purpose_lower:
        name = "Weekly Check-in"
    elif 'health' in purpose_lower or 'wellness' in purpose_lower:
        name = "Health Reminder"
    else:
        name = "Scheduled Reminder"
    
    # Add frequency context
    if frequency == 'hourly':
        name += " (Hourly)"
    elif frequency == 'daily':
        name += " (Daily)"
    elif frequency == 'weekly':
        name += " (Weekly)"
    elif frequency == 'monthly':
        name += " (Monthly)"
    elif frequency == 'weekdays':
        name += " (Weekdays)"
    
    return name


def build_cron(time_cron: str, frequency: str, day_of_week: str = None) -> str:
    """Build final cron expression."""
    if frequency == 'hourly':
        # Every hour at :00
        return '0 * * * *'
    elif frequency == 'every_n_hours':
        # Every N hours
        hour = int(day_of_week) if day_of_week else 2
        return f'0 */{hour} * * *'
    elif frequency == 'daily':
        # Use parsed time
        return time_cron or '0 9 * * *'
    elif frequency == 'weekdays':
        # Weekdays at parsed time
        parts = (time_cron or '0 9 * * *').split()
        return f'{parts[0]} {parts[1]} * * 1-5'
    elif frequency == 'weekly':
        # Specific day at parsed time
        parts = (time_cron or '0 9 * * *').split()
        dow = day_of_week or '1'  # Default to Monday
        return f'{parts[0]} {parts[1]} * * {dow}'
    elif frequency == 'monthly':
        # First of month at parsed time
        parts = (time_cron or '0 9 * * *').split()
        return f'{parts[0]} {parts[1]} 1 * *'
    else:
        return time_cron or '0 9 * * *'


def parse_request(request: str) -> Dict:
    """Parse a natural language cron request."""
    # Extract time
    time_cron = parse_time(request)
    
    # Extract frequency
    frequency, day_of_week = parse_frequency(request)
    
    # Extract channel
    channel = parse_channel(request)
    
    # Extract destination
    destination = parse_destination(request, channel)
    
    # Get message based on purpose
    message = parse_purpose(request)
    
    # Generate name
    name = generate_name(message, frequency, time_cron)
    
    # Build final cron
    cron = build_cron(time_cron, frequency, day_of_week)
    
    return {
        'name': name,
        'cron': cron,
        'message': message,
        'channel': channel,
        'destination': destination,
        'frequency': frequency,
        'time_cron': time_cron,
    }


def build_command(parsed: Dict) -> str:
    """Build the openclaw cron add command."""
    cmd = [
        'openclaw cron add',
        f'--name="{parsed["name"]}"',
        f'--cron="{parsed["cron"]}"',
        f'--message="{parsed["message"]}"',
        f'--channel={parsed["channel"]}',
        f'--to={parsed["destination"]}',
        '--agent=main',
    ]
    
    return ' \\\n  '.join(cmd)


def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            'error': 'No request provided',
            'usage': 'python3 cron_creator.py "Create a daily reminder at 8am"'
        }))
        sys.exit(1)
    
    request = ' '.join(sys.argv[1:])
    
    try:
        parsed = parse_request(request)
        command = build_command(parsed)
        
        result = {
            'success': True,
            'parsed': parsed,
            'command': command,
        }
        
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e),
            'request': request,
        }))
        sys.exit(1)


if __name__ == '__main__':
    main()
