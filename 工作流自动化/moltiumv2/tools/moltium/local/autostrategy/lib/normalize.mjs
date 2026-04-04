export function pick(obj, paths) {
  for (const p of paths) {
    const parts = p.split('.');
    let cur = obj;
    let ok = true;
    for (const k of parts) {
      cur = cur?.[k];
      if (cur === undefined) { ok = false; break; }
    }
    if (ok && cur !== undefined && cur !== null) return cur;
  }
  return undefined;
}

export function toNum(v) {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}
