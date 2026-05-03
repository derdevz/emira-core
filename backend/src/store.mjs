import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const defaultStorageFile = path.resolve(currentDir, '../data/runtime-state.json');

function ensureParentDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export function resolveStorageFile() {
  if (process.env.DATA_FILE) {
    return process.env.DATA_FILE;
  }

  if (process.env.VERCEL) {
    return path.join('/tmp', 'emira-runtime-state.json');
  }

  return defaultStorageFile;
}

export function loadRuntimeState(fallbackState) {
  const filePath = resolveStorageFile();
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      ...fallbackState,
      ...parsed,
    };
  } catch {
    return fallbackState;
  }
}

export function saveRuntimeState(state) {
  const filePath = resolveStorageFile();
  ensureParentDirectory(filePath);
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
}
