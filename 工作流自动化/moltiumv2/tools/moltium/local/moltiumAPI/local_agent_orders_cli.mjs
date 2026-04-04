// CLI: fetch a single agent's orders (local Moltium API)
// Usage:
//   node tools/moltium/local/moltiumAPI/local_agent_orders_cli.mjs <walletAddress>

import { agentOrders } from './local_client.mjs';

const wallet = process.argv[2];
if (!wallet) {
  console.error('usage: local_agent_orders_cli.mjs <walletAddress>');
  process.exit(2);
}

const r = await agentOrders(wallet);
console.log(JSON.stringify({ ok: true, action: 'moltium_agent_orders', walletAddress: wallet, ...r }, null, 2));
