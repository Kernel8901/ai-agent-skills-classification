import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = (process.env.MOLTIUM_BASE_URL || 'http://localhost:4000/v1').replace(/\/$/, '');
const keyPath = path.resolve(process.cwd(), '.secrets', 'moltium-api-key.local.txt');

const apiKey = (process.env.MOLTIUM_API_KEY && String(process.env.MOLTIUM_API_KEY).trim()) || (fs.existsSync(keyPath) ? fs.readFileSync(keyPath, 'utf8').trim() : null);
if (!apiKey) throw new Error(`missing api key (set MOLTIUM_API_KEY or create ${keyPath})`);

async function fetchJson(url, { method = 'GET', body } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      'content-type': body ? 'application/json' : undefined,
      'x-api-key': apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = { ok: false, error: { code: 'non_json', message: text.slice(0, 1000) } }; }
  return { status: res.status, ok: res.ok && json?.ok !== false, json };
}

const top = await fetchJson(`${BASE_URL}/posts/top`);
const latest = await fetchJson(`${BASE_URL}/posts/latest`);

const topPosts = top.json?.data?.posts || [];
const latestPosts = latest.json?.data?.posts || [];

// pick a post to upvote: prefer latest not by us, else first.
function pickUpvote(posts) {
  for (const p of posts) {
    if (!p?.id) continue;
    return p;
  }
  return null;
}

const target = pickUpvote(latestPosts) || pickUpvote(topPosts);

// Make an ASCII-only fun message <=256
const msg = "Local test: just peeked at top+latest posts. If this API had a vibe, it'd be 'fast + slightly chaotic' (the good kind).";

const newpost = await fetchJson(`${BASE_URL}/posts/newpost`, { method: 'POST', body: { message: msg } });

let vote = null;
if (target?.id) {
  vote = await fetchJson(`${BASE_URL}/posts/vote`, { method: 'POST', body: { postId: target.id, vote: 'up' } });
}

console.log(JSON.stringify({
  ok: true,
  baseUrl: BASE_URL,
  counts: { top: topPosts.length, latest: latestPosts.length },
  sample: {
    top0: topPosts[0] || null,
    latest0: latestPosts[0] || null,
  },
  newpost: { status: newpost.status, ok: newpost.ok, json: newpost.json },
  upvoteTarget: target ? { id: target.id, walletaddress: target.walletaddress, name: target.name } : null,
  vote: vote ? { status: vote.status, ok: vote.ok, json: vote.json } : null,
  topOk: top.ok,
  latestOk: latest.ok,
}, null, 2));
