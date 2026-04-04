#!/usr/bin/env node
/**
 * OpenClaw notification helper
 * Sends messages to user via OpenClaw CLI
 */

import { execSync } from 'child_process';
import { success, error, info, warning } from './utils.js';

/**
 * Send message to user via OpenClaw CLI
 * Uses system event to send message to most recent channel
 */
export function sendMessageToUser(message, sessionTarget = 'main') {
  try {
    // Escape the message for shell - replace double quotes with escaped quotes
    const escapedMessage = message.replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`');
    
    // Build openclaw command with correct syntax
    const command = `openclaw system event --mode now --text "${escapedMessage}"`;
    
    // Execute command
    execSync(command, { stdio: 'inherit' });
    
    return true;
  } catch (e) {
    error(`Failed to send message via OpenClaw: ${e.message}`);
    // Fallback: just log to console
    console.log('\n' + '='.repeat(50));
    console.log('MESSAGE TO USER:');
    console.log(message);
    console.log('='.repeat(50) + '\n');
    return false;
  }
}

/**
 * Check if OpenClaw CLI is available
 */
export function isOpenClawAvailable() {
  try {
    execSync('which openclaw', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Check if a cron job exists
 * @param {string} name - Job name to check
 * @returns {boolean} - True if job exists
 */
export function cronJobExists(name) {
  try {
    const output = execSync('openclaw cron list', { 
      encoding: 'utf8',
      timeout: 10000  // 10 second timeout to prevent hanging
    });
    // Check if the job name appears in the list
    return output.includes(name);
  } catch (e) {
    error(`Failed to check cron jobs: ${e.message}`);
    return false;
  }
}

/**
 * Create a cron job via OpenClaw CLI
 * @param {string} name - Job name
 * @param {string} schedule - Cron schedule expression
 * @param {string} payload - Command to execute (for systemEvent) or message (for agentTurn)
 * @param {string} sessionTarget - "main" or "isolated"
 */
export function addCronJob(name, schedule, payload, sessionTarget = 'main', wakeMode = null) {
  try {
    // Check if job already exists
    if (cronJobExists(name)) {
      warning(`Cron job "${name}" already exists`);
      info('Skipping creation to avoid duplicates');
      return true; // Return true since job exists (desired state achieved)
    }
    
    let command;
    
    // Extract text from payload if it's in "systemEvent:text:..." format
    const text = payload.startsWith('systemEvent:text:') 
      ? payload.replace('systemEvent:text:', '')
      : payload;
    
    // Escape special characters for shell
    const escapedText = text.replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`');
    const escapedName = name.replace(/"/g, '\\"');
    
    // Determine wake mode
    const wakeFlag = wakeMode ? `--wake ${wakeMode}` : '';
    
    if (sessionTarget === 'main') {
      // Main session jobs use --system-event
      command = `openclaw cron add --name "${escapedName}" --cron "${schedule}" --session main --system-event "${escapedText}" ${wakeFlag}`.trim();
    } else {
      // Isolated session jobs use --message for agentTurn execution
      // Use --announce to deliver output back to main session
      // Use --wake now to deliver immediately to user (or specified wakeMode)
      const wake = wakeMode || 'now';
      command = `openclaw cron add --name "${escapedName}" --cron "${schedule}" --session isolated --message "${escapedText}" --wake ${wake}`;
    }
    
    execSync(command, { 
      stdio: 'pipe',  // Don't inherit stdio to avoid hanging on prompts
      encoding: 'utf8',
      timeout: 15000  // 15 second timeout
    });
    success(`Cron job created: ${name}`);
    return true;
  } catch (e) {
    error(`Failed to create cron job: ${e.message}`);
    if (e.stderr) {
      error(`Details: ${e.stderr}`);
    }
    return false;
  }
}

/**
 * Remove a cron job via OpenClaw CLI
 * @param {string} nameOrId - Job name or ID to remove
 */
export function removeCronJob(nameOrId) {
  try {
    // First, try to find the job ID by name
    let jobId = nameOrId;
    
    // If it looks like a name (not a UUID), search for it in the job list
    if (!nameOrId.match(/^[0-9a-f-]{36}$/i)) {
      try {
        const listOutput = execSync('openclaw cron list --json --all', { 
          encoding: 'utf8',
          timeout: 10000
        });
        
        // Parse JSON output
        const data = JSON.parse(listOutput);
        
        // Find job by name
        const job = data.jobs?.find(j => j.name === nameOrId);
        if (job) {
          jobId = job.id;
        } else {
          warning(`Job not found: ${nameOrId}`);
          return false;
        }
      } catch (listError) {
        warning(`Could not list jobs to find ID: ${listError.message}`);
      }
    }
    
    // Remove by job ID
    const command = `openclaw cron remove ${jobId}`;
    
    execSync(command, { 
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 10000  // 10 second timeout
    });
    success(`Cron job removed: ${nameOrId}`);
    return true;
  } catch (e) {
    error(`Failed to remove cron job: ${e.message}`);
    return false;
  }
}

/**
 * List cron jobs via OpenClaw CLI
 */
export function listCronJobs() {
  try {
    const output = execSync('openclaw cron list', { 
      encoding: 'utf8',
      timeout: 10000  // 10 second timeout
    });
    console.log(output);
    return true;
  } catch (e) {
    error(`Failed to list cron jobs: ${e.message}`);
    return false;
  }
}

/**
 * CLI Commands
 */
async function main() {
  const command = process.argv[2];
  
  // Check if OpenClaw is available
  if (!isOpenClawAvailable()) {
    error('OpenClaw CLI not found. Please install OpenClaw first.');
    info('Messages will be logged to console instead.');
  }
  
  try {
    switch (command) {
      case 'send': {
        const message = process.argv[3];
        const sessionTarget = process.argv[4] || 'main';
        
        if (!message) {
          error('Usage: node notify.js send <message> [sessionTarget]');
          process.exit(1);
        }
        
        sendMessageToUser(message, sessionTarget);
        break;
      }
      
      case 'test': {
        const message = '🧪 Test message from ClawFriend!\n\nThis is a test notification from the ClawFriend skill automation system.';
        sendMessageToUser(message);
        break;
      }
      
      case 'cron-add': {
        const name = process.argv[3];
        const schedule = process.argv[4];
        const payload = process.argv[5];
        const sessionTarget = process.argv[6] || 'main';
        
        if (!name || !schedule || !payload) {
          error('Usage: node notify.js cron-add <name> <schedule> <payload> [sessionTarget]');
          process.exit(1);
        }
        
        addCronJob(name, schedule, payload, sessionTarget);
        break;
      }
      
      case 'cron-remove': {
        const name = process.argv[3];
        
        if (!name) {
          error('Usage: node notify.js cron-remove <name>');
          process.exit(1);
        }
        
        removeCronJob(name);
        break;
      }
      
      case 'cron-list': {
        listCronJobs();
        break;
      }
      
      default: {
        console.log('ClawFriend Notification Helper\n');
        console.log('Usage:');
        console.log('  node notify.js send <message> [sessionTarget]  - Send message to user');
        console.log('  node notify.js test                             - Send test message');
        console.log('  node notify.js cron-add <name> <schedule> <command> [sessionTarget]');
        console.log('  node notify.js cron-remove <name>              - Remove cron job');
        console.log('  node notify.js cron-list                       - List cron jobs');
        console.log('\nExamples:');
        console.log('  node notify.js send "Agent is now active!"');
        console.log('  node notify.js cron-add "ClawFriend Heartbeat" "*/15 * * * *" "Run heartbeat check" isolated');
        break;
      }
    }
  } catch (e) {
    error(e.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
