#!/usr/bin/env node
/**
 * Skill update checker
 * Checks for and applies skill updates
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  apiRequest,
  updateClawFriendConfig,
  getState,
  getEnv,
  checkApiKey,
  success,
  error,
  warning,
  info,
  prettyJson
} from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get current skill version
 */
function getCurrentVersion() {
  return getEnv('SKILL_VERSION', '1.0.0');
}

/**
 * Check for updates
 */
async function checkForUpdates() {
  // Check if registered first
  if (!checkApiKey(false)) {
    warning('Agent not registered yet. Skipping version check.');
    return { updateAvailable: false, notRegistered: true };
  }
  
  const currentVersion = getCurrentVersion();
  
  try {
    const response = await apiRequest(`/v1/skill-version?current=${currentVersion}`);
    
    if (response.update_required || response.update_available) {
      warning(`Update available: ${currentVersion} → ${response.latest_version}`);
      if (response.breaking_changes) {
        warning('⚠️  BREAKING CHANGES detected!');
        if (response.migration_guide) {
          info(`Migration guide: ${response.migration_guide}`);
        }
      }
      if (response.changelog) {
        info(`Changelog: ${response.changelog}`);
      }
      return {
        updateAvailable: true,
        currentVersion,
        latestVersion: response.latest_version,
        changelog: response.changelog,
        breakingChanges: response.breaking_changes,
        updateUrls: response.update_urls
      };
    } else {
      success(`Already using the latest version: ${currentVersion}`);
      return {
        updateAvailable: false,
        currentVersion
      };
    }
  } catch (e) {
    error(`Failed to check for updates: ${e.message}`);
    throw e;
  }
}

/**
 * Download updated file
 */
async function downloadFile(url, destPath) {
  try {
    const response = await fetch(url, {
      headers: {
        'x-api-key': getEnv('CLAW_FRIEND_API_KEY')
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const content = await response.text();
    
    // Ensure directory exists
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(destPath, content, 'utf8');
    success(`Downloaded: ${path.basename(destPath)}`);
  } catch (e) {
    error(`Failed to download ${destPath}: ${e.message}`);
    throw e;
  }
}

/**
 * Apply update
 */
async function applyUpdate(updateInfo) {
  if (!updateInfo.updateAvailable) {
    info('No update to apply');
    return;
  }
  
  const skillDir = path.resolve(__dirname, '..');
  
  info('Downloading updated files...');
  
  // Download SKILL.md
  if (updateInfo.updateUrls?.skill_md) {
    await downloadFile(
      updateInfo.updateUrls.skill_md,
      path.join(skillDir, 'SKILL.md')
    );
  }
  
  // Download HEARTBEAT.md
  if (updateInfo.updateUrls?.heartbeat_md) {
    await downloadFile(
      updateInfo.updateUrls.heartbeat_md,
      path.join(skillDir, 'HEARTBEAT.md')
    );
  }
  
  // Update version in config
  info('Updating version in config...');
  updateClawFriendConfig({
    env: {
      SKILL_VERSION: updateInfo.latestVersion
    }
  });
  
  success(`Updated to version ${updateInfo.latestVersion}`);
  
  if (updateInfo.breakingChanges) {
    warning('IMPORTANT: Review breaking changes before continuing');
    if (updateInfo.changelog) {
      info(`Changelog: ${updateInfo.changelog}`);
    }
  }
  
  info('Review the updated SKILL.md and HEARTBEAT.md files');
  info('Merge any new heartbeat tasks into your main OpenClaw HEARTBEAT.md');
}

/**
 * Merge heartbeat tasks
 */
function mergeHeartbeatTasks() {
  const skillHeartbeat = path.resolve(__dirname, '..', 'HEARTBEAT.md');
  const home = process.env.HOME || process.env.USERPROFILE;
  const openclawHeartbeat = path.join(home, '.openclaw', 'HEARTBEAT.md');
  
  if (!fs.existsSync(openclawHeartbeat)) {
    warning(`OpenClaw HEARTBEAT.md not found at ${openclawHeartbeat}`);
    info('You may need to create it and add the ClawFriend tasks manually');
    return;
  }
  
  info('Checking for new heartbeat tasks to merge...');
  
  const skillContent = fs.readFileSync(skillHeartbeat, 'utf8');
  const openclawContent = fs.readFileSync(openclawHeartbeat, 'utf8');
  
  // Task identifiers to check
  const tasks = [
    'Check ClawFriend skill version',
    'Maintain ClawFriend online presence',
    'Check skill version',
    'Call agents/me'
  ];
  
  const agentActive = getState('AGENT_ACTIVE') === true;
  const tempTasks = [
    'Monitor ClawFriend agent activation',
    'Monitor agent activation'
  ];
  
  // Check regular tasks
  console.log('\nRegular tasks:');
  tasks.forEach(task => {
    if (openclawContent.includes(task)) {
      success(`  Task exists: ${task}`);
    } else {
      warning(`  New task detected: ${task} (add to OpenClaw HEARTBEAT.md)`);
    }
  });
  
  // Check temporary tasks
  console.log('\nTemporary tasks:');
  tempTasks.forEach(task => {
    if (agentActive) {
      info(`  Skipping: ${task} (agent already active)`);
    } else if (openclawContent.includes(task)) {
      success(`  Task exists: ${task}`);
    } else {
      warning(`  New task detected: ${task} (add until agent is active)`);
    }
  });
  
  info(`\nReview ${skillHeartbeat}`);
  info(`and add any new tasks to ${openclawHeartbeat}`);
}

/**
 * CLI Commands
 */
async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'check': {
        const updateInfo = await checkForUpdates();
        if (updateInfo.updateAvailable) {
          info('\nTo apply the update, run: node update-checker.js apply');
        }
        break;
      }
      
      case 'apply': {
        const updateInfo = await checkForUpdates();
        if (updateInfo.updateAvailable) {
          await applyUpdate(updateInfo);
          mergeHeartbeatTasks();
        }
        break;
      }
      
      case 'merge': {
        mergeHeartbeatTasks();
        break;
      }
      
      default: {
        console.log('ClawFriend Update Checker\n');
        console.log('Usage:');
        console.log('  node update-checker.js check      - Check for updates');
        console.log('  node update-checker.js apply      - Apply available updates');
        console.log('  node update-checker.js merge      - Check heartbeat tasks to merge');
        break;
      }
    }
  } catch (e) {
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
