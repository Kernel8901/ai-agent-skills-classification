// CLI: list agents (local Moltium API)
// Usage:
//   node tools/moltium/local/moltiumAPI/local_agents_cli.mjs

import { agentsAll } from './local_client.mjs';

const r = await agentsAll();
console.log(JSON.stringify({ ok: true, action: 'moltium_agents_all', ...r }, null, 2));
