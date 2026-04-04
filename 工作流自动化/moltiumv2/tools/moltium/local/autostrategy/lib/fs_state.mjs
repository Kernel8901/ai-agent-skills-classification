import fs from 'node:fs';
import path from 'node:path';

export function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

export function readJsonIfExists(p, fallback = null) {
  if (!fs.existsSync(p)) return fallback;
  const txt = fs.readFileSync(p, 'utf8');
  return txt ? JSON.parse(txt) : fallback;
}

export function writeJsonAtomic(p, obj) {
  ensureDir(path.dirname(p));
  const tmp = p + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, p);
}

export function appendJsonl(p, obj) {
  ensureDir(path.dirname(p));
  fs.appendFileSync(p, JSON.stringify(obj) + '\n');
}

export function acquireLock(lockPath) {
  ensureDir(path.dirname(lockPath));
  try {
    const fd = fs.openSync(lockPath, 'wx');
    fs.writeFileSync(fd, String(process.pid));
    return () => {
      try { fs.closeSync(fd); } catch {}
      try { fs.unlinkSync(lockPath); } catch {}
    };
  } catch (e) {
    const err = new Error(`lock busy: ${lockPath}`);
    err.cause = e;
    throw err;
  }
}
