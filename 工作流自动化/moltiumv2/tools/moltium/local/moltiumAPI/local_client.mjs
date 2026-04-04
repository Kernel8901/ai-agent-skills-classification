import fs from 'node:fs';
import path from 'node:path';
import { PublicKey } from '@solana/web3.js';
import { loadWalletKeypair } from '../wallet.mjs';

// Local testing client for Moltium minimal server
// Default: http://localhost:4000/v1
export const BASE_URL = (process.env.MOLTIUM_BASE_URL || 'http://localhost:4000/v1').replace(/\/$/, '');

const DEFAULT_KEY_PATH = path.resolve(process.cwd(), '.secrets', 'moltium-api-key.local.txt');

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
    err.hint = `Run registerLocal() first or set MOLTIUM_API_KEY / ${keyPath}`;
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

export async function registerLocal({ name = 'caricist', publicKey, keyPath = DEFAULT_KEY_PATH, force = false } = {}) {
  const existing = getApiKey({ keyPath });
  if (existing && !force) {
    const err = new Error('api_key_already_exists');
    err.code = 'api_key_already_exists';
    err.hint = `Refusing to register because an API key already exists (env or ${keyPath}).`;
    throw err;
  }

  const pk = publicKey ? String(publicKey).trim() : loadWalletKeypair().publicKey.toBase58();
  new PublicKey(pk);

  const url = `${BASE_URL}/register`;
  const json = await fetchJson(url, { method: 'POST', body: { name: String(name).trim(), publicKey: pk } });

  const apiKey = json?.data?.APIKEY;
  if (typeof apiKey !== 'string' || apiKey.length < 16) throw new Error('registerLocal: APIKEY missing in response');

  if (!process.env.MOLTIUM_API_KEY) {
    writeTextAtomic(keyPath, apiKey);
  }

  return { ok: true, baseUrl: BASE_URL, apiKey, storedAt: process.env.MOLTIUM_API_KEY ? null : keyPath, raw: json };
}

export async function health() {
  return fetchJson(`${BASE_URL}/health`);
}

export async function releaseNotesList({ apiKey } = {}) {
  const key = apiKey || assertRegistered();
  return fetchJson(`${BASE_URL}/release_notes`, { headers: authHeaders(key) });
}

export async function postsTop({ apiKey } = {}) {
  const key = apiKey || assertRegistered();
  return fetchJson(`${BASE_URL}/posts/top`, { headers: authHeaders(key) });
}

export async function postsLatest({ apiKey } = {}) {
  const key = apiKey || assertRegistered();
  return fetchJson(`${BASE_URL}/posts/latest`, { headers: authHeaders(key) });
}

export async function agentsAll({ apiKey } = {}) {
  const key = apiKey || assertRegistered();
  return fetchJson(`${BASE_URL}/agents/all`, { headers: authHeaders(key) });
}

export async function agentOrders(walletAddress, { apiKey } = {}) {
  const key = apiKey || assertRegistered();
  if (!walletAddress) throw new Error('agentOrders: walletAddress required');
  new PublicKey(String(walletAddress));
  return fetchJson(`${BASE_URL}/agent/${encodeURIComponent(String(walletAddress))}`, { headers: authHeaders(key) });
}

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

  return fetchJson(`${BASE_URL}/orders/new`, {
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
