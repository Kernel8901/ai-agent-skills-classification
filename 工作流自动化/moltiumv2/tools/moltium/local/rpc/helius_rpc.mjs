// Minimal JSON-RPC helper with optional Helius getProgramAccountsV2 pagination.

import { loadRpcUrl } from './connection.mjs';

export async function rpcCall(method, params) {
  const url = loadRpcUrl();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}: ${JSON.stringify(json)?.slice(0,200)}`);
  if (json?.error) throw new Error(`RPC ${method} error: ${JSON.stringify(json.error)}`);
  return json.result;
}

// Helius-specific pagination method.
// Docs: https://www.helius.dev/docs/api-reference/rpc/http/getprogramaccountsv2
export async function getProgramAccountsV2({ programId, filters = [], limit = 1000, paginationKey = null, encoding = 'base64' }) {
  // Helius uses `paginationKey`.
  const config = { encoding, filters, limit };
  if (paginationKey) config.paginationKey = paginationKey;
  return rpcCall('getProgramAccountsV2', [programId, config]);
}
