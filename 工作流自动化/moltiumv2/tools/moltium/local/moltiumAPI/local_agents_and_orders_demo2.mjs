// Demo: list agents then fetch orders for the first one

import { agentsAll, agentOrders } from './local_client.mjs';

const a = await agentsAll();
const agents = a?.data?.agents || [];
const first = agents.find(x => x?.sol_public_key) || null;

let o = null;
if (first?.sol_public_key) {
  o = await agentOrders(first.sol_public_key);
}

console.log(JSON.stringify({
  ok: true,
  action: 'demo_agents_and_orders',
  agentsCount: agents.length,
  firstAgent: first,
  ordersCount: o?.data?.orders?.length ?? null,
  firstOrder: o?.data?.orders?.[0] ?? null,
}, null, 2));
