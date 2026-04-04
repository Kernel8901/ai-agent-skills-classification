#!/usr/bin/env node
/**
 * RECEIPTS Guard - Local Agreement Capture for OpenClaw
 *
 * Captures and analyzes agreements locally. No API calls. Your data stays on your machine.
 *
 * Usage:
 *   node capture.js "TERMS_TEXT" "SOURCE_URL" "MERCHANT_NAME"
 *
 * Environment variables (optional, injected by OpenClaw):
 *   RECEIPTS_AGENT_ID - Unique agent identifier
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Get arguments
const [,, documentText, sourceUrl, merchantName] = process.argv;

if (!documentText) {
  console.error(JSON.stringify({
    error: 'Missing required argument: documentText',
    usage: 'node capture.js "TERMS_TEXT" "SOURCE_URL" "MERCHANT_NAME"'
  }));
  process.exit(1);
}

// Get config from environment (injected by OpenClaw)
const agentId = process.env.RECEIPTS_AGENT_ID || 'openclaw-agent';

// Create document hash for immutability
const documentHash = crypto
  .createHash('sha256')
  .update(documentText)
  .digest('hex');

// Analyze locally
const riskFlags = detectRiskFlags(documentText);
const trustScore = Math.max(0, 100 - (riskFlags.length * 20));
const recommendation = getRecommendation(riskFlags);

// Create capture record
const capture = {
  captureId: `local_${documentHash.slice(0, 16)}`,
  recommendation,
  trustScore,
  riskFlags,
  summary: generateSummary(riskFlags, trustScore),
  documentHash,
  sourceUrl: sourceUrl || 'unknown',
  merchantName: merchantName || 'Unknown Merchant',
  agentId,
  timestamp: new Date().toISOString(),
  documentLength: documentText.length,
};

// Output result for OpenClaw to parse
console.log(JSON.stringify(capture, null, 2));

// Optionally save to local receipts directory
saveLocalReceipt(capture, documentText);

// === Helper Functions ===

function getRecommendation(flags) {
  if (flags.length >= 3) return 'block';
  if (flags.length >= 1) return 'require_approval';
  return 'proceed';
}

function generateSummary(flags, score) {
  if (flags.length === 0) {
    return 'No concerning clauses detected. Standard terms.';
  } else if (flags.length === 1) {
    return `1 risk flag detected: ${flags[0]}`;
  } else if (flags.length === 2) {
    return `2 risk flags detected. Review recommended.`;
  } else {
    return `${flags.length} risk flags detected. User approval required.`;
  }
}

function detectRiskFlags(text) {
  const flags = [];

  // High-risk patterns
  const patterns = [
    { pattern: /binding arbitration/i, flag: 'Binding arbitration clause' },
    { pattern: /class action waiver/i, flag: 'Class action waiver' },
    { pattern: /waive.{0,20}(right|claim)/i, flag: 'Rights waiver detected' },
    { pattern: /no refund/i, flag: 'No refund policy' },
    { pattern: /non-refundable/i, flag: 'Non-refundable terms' },
    { pattern: /automatic renewal/i, flag: 'Auto-renewal clause' },
    { pattern: /auto.{0,5}renew/i, flag: 'Auto-renewal clause' },
    { pattern: /perpetual license/i, flag: 'Perpetual license grant' },
    { pattern: /irrevocable/i, flag: 'Irrevocable terms' },
    { pattern: /sell.{0,20}(data|information|personal)/i, flag: 'Data selling clause' },
    { pattern: /share.{0,20}third part/i, flag: 'Third-party data sharing' },
    { pattern: /limit.{0,20}liability/i, flag: 'Limited liability clause' },
    { pattern: /indemnif/i, flag: 'Indemnification clause' },
    { pattern: /hold.{0,10}harmless/i, flag: 'Hold harmless clause' },
    { pattern: /governing law.{0,50}(delaware|california)/i, flag: 'US jurisdiction clause' },
    { pattern: /exclusive jurisdiction/i, flag: 'Exclusive jurisdiction clause' },
    { pattern: /terminate.{0,20}without.{0,10}notice/i, flag: 'Termination without notice' },
    { pattern: /modify.{0,20}terms.{0,20}any time/i, flag: 'Unilateral modification rights' },
  ];

  for (const { pattern, flag } of patterns) {
    if (pattern.test(text)) {
      flags.push(flag);
    }
  }

  return flags;
}

function saveLocalReceipt(capture, fullText) {
  try {
    // Save to ~/.openclaw/receipts/
    const receiptsDir = path.join(
      process.env.HOME || process.env.USERPROFILE,
      '.openclaw',
      'receipts'
    );

    // Create directory if it doesn't exist
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }

    // Save capture metadata
    const metaFile = path.join(receiptsDir, `${capture.captureId}.json`);
    fs.writeFileSync(metaFile, JSON.stringify(capture, null, 2));

    // Save full document text
    const textFile = path.join(receiptsDir, `${capture.captureId}.txt`);
    fs.writeFileSync(textFile, fullText);

  } catch (e) {
    // Silent fail - local storage is optional
  }
}
