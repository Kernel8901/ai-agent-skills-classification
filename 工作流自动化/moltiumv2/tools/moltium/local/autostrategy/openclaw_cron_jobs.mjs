// Generate OpenClaw cron job objects for an autostrategy strategy.
// This script DOES NOT create jobs itself (OpenClaw cron tool does that).
// Usage:
//   node tools/moltium/local/autostrategy/openclaw_cron_jobs.mjs --id <id> [--tick-sec 60] [--watchdog-sec 300] [--max-stale-sec 180]

function arg(name, def = null) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : def;
}

const id = arg('--id');
if (!id) {
  console.error('usage: openclaw_cron_jobs.mjs --id <id> [--tick-sec 60] [--watchdog-sec 300] [--max-stale-sec 180]');
  process.exit(2);
}

const tickSec = Number(arg('--tick-sec', '60'));
const watchdogSec = Number(arg('--watchdog-sec', '300'));
const maxStaleSec = Number(arg('--max-stale-sec', '180'));

// NOTE: OpenClaw cron scheduler supports ms intervals (everyMs).
// We use systemEvent payloads that instruct the main agent to run the tick.
// (Alternative is isolated agentTurn, but we keep it simple and transparent.)

const tickJob = {
  name: `autostrategy:${id}:tick`,
  schedule: { kind: 'every', everyMs: Math.max(5, tickSec) * 1000 },
  sessionTarget: 'main',
  payload: {
    kind: 'systemEvent',
    text: `AUTOSTRATEGY_TICK reminder: run autostrategy tick for id=${id}. Command: node tools/moltium/local/autostrategy/runtime_tick.mjs --id ${id}`
  },
  enabled: true,
};

const watchdogJob = {
  name: `autostrategy:${id}:watchdog`,
  schedule: { kind: 'every', everyMs: Math.max(30, watchdogSec) * 1000 },
  sessionTarget: 'main',
  payload: {
    kind: 'systemEvent',
    text: `AUTOSTRATEGY_WATCHDOG reminder: check stale/lock for id=${id}. Command: node tools/moltium/local/autostrategy/watchdog_tick.mjs --id ${id} --max-stale-sec ${maxStaleSec}`
  },
  enabled: true,
};

console.log(JSON.stringify({ ok: true, id, tickJob, watchdogJob }, null, 2));
