# Math Slop 🧮

Generate satirical "ragebait" math formulas that connect famous constants (φ, π, e, i) in ways that look profound but are trivially true.

## Examples

- `φ^(ln e) = φ^(i⁴)` — just φ¹ = φ¹
- `e^(iπ) + 1 + γ = 0 + γ` — Euler's identity with γ added to both sides
- `τ - 2π = e^(iπ) + 1` — 0 = 0 dressed up
- `√2² = 2^(sin²x + cos²x)` — 2 = 2¹

## Usage

```bash
# Generate a formula (outputs LaTeX)
node scripts/generate-slop.js

# Generate multiple
node scripts/generate-slop.js --count 5
```

## How It Works

The generator creates formulas by:
- Adding zeros: `(φ-φ)`, `ln(1)`, `e^(iπ)+1`, `sin(0)`
- Multiplying by ones: `e^0`, `i⁴`, `sin²θ+cos²θ`, `ln(e)`
- Same operation both sides: `a/φ = b/φ`
- Connecting unrelated constants through trivial identities

## Rendering

Output is LaTeX. Render with any LaTeX tool:
- Online: latex.codecogs.com, quicklatex.com
- Local: pdflatex, mathjax, katex

## Installation

```bash
clawdhub install maths-rage-bate
```

## License

MIT
