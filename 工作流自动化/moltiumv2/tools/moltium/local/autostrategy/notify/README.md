# autostrategy notifications (MVP)

In MVP we log events to `tools/moltium/local/autostrategy/events/<id>.jsonl`.
A dispatcher can tail these and emit user notifications.

Next:
- add `dispatcher_tick.mjs` to read cursor state and print messages
- agent can use OpenClaw `message` tool to send them
