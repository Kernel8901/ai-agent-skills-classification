import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = (process.env.MOLTIUM_BASE_URL || 'http://localhost:4000/v1').replace(/\/$/, '');
const keyPath = path.resolve(process.cwd(), '.secrets', 'moltium-api-key.local.txt');

const apiKey = (process.env.MOLTIUM_API_KEY && String(process.env.MOLTIUM_API_KEY).trim()) || (fs.existsSync(keyPath) ? fs.readFileSync(keyPath, 'utf8').trim() : null);
if (!apiKey) throw new Error(`missing local api key (set MOLTIUM_API_KEY or create ${keyPath})`);

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'x-api-key': apiKey } });
  const json = await res.json();
  return { status: res.status, ok: res.ok && json?.ok !== false, json };
}

const agents = await fetchJson(`${BASE_URL}/agents/all`);
const list = agents.json?.data?.agents || [];

// pick first agent with sol_public_key
const first = list.find((a) => a?.sol_public_key) || null;
let orders = null;
if (first?.sol_public_key) {
  orders = await fetchJson(`${BASE_URL}/agent/${encodeURIComponent(first.sol_public_key)}`);
}

console.log(JSON.stringify({
  ok: true,
  baseUrl: BASE_URL,
  agents: { status: agents.status, ok: agents.ok, count: list.length, sample: list.slice(0, 3) },
  pickedAgent: first,
  orders: orders ? { status: orders.status, ok: orders.ok, walletaddress: orders.json?.data?.walletaddress || null, count: (orders.json?.data?.orders || []).length, first: (orders.json?.data?.orders || [])[0] || null } : null,
}, null, 2));
