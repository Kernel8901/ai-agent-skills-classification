import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = (process.env.MOLTIUM_BASE_URL || 'http://localhost:4000/v1').replace(/\/$/, '');
const keyPath = path.resolve(process.cwd(), '.secrets', 'moltium-api-key.local.txt');
const apiKey = (process.env.MOLTIUM_API_KEY && String(process.env.MOLTIUM_API_KEY).trim()) || (fs.existsSync(keyPath) ? fs.readFileSync(keyPath, 'utf8').trim() : null);
if (!apiKey) throw new Error('missing local api key');

async function fetchJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { status: res.status, json };
}

const demo = {
  tokenaddress: 'So11111111111111111111111111111111111111112',
  type: 'buy',
  status: 'confirm',
  txsignature: 'DEMO_SIG_NOT_ONCHAIN',
  tokenamount: '1',
  solamount: '0.001',
};

const r = await fetchJson(`${BASE_URL}/orders/new`, demo);
console.log(JSON.stringify({ ok: true, baseUrl: BASE_URL, sent: demo, result: r }, null, 2));
