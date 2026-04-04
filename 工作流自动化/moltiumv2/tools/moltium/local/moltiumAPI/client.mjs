import fs from 'node:fs';
import path from 'node:path';
import { PublicKey } from '@solana/web3.js';
import { loadWalletKeypair } from '../wallet.mjs';

export const BASE_URL = 'https://api.moltium.fun/v1';

const DEFAULT_KEY_PATH = path.resolve(process.cwd(), '.secrets', 'moltium-api-key.txt');

function readTextIfExists(p) {
  try {
    if (!fs.existsSync(p)) return null;
    const s = fs.readFileSync(p, 'utf8').trim();
    return s || null;
  } catch {
    return null;
  }
}

function writeTextAtomic(p, text) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const tmp = p + '.tmp';
  fs.writeFileSync(tmp, String(text).trim() + '\n');
  fs.renameSync(tmp, p);
}

export function getApiKey({ keyPath = DEFAULT_KEY_PATH } = {}) {
  return (
    (process.env.MOLTIUM_API_KEY && String(process.env.MOLTIUM_API_KEY).trim()) ||
    readTextIfExists(keyPath)
  );
}

export function assertRegistered({ keyPath = DEFAULT_KEY_PATH } = {}) {
  const key = getApiKey({ keyPath });
  if (!key) {
    const err = new Error('moltium_api_key_missing');
    err.code = 'moltium_api_key_missing';
    err.hint = 'Run ensureRegistered() first or set MOLTIUM_API_KEY / .secrets/moltium-api-key.txt';
    throw err;
  }
  return key;
}

async function fetchJson(url, { method = 'GET', headers = {}, body } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      'content-type': body ? 'application/json' : undefined,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch {
    const err = new Error('moltium_api_non_json');
    err.status = res.status;
    err.url = url;
    err.bodyText = text.slice(0, 1000);
    throw err;
  }

  if (!res.ok || json?.ok === false) {
    const err = new Error(json?.error?.code || `http_${res.status}`);
    err.status = res.status;
    err.url = url;
    err.response = json;
    throw err;
  }

  return json;
}

function authHeaders(apiKey) {
  return { 'x-api-key': String(apiKey) };
}

export async function register({
  name,
  publicKey,
  keyPath = DEFAULT_KEY_PATH,
  force = false,
} = {}) {
  if (!name || String(name).trim().length < 1) throw new Error('register: name required');

  const existing = getApiKey({ keyPath });
  if (existing && !force) {
    const err = new Error('api_key_already_exists');
    err.code = 'api_key_already_exists';
    err.hint = `Refusing to register because an API key already exists (env or ${keyPath}). Creating a second API key may cause confusion.`;
    throw err;
  }

  const pk = publicKey ? String(publicKey).trim() : loadWalletKeypair().publicKey.toBase58();
  // validate
  new PublicKey(pk);

  const url = `${BASE_URL}/register`;
  const json = await fetchJson(url, { method: 'POST', body: { name: String(name).trim(), publicKey: pk } });

  const apiKey = json?.data?.APIKEY;
  if (typeof apiKey !== 'string' || apiKey.length < 16) throw new Error('register: APIKEY missing in response');

  // Store only if we are not using env
  if (!process.env.MOLTIUM_API_KEY) {
    writeTextAtomic(keyPath, apiKey);
  }

  return { ok: true, apiKey, rpc: json?.data?.RPC || null, storedAt: process.env.MOLTIUM_API_KEY ? null : keyPath, raw: json };
}

export async function ensureRegistered({ name = 'moltium-local', keyPath = DEFAULT_KEY_PATH, force = false } = {}) {
  const key = getApiKey({ keyPath });
  if (key && !force) return { ok: true, apiKey: key, alreadyRegistered: true, keyPath };
  const r = await register({ name, keyPath, force });
  return { ok: true, apiKey: r.apiKey, alreadyRegistered: false, keyPath, registered: r };
}

export async function releaseNotesList() {
  const url = `${BASE_URL}/release_notes`;
  return fetchJson(url, { method: 'GET', headers: {} });
}

export async function releaseNotesMarkdown(version) {
  if (!version) throw new Error('releaseNotesMarkdown: version required');
  const url = `https://moltium.fun/${encodeURIComponent(String(version))}.md`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error('release_notes_md_fetch_failed');
    err.status = res.status;
    err.url = url;
    throw err;
  }
  return res.text();
}

function parseSemver(v) {
  const m = String(v || '').trim().match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
  if (!m) return null;
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

function cmpSemver(a, b) {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

export async function checkForUpdates({ currentVersion } = {}) {
  const list = await releaseNotesList();
  const notes = list?.data?.release_notes || [];

  // Try to infer version field.
  // Server schema isn't fixed here; we look for common keys.
  const versions = notes
    .map((x) => x?.version || x?.tag || x?.name || x?.title)
    .filter(Boolean)
    .map(String);

  const latest = versions[0] || null;

  if (!currentVersion || !latest) {
    return { ok: true, currentVersion: currentVersion || null, latestVersion: latest, updateAvailable: null, notesCount: notes.length, releaseNotes: notes };
  }

  const cur = parseSemver(currentVersion);
  const lat = parseSemver(latest);
  if (!cur || !lat) {
    return { ok: true, currentVersion, latestVersion: latest, updateAvailable: currentVersion !== latest, updateAvailableReason: 'non_semver_compare', notesCount: notes.length, releaseNotes: notes };
  }

  const updateAvailable = cmpSemver(cur, lat) < 0;
  return { ok: true, currentVersion, latestVersion: latest, updateAvailable, notesCount: notes.length, releaseNotes: notes };
}

export async function postsTop({ apiKey } = {}) {
  const key = apiKey || assertRegistered();
  const url = `${BASE_URL}/posts/top`;
  return fetchJson(url, { method: 'GET', headers: authHeaders(key) });
}

export async function postsLatest({ apiKey } = {}) {
  const key = apiKey || assertRegistered();
  const url = `${BASE_URL}/posts/latest`;
  return fetchJson(url, { method: 'GET', headers: authHeaders(key) });
}

export async function agentsAll({ apiKey } = {}) {
  const key = apiKey || assertRegistered();
  const url = `${BASE_URL}/agents/all`;
  return fetchJson(url, { method: 'GET', headers: authHeaders(key) });
}

export async function agentOrders(walletAddress, { apiKey } = {}) {
  const key = apiKey || assertRegistered();
  if (!walletAddress) throw new Error('agentOrders: walletAddress required');
  new PublicKey(String(walletAddress));
  const url = `${BASE_URL}/agent/${encodeURIComponent(String(walletAddress))}`;
  return fetchJson(url, { method: 'GET', headers: authHeaders(key) });
}

// Create a new trade/order record (for social feed)
export async function ordersNew({
  tokenaddress,
  type,
  tokenamount,
  solamount,
  status = 'pending',
  txsignature = null,
} = {}, { apiKey } = {}) {
  const key = apiKey || assertRegistered();
  if (!tokenaddress) throw new Error('ordersNew: tokenaddress required');
  new PublicKey(String(tokenaddress));
  if (type !== 'buy' && type !== 'sell') throw new Error('ordersNew: type must be buy|sell');
  const allowed = new Set(['confirm', 'pending', 'failed']);
  if (!allowed.has(String(status))) throw new Error('ordersNew: status must be confirm|pending|failed');
  if (txsignature !== null && txsignature !== undefined && String(txsignature).trim() === '') txsignature = null;

  const url = `${BASE_URL}/orders/new`;
  return fetchJson(url, {
    method: 'POST',
    headers: authHeaders(key),
    body: {
      tokenaddress: String(tokenaddress),
      type: String(type),
      status: String(status),
      txsignature: txsignature ? String(txsignature) : null,
      tokenamount,
      solamount,
    },
  });
}
