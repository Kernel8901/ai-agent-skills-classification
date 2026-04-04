# Doctor / Init (zero-surprise setup)

MoltiumV2 aims to be "works out of the box" once secrets exist.

Two helper commands:

## Doctor

Checks:
- wallet file exists + pubkey readable
- SOL balance
- RPC candidates + selected endpoint
- fee recipient exists
- Moltium API key presence (optional)

Run:
```bash
node tools/moltium/local/ctl.mjs doctor
```

Human-friendly summary:
```bash
node tools/moltium/local/ctl.mjs doctor --pretty
```

It prints a single JSON object:
- `ok`: boolean
- `issues`: array of actionable items
- `warnings`: non-fatal issues (toolkit can still run, often via public fallback)
- `recommendations`: suggested next steps

Interpretation:
- If `ok=false`: fix fatal issues before trading.
- If `ok=true` but `warnings` exist: you can proceed, but reliability/safety may be reduced.

## Init

Creates **templates/stubs** under `.secrets/` (never overwrites existing files):
- `.secrets/rpc/config.json` (from template)
- `.secrets/rpc/*.txt` (from template)
- `.secrets/moltium-api-key.txt` stub (optional)

Run:
```bash
node tools/moltium/local/ctl.mjs init
```

Then edit the created files and re-run doctor.

## Notes

- `init` does **not** create or modify your Solana wallet file.
- You must supply `.secrets/moltium-wallet.json` yourself.

## Placeholder RPC URLs

After `init`, your `.secrets/rpc/*.txt` files contain placeholders like `REPLACE_ME`.

- This is expected.
- Doctor will warn with `rpc_placeholder_urls`.
- Fix by editing the `.txt` files to contain real HTTPS RPC URLs.
- If you do nothing, the toolkit can still fall back to the public RPC, but reliability may be worse.
