import fs from 'node:fs';

// Upload token metadata + image via pump.fun official endpoint.
// No API key required (subject to pump.fun rate limits / policy).
//
// Response typically includes:
// - metadata (object)
// - metadataUri (string)
// - imageUri (string, optional)

export async function pumpfunUploadIpfs({
  name,
  symbol,
  description = '',
  imagePath,
  imageMime = 'image/png',
  website,
  twitter,
  telegram,
} = {}) {
  if (!name || !symbol) throw new Error('pumpfunUploadIpfs: {name, symbol} required');
  if (!imagePath) throw new Error('pumpfunUploadIpfs: {imagePath} required');
  if (!fs.existsSync(imagePath)) throw new Error(`pumpfunUploadIpfs: image not found: ${imagePath}`);

  const buf = fs.readFileSync(imagePath);

  // Node 22: FormData/Blob are available globally.
  const form = new FormData();
  form.append('file', new Blob([buf], { type: imageMime }), 'logo.png');
  form.append('name', String(name));
  form.append('symbol', String(symbol));
  form.append('description', String(description ?? ''));

  if (website) form.append('website', String(website));
  if (twitter) form.append('twitter', String(twitter));
  if (telegram) form.append('telegram', String(telegram));

  const res = await fetch('https://pump.fun/api/ipfs', {
    method: 'POST',
    body: form,
    headers: {
      // Some CDNs are picky; keep a normal UA.
      'user-agent': 'openclaw-local/1.0',
      'accept': 'application/json',
    },
  });

  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch {}

  if (!res.ok) {
    const msg = json?.message || json?.error?.message || json?.error || text || `HTTP ${res.status}`;
    const err = new Error(`pumpfun ipfs upload failed: HTTP ${res.status}: ${msg}`);
    err.status = res.status;
    err.body = json || text;
    throw err;
  }

  const tokenMetadata = json?.metadata ?? null;
  const metadataUri = typeof json?.metadataUri === 'string' ? json.metadataUri : null;
  const imageUri = typeof json?.imageUri === 'string' ? json.imageUri : null;

  if (!tokenMetadata || !metadataUri) {
    const err = new Error('pumpfun ipfs upload returned invalid payload (missing metadata/metadataUri)');
    err.body = json;
    throw err;
  }

  return { ok: true, metadataUri, imageUri, metadata: tokenMetadata, raw: json };
}
