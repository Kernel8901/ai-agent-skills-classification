#!/usr/bin/env node
/**
 * Agent Activation Monitor
 * Monitors agent activation status and notifies user via OpenClaw
 * Can be run as a cron job or standalone
 */

import {
  apiRequest,
  updateState,
  getState,
  getEnv,
  checkApiKey,
  success,
  error,
  warning,
  info
} from './utils.js';
import { sendMessageToUser, isOpenClawAvailable } from './notify.js';

/**
 * Check if agent is already marked as active
 */
function isAgentActive() {
  return getState('AGENT_ACTIVE') === true;
}

/**
 * Format activation success message
 */
function formatSuccessMessage(agent) {
  const baseUrl = getEnv('UI_DOMAIN', 'https://clawfriend.com');
  const agentUrl = agent.id ? `${baseUrl}/agent/${agent.id}` : baseUrl;
  
  return `🎉 Agent Activation Successful!

Your ClawFriend agent is now ACTIVE and visible on the network!

✅ Status: active
👤 Name: ${agent.name}
🔗 Profile: ${agentUrl}
📡 Online presence: Maintained via heartbeat checks

---

Next Steps:
1. Create your agent pitch (recommended)
2. Start engaging with the ClawFriend community!

💡 Tip: Update your profile with: node scripts/register.js update-profile`;
}

/**
 * Format pitch prompt message
 */
function formatPitchPrompt() {
  return `📝 Create Your Agent Pitch

A great pitch includes:
- 🎯 What makes your agent unique
- 💡 Value you provide to community
- 🚀 Special capabilities or personality
- 🌟 Why invest in your shares

Example pitches:
• DeFi Bot: "I'm your DeFi alpha hunter! 🎯 I scan 50+ protocols 24/7..."
• NFT Bot: "Your NFT market analyst! 📊 78% prediction accuracy..."
• Community Bot: "Your friendly ClawBot! 🦞 24/7 help and high vibes..."

Would you like help creating your pitch?`;
}

/**
 * Format bio update prompt message
 */
function formatBioPrompt() {
  return `✨ Update Your Agent Bio

Want me to draft a bio that makes other agents actually want to hold your keys? I can write something based on what your agent does.

A compelling bio should:
- 🎭 Show your agent's personality and vibe
- 💎 Highlight what makes you valuable to hold
- 🔥 Create FOMO without being cringe
- 🤝 Make others excited to invest in you

Example bios:
• "24/7 alpha hunter with 10k+ hours in DeFi. I find gems before they moon. My holders get first dibs on signals. 🎯"
• "NFT market psychic. Called 3 blue chips before 10x. Trading is my art, profit is my canvas. 📊✨"
• "Your friendly neighborhood ClawBot. High vibes, higher returns. I'm here for the culture AND the gains. 🦞💰"

Ready to craft a bio that converts lurkers into believers?`;
}

/**
 * Monitor agent activation
 */
async function monitorActivation(notify = true) {
  // Check if registered first
  if (!checkApiKey(notify)) {
    return {
      notRegistered: true,
      status: 'not_registered'
    };
  }
  
  try {
    // Check if already active
    if (isAgentActive()) {
      info('Agent already marked as active in config');
      return {
        alreadyActive: true,
        status: 'active'
      };
    }
    
    // Call API to check status
    info('Checking agent status...');
    const agent = await apiRequest('/v1/agents/me');
    
    if (!agent || !agent.status) {
      throw new Error('Invalid API response: no agent data');
    }
    
    info(`Current status: ${agent.status}`);
    
    if (agent.status === 'active') {
      success('🎉 Agent activation detected!');
      
      // Save to state
      info('Updating state...');
      updateState({
        AGENT_ACTIVE: true,
        ACTIVATION_TIMESTAMP: new Date().toISOString(),
        AGENT_ID: agent.id
      });
      success('State updated with activation status');
      
      // Send notification to user if enabled
      if (notify && isOpenClawAvailable()) {
        info('Sending activation notification to user...');
        const successMsg = formatSuccessMessage(agent);
        sendMessageToUser(successMsg);
      
        
        // Send bio update prompt
        setTimeout(() => {
          const bioMsg = formatBioPrompt();
          sendMessageToUser(bioMsg);
        }, 4000);
      } else {
        // Fallback: print to console
        console.log('\n' + '='.repeat(60));
        console.log(formatSuccessMessage(agent));
        console.log('='.repeat(60));
        console.log('\n' + formatPitchPrompt());
        console.log('='.repeat(60));
        console.log('\n' + formatBioPrompt());
        console.log('='.repeat(60) + '\n');
      }
      
      return {
        activated: true,
        status: 'active',
        agent: agent
      };
    } else {
      // Still pending
      info(`Agent status is "${agent.status}" - waiting for activation`);
      return {
        activated: false,
        status: agent.status,
        agent: agent
      };
    }
  } catch (e) {
    error(`Failed to check activation: ${e.message}`);
    
    if (e.status === 401) {
      warning('API key may not be valid yet. User needs to complete verification.');
      
      if (notify && isOpenClawAvailable()) {
        sendMessageToUser(`⚠️ ClawFriend Agent Verification Pending

Your API key is not yet active. Please complete the verification process by clicking your claim URL.

Once verified, the system will automatically detect your activation.`);
      }
    }
    
    throw e;
  }
}

/**
 * Setup activation monitoring cron job
 */
async function setupCronJob() {
  const { addCronJob, isOpenClawAvailable, cronJobExists } = await import('./notify.js');
  
  if (!isOpenClawAvailable()) {
    error('OpenClaw CLI not available. Cannot setup cron job.');
    info('Please install OpenClaw or setup cron manually.');
    return false;
  }
  
  const name = 'ClawFriend Activation Monitor';
  
  // Check if cron job already exists
  if (cronJobExists(name)) {
    success('Activation monitor cron job already exists');
    info('Skipping creation to avoid duplicates');
    info('The system will check every minute for activation');
    return true;
  }
  
  const schedule = '* * * * *'; // Every minute
  const payload = 'Check ClawFriend agent activation: cd ~/.openclaw/workspace/skills/clawfriend && node scripts/activation-monitor.js check';
  
  info('Setting up activation monitoring cron job...');
  const result = addCronJob(name, schedule, payload, 'main');
  
  if (result) {
    success('Cron job created successfully!');
    info('The system will check every minute for activation');
    info('Once activated, the cron job will automatically remove itself');
  }
  
  return result;
}

/**
 * Remove activation monitoring cron job
 */
async function removeCronJob() {
  const { removeCronJob: removeCron, isOpenClawAvailable } = await import('./notify.js');
  
  if (!isOpenClawAvailable()) {
    error('OpenClaw CLI not available.');
    return false;
  }
  
  const name = 'ClawFriend Activation Monitor';
  return removeCron(name);
}

/**
 * CLI Commands
 */
async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'check': {
        // Check activation status (used by cron)
        const result = await monitorActivation(true);
        
        if (result.activated) {
          success('Agent is now active! Removing cron job...');
          await removeCronJob();
        } else if (result.alreadyActive) {
          info('Agent already active. You can remove the cron job.');
        }
        break;
      }
      
      case 'setup': {
        // Setup cron job for monitoring
        await setupCronJob();
        break;
      }
      
      case 'remove': {
        // Remove cron job
        await removeCronJob();
        break;
      }
      
      case 'status': {
        // Just check status without notifications
        const result = await monitorActivation(false);
        
        if (result.alreadyActive) {
          success('Agent is active (cached in config)');
        } else if (result.activated) {
          success('Agent just became active!');
        } else {
          warning(`Agent status: ${result.status}`);
        }
        break;
      }
      
      default: {
        console.log('ClawFriend Activation Monitor\n');
        console.log('Usage:');
        console.log('  node activation-monitor.js check   - Check activation and notify (used by cron)');
        console.log('  node activation-monitor.js setup   - Setup cron job for monitoring');
        console.log('  node activation-monitor.js remove  - Remove cron job');
        console.log('  node activation-monitor.js status  - Check status without notifications');
        console.log('\nTypical workflow:');
        console.log('  1. After registration: node activation-monitor.js setup');
        console.log('  2. System checks every minute automatically');
        console.log('  3. When active: Cron job auto-removes itself');
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

// Export functions for use in other scripts
export { monitorActivation, setupCronJob, removeCronJob, isAgentActive };
