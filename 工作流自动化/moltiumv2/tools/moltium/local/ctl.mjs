#!/usr/bin/env node
// MoltiumV2 local toolkit controller
// Commands:
//   node tools/moltium/local/ctl.mjs doctor
//   node tools/moltium/local/ctl.mjs init

import fs from 'node:fs';
import path from 'node:path';
import { Keypair, PublicKey } from '@solana/web3.js';

import { getConnection, getConnectionAuto, listRpcCandidates } from './rpc/connection.mjs';
import { loadWalletKeypair } from './wallet.mjs';
import { DEFAULT_FEE_TO } from './fees/sol_fee.mjs';

function usage() {
  console.error('usage: ctl.mjs <doctor|init> [--pretty|--json]');
  console.error('  --pretty  human-readable output (default is JSON)');
  console.error('  --json    force JSON output');
  console.error('init flags:');
  console.error('  --no-wallet               do not auto-generate .secrets/moltium-wallet.json');
  console.error('  --with-rpc-placeholders   also create provider *.txt stubs from templates (will contain REPLACE_ME)');
  process.exit(2);
}

const cmd = process.argv[2];
const pretty = process.argv.includes('--pretty');
const forceJson = process.argv.includes('--json');
if (!cmd) usage();

function exists(p) { try { return fs.existsSync(p); } catch { return false; } }

function readTextIfExists(p) {
  try {
    if (!exists(p)) return null;
    const s = fs.readFileSync(p, 'utf8').trim();
    return s || null;
  } catch {
    return null;
  }
}

function copyIfMissing(src, dst) {
  if (exists(dst)) return { ok: true, skipped: true, dst };
  if (!exists(src)) return { ok: false, error: 'template_missing', src, dst };
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  return { ok: true, copied: true, src, dst };
}

async function doctor() {
  const root = path.resolve(process.cwd());
  const secretsDir = path.resolve(root, '.secrets');
  const walletPath = path.resolve(secretsDir, 'moltium-wallet.json');

  const apiKeyPath = path.resolve(secretsDir, 'moltium-api-key.txt');
  const apiKeyLocalPath = path.resolve(secretsDir, 'moltium-api-key.local.txt');

  const rpcDir = path.resolve(secretsDir, 'rpc');
  const rpcCfg = path.resolve(rpcDir, 'config.json');

  const issues = [];
  const recommendations = [];

  // wallet
  let walletPubkey = null;
  let walletOk = false;
  try {
    if (!exists(walletPath)) {
      issues.push({ code: 'wallet_missing', message: `Missing ${walletPath}` });
      recommendations.push({ code: 'add_wallet', why: 'Provide a funded Solana keypair JSON at .secrets/moltium-wallet.json (never commit it)' });
    } else {
      const kp = loadWalletKeypair();
      walletPubkey = kp.publicKey.toBase58();
      walletOk = true;
    }
  } catch (e) {
    issues.push({ code: 'wallet_load_failed', message: String(e?.message || e) });
  }

  // rpc
  const candidates = listRpcCandidates();

  // Only warn about placeholders if they are actually selected by config priority/default.
  let rpcCfgObj = null;
  try {
    if (exists(rpcCfg)) rpcCfgObj = JSON.parse(fs.readFileSync(rpcCfg, 'utf8'));
  } catch {
    rpcCfgObj = null;
  }
  const namesUsed = new Set();
  if (rpcCfgObj?.default) namesUsed.add(String(rpcCfgObj.default));
  if (Array.isArray(rpcCfgObj?.priority)) for (const n of rpcCfgObj.priority) namesUsed.add(String(n));
  // If no config, be conservative.
  if (namesUsed.size === 0) for (const c of candidates) namesUsed.add(String(c.name));

  const hasPlaceholderUsed = candidates
    .filter(c => namesUsed.has(String(c.name)))
    .some(c => String(c.url).includes('REPLACE_ME') || String(c.url).includes('YOUR-QUICKNODE'));

  if (hasPlaceholderUsed) {
    issues.push({ code: 'rpc_placeholder_urls', message: 'RPC config selects placeholder URLs (REPLACE_ME / YOUR-QUICKNODE). Edit .secrets/rpc/*.txt or remove them from priority/default.' });
    recommendations.push({ code: 'edit_rpc_urls', why: 'Replace placeholders in .secrets/rpc/*.txt with real provider URLs to improve reliability.' });
  }
  if (!exists(rpcDir)) {
    issues.push({ code: 'rpc_dir_missing', message: `Missing ${rpcDir}` });
    recommendations.push({ code: 'run_init', command: 'node tools/moltium/local/ctl.mjs init', why: 'Create RPC templates/stubs under .secrets/rpc/' });
  }
  if (!exists(rpcCfg)) {
    issues.push({ code: 'rpc_config_missing', message: `Missing ${rpcCfg} (multi-provider recommended)` });
    recommendations.push({ code: 'create_rpc_config', command: 'node tools/moltium/local/ctl.mjs init', why: 'Create .secrets/rpc/config.json from template (no overwrite)' });
  }

  // balance + rpc health
  let solBalLamports = null;
  let solBal = null;
  let rpcSelected = null;
  let rpcUrl = null;
  let rpcAuto = null;

  if (walletOk) {
    try {
      const { conn, rpcUrl: u, selected } = await getConnectionAuto({ commitment: 'confirmed', timeoutMs: 2500 });
      rpcAuto = { selected, rpcUrl: u };
      rpcSelected = selected;
      rpcUrl = u;
      solBalLamports = await conn.getBalance(new PublicKey(walletPubkey), 'confirmed');
      solBal = solBalLamports / 1e9;
    } catch (e) {
      issues.push({ code: 'rpc_healthcheck_failed', message: String(e?.message || e) });
      try {
        const r = getConnection('confirmed');
        rpcUrl = r.rpcUrl;
        solBalLamports = await r.conn.getBalance(new PublicKey(walletPubkey), 'confirmed');
        solBal = solBalLamports / 1e9;
      } catch (e2) {
        issues.push({ code: 'rpc_balance_failed', message: String(e2?.message || e2) });
      }
    }
  }

  // fee recipient existence
  const feeTo = process.env.MOLTIUM_FEE_TO || DEFAULT_FEE_TO;
  let feeToInfo = null;
  if (rpcUrl) {
    try {
      const { conn } = await getConnectionAuto({ commitment: 'confirmed', timeoutMs: 2500 });
      const info = await conn.getAccountInfo(new PublicKey(feeTo), 'confirmed');
      feeToInfo = info ? { exists: true, owner: info.owner.toBase58(), lamports: info.lamports } : { exists: false };
      if (!info) {
        issues.push({ code: 'fee_recipient_not_initialized', message: `Fee recipient ${feeTo} not found on-chain; fund it once with tiny SOL.` });
        recommendations.push({ code: 'init_fee_recipient', why: 'Fund the fee recipient pubkey once (tiny SOL) so SystemProgram.transfer can succeed' });
      }
    } catch (e) {
      recommendations.push({ code: 'fee_recipient_check_failed', why: `Could not check fee recipient existence: ${String(e?.message||e)}` });
    }
  }

  // moltium API keys (optional)
  const apiKey = process.env.MOLTIUM_API_KEY ? 'env:MOLTIUM_API_KEY' : (readTextIfExists(apiKeyPath) ? apiKeyPath : null);
  const apiKeyLocal = readTextIfExists(apiKeyLocalPath) ? apiKeyLocalPath : null;
  if (!apiKey) {
    recommendations.push({ code: 'moltium_api_optional', why: 'Moltium API key not configured (optional). If you want social/agents/orders, set MOLTIUM_API_KEY or .secrets/moltium-api-key.txt' });
  }

  // Some issues are "non-fatal"; they shouldn't mark the toolkit unusable.
  // Placeholder RPC URLs are a warning; public fallback can still work.
  const nonFatalCodes = new Set(['rpc_placeholder_urls']);
  const fatal = issues.filter(i => !nonFatalCodes.has(i.code));
  const warnings = issues.filter(i => nonFatalCodes.has(i.code));
  const ok = fatal.length === 0;
  const out = {
    ok,
    warnings,
    root,
    secretsDir,
    wallet: { ok: walletOk, pubkey: walletPubkey, path: walletPath },
    sol: walletOk ? { lamports: solBalLamports, sol: solBal, rpcUrl, rpcAuto, candidates } : null,
    rpc: { candidates, envOverride: process.env.SOLANA_RPC || null, configPath: rpcCfg, rpcDir },
    fee: { feeTo, feeToInfo },
    moltiumAPI: { prodKey: apiKey, localKey: apiKeyLocal },
    issues,
    recommendations,
  };

  if (pretty) {
    const lines = [];
    lines.push(`MoltiumV2 doctor: ${ok ? 'OK' : 'NOT_OK'}`);
    if (walletPubkey) lines.push(`- wallet: ${walletPubkey}`);
    if (rpcUrl) lines.push(`- rpc: ${rpcUrl}${rpcSelected ? ` (${rpcSelected})` : ''}`);
    if (solBal !== null) lines.push(`- sol: ${solBal}`);
    if (fatal.length) {
      lines.push('Issues (fatal):');
      for (const i of fatal) lines.push(`- ${i.code}: ${i.message}`);
    }
    if (warnings.length) {
      lines.push('Warnings:');
      for (const w of warnings) lines.push(`- ${w.code}: ${w.message}`);
    }
    if (recommendations.length) {
      lines.push('Next steps:');
      for (const r of recommendations) {
        lines.push(`- ${r.code}: ${r.command || ''} ${r.why || ''}`.trim());
      }
    }
    out.pretty = lines.join('\n');
  }

  return out;
}

async function init() {
  const root = path.resolve(process.cwd());
  const secretsDir = path.resolve(root, '.secrets');
  const rpcDir = path.resolve(secretsDir, 'rpc');
  fs.mkdirSync(rpcDir, { recursive: true });

  const created = [];

  const noWallet = process.argv.includes('--no-wallet');
  const withRpcPlaceholders = process.argv.includes('--with-rpc-placeholders');

  // 1) Wallet (auto-generate on first install, unless disabled)
  const walletPath = path.resolve(secretsDir, 'moltium-wallet.json');
  let walletPubkey = null;
  let walletGenerated = false;
  if (!exists(walletPath)) {
    if (noWallet) {
      created.push({ ok: true, skipped: true, dst: walletPath, note: '--no-wallet set; not generating' });
    } else {
      const kp = Keypair.generate();
      walletPubkey = kp.publicKey.toBase58();
      walletGenerated = true;
      fs.mkdirSync(path.dirname(walletPath), { recursive: true });
      fs.writeFileSync(walletPath, JSON.stringify(Array.from(kp.secretKey), null, 0));
      created.push({ ok: true, created: true, dst: walletPath, note: `generated new wallet (pubkey=${walletPubkey}). Fund it before trading.` });
    }
  } else {
    try {
      const kp = loadWalletKeypair();
      walletPubkey = kp.publicKey.toBase58();
    } catch {
      // ignore here; doctor will report
    }
    created.push({ ok: true, skipped: true, dst: walletPath });
  }

  // 2) RPC default (no placeholders by default)
  // Always ensure templates exist for reference, but create a working default config.
  created.push(copyIfMissing(path.resolve(rpcDir, 'config.json.template'), path.resolve(rpcDir, 'config.json.template')));
  for (const name of ['helius', 'quicknode', 'alchemy', 'triton', 'ankr', 'public']) {
    created.push(copyIfMissing(path.resolve(rpcDir, `${name}.txt.template`), path.resolve(rpcDir, `${name}.txt.template`)));
  }

  const rpcCfgPath = path.resolve(rpcDir, 'config.json');
  if (!exists(rpcCfgPath)) {
    const cfg = { default: 'public', priority: ['public'] };
    fs.writeFileSync(rpcCfgPath, JSON.stringify(cfg, null, 2) + '\n');
    created.push({ ok: true, created: true, dst: rpcCfgPath, note: 'default RPC config (public only)' });
  } else {
    created.push({ ok: true, skipped: true, dst: rpcCfgPath });
  }

  const publicTxt = path.resolve(rpcDir, 'public.txt');
  if (!exists(publicTxt)) {
    fs.writeFileSync(publicTxt, 'https://api.mainnet-beta.solana.com\n');
    created.push({ ok: true, created: true, dst: publicTxt, note: 'default public RPC URL' });
  } else {
    created.push({ ok: true, skipped: true, dst: publicTxt });
  }

  if (withRpcPlaceholders) {
    for (const name of ['helius', 'quicknode', 'alchemy', 'triton', 'ankr']) {
      created.push(copyIfMissing(path.resolve(rpcDir, `${name}.txt.template`), path.resolve(rpcDir, `${name}.txt`)));
    }
  }

  // 3) Moltium API key stub (optional)
  const apiKeyPath = path.resolve(secretsDir, 'moltium-api-key.txt');
  if (!exists(apiKeyPath) && !process.env.MOLTIUM_API_KEY) {
    fs.writeFileSync(apiKeyPath, 'REPLACE_ME_WITH_PROD_API_KEY\n');
    created.push({ ok: true, created: true, dst: apiKeyPath, note: 'optional; replace or delete' });
  } else {
    created.push({ ok: true, skipped: true, dst: apiKeyPath });
  }

  const nextSteps = [];
  if (walletGenerated) {
    nextSteps.push({
      what: 'Fund your new wallet',
      required: true,
      path: walletPath,
      note: `A new wallet was generated (pubkey=${walletPubkey}). Send SOL to it before trading.`,
    });
  } else {
    nextSteps.push({
      what: 'Ensure wallet exists and is funded',
      required: true,
      path: walletPath,
      note: 'Wallet is required for trading. Keep it private; never commit it.',
    });
  }

  nextSteps.push({
    what: 'Configure RPC providers (optional but recommended)',
    required: false,
    path: rpcDir,
    note: 'By default you are set to public RPC. Add provider URLs and update config.json priority for better reliability.',
  });

  nextSteps.push({
    what: 'Moltium API key (optional)',
    required: false,
    path: apiKeyPath,
    note: 'Only needed if you want posts/agents/orders/release notes. Otherwise delete or ignore.',
  });

  return {
    ok: true,
    secretsDir,
    rpcDir,
    wallet: { path: walletPath, pubkey: walletPubkey, generated: walletGenerated },
    created,
    nextSteps,
    recommendedCommand: 'node tools/moltium/local/ctl.mjs doctor --pretty',
  };
}

(async () => {
  if (cmd === 'doctor') {
    const r = await doctor();
    if (pretty && !forceJson) {
      console.log(r.pretty || '');
    } else {
      console.log(JSON.stringify(r, null, 2));
    }
    process.exit(r.ok ? 0 : 1);
  }
  if (cmd === 'init') {
    const r = await init();
    if (pretty && !forceJson) {
      // Print a small friendly summary without leaking secrets.
      const lines = [];
      lines.push('MoltiumV2 init: OK');
      if (r.wallet?.pubkey) lines.push(`- wallet pubkey: ${r.wallet.pubkey}${r.wallet.generated ? ' (generated)' : ''}`);
      lines.push(`- secretsDir: ${r.secretsDir}`);
      lines.push(`- rpcDir: ${r.rpcDir}`);
      if (Array.isArray(r.nextSteps) && r.nextSteps.length) {
        lines.push('Next steps:');
        for (const s of r.nextSteps) lines.push(`- ${s.what}: ${s.note}`);
      }
      console.log(lines.join('\n'));
    } else {
      console.log(JSON.stringify(r, null, 2));
    }
    process.exit(0);
  }
  usage();
})();
