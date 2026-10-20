import fs from 'fs';
import path from 'path';
import { config } from './config';
import { addMedia, deleteMedia, listMedia, type MediaItem } from './repo';

/**
 * files.ts — where customer PDFs live and how they are served.
 *
 * Security model:
 *   • Uploads are written to UPLOAD_DIR (default ./uploads), which is
 *     deliberately OUTSIDE the public/ folder. Nothing there is reachable by
 *     guessing a URL.
 *   • A file is only ever streamed by /api/download/[token], which requires a
 *     paid order.
 *   • Original filenames are never used on disk (prevents path traversal and
 *     collisions); the friendly name is kept in the database.
 */

export const UPLOAD_ROOT = path.resolve(process.cwd(), config.storage.uploadDir);
const PDF_ROOT = path.join(UPLOAD_ROOT, 'pdf');
const COVER_ROOT = path.join(UPLOAD_ROOT, 'covers');
const PREVIEW_ROOT = path.join(UPLOAD_ROOT, 'previews');

export function ensureUploadDirs() {
  for (const dir of [UPLOAD_ROOT, PDF_ROOT, COVER_ROOT, PREVIEW_ROOT]) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (err) {
      console.error('[files] cannot create', dir, (err as Error).message);
    }
  }
}

export function writableFilesystem(): boolean {
  try {
    ensureUploadDirs();
    const probe = path.join(UPLOAD_ROOT, `.probe-${Date.now()}`);
    fs.writeFileSync(probe, 'ok');
    fs.unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}

const safeName = (name: string) =>
  (name || 'file')
    .replace(/[^\w.\- ()]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 90)
    .replace(/^[-.]+|[-.]+$/g, '') || 'file';

function extOf(filename: string, fallback: string) {
  const ext = path.extname(filename || '').toLowerCase();
  return ext || fallback;
}

export interface StoredFile {
  kind: 'pdf' | 'cover' | 'preview';
  filename: string; // friendly original name
  storedName: string; // name on disk
  path: string; // absolute path
  relativePath: string; // path relative to UPLOAD_ROOT, used for DB storage
  size: number;
  mime: string;
}

function dirFor(kind: StoredFile['kind']) {
  return kind === 'cover' ? COVER_ROOT : kind === 'preview' ? PREVIEW_ROOT : PDF_ROOT;
}

export async function saveUploadedFile(
  file: File,
  kind: StoredFile['kind'],
  prefix = '',
): Promise<StoredFile> {
  ensureUploadDirs();
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength > config.storage.maxUploadBytes) {
    throw new Error(
      `File is too large (${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB). Max is ${Math.round(
        config.storage.maxUploadBytes / 1024 / 1024,
      )} MB.`,
    );
  }
  const dir = dirFor(kind);
  const fallbackExt = kind === 'cover' ? '.png' : '.pdf';
  const storedName = `${prefix ? `${safeName(prefix)}-` : ''}${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}${extOf(file.name, fallbackExt)}`;
  const absolute = path.join(dir, storedName);
  fs.writeFileSync(absolute, buffer);

  const relativePath = path.relative(UPLOAD_ROOT, absolute).split(path.sep).join('/');
  const media = addMedia({
    kind,
    filename: file.name || storedName,
    path: relativePath,
    size: buffer.byteLength,
  });
  void media;

  return {
    kind,
    filename: file.name || storedName,
    storedName,
    path: absolute,
    relativePath,
    size: buffer.byteLength,
    mime: file.type || (kind === 'cover' ? 'image/png' : 'application/pdf'),
  };
}

/** Absolute path for a stored relative path, with traversal protection. */
export function resolveStored(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;
  const cleaned = relativePath.replace(/^[/\\]+/, '').replace(/\.\./g, '');
  const absolute = path.resolve(UPLOAD_ROOT, cleaned);
  if (!absolute.startsWith(path.resolve(UPLOAD_ROOT))) return null;
  return absolute;
}

export function readStoredFile(relativePath: string | null | undefined): Buffer | null {
  const absolute = resolveStored(relativePath);
  if (!absolute) return null;
  try {
    if (!fs.existsSync(absolute)) return null;
    return fs.readFileSync(absolute);
  } catch (err) {
    console.error('[files] read failed', relativePath, (err as Error).message);
    return null;
  }
}

export function deleteStoredFile(relativePath: string | null | undefined): boolean {
  const absolute = resolveStored(relativePath);
  if (!absolute) return false;
  try {
    if (fs.existsSync(absolute)) fs.unlinkSync(absolute);
    return true;
  } catch (err) {
    console.error('[files] delete failed', relativePath, (err as Error).message);
    return false;
  }
}

export function removeMedia(id: string): boolean {
  const item: MediaItem | null = deleteMedia(id);
  if (!item) return false;
  deleteStoredFile(item.path);
  return true;
}

export function mediaList(kind?: string) {
  return listMedia(kind);
}

export function fileExists(relativePath: string | null | undefined): boolean {
  const absolute = resolveStored(relativePath);
  return !!absolute && fs.existsSync(absolute);
}

/** Human file size */
export function humanSize(bytes?: number | null): string {
  const b = Number(bytes || 0);
  if (!b) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * If PUBLIC_ASSET_BASE_URL is set (S3 / Cloudinary / R2), files are served
 * straight from there. Otherwise they stream from the local disk.
 */
export function publicUrlFor(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;
  if (config.storage.publicAssetBase) {
    return `${config.storage.publicAssetBase}/${relativePath.replace(/^\/+/, '')}`;
  }
  return null;
}

export function diskUsage(): { files: number; bytes: number } {
  let files = 0;
  let bytes = 0;
  const walk = (dir: string) => {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else {
        files++;
        try {
          bytes += fs.statSync(full).size;
        } catch {
          /* ignore */
        }
      }
    }
  };
  walk(UPLOAD_ROOT);
  return { files, bytes };
}
