import { NextResponse } from 'next/server';
import { requireAdmin, readForm, str, fileOf } from '@/lib/api-helpers';
import { diskUsage, ensureUploadDirs, humanSize, removeMedia, saveUploadedFile, writableFilesystem } from '@/lib/files';
import { listMedia, logEvent } from '@/lib/repo';
import { dbInfo } from '@/lib/db';
import { config } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/admin/media — the uploaded-files library. */
export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const kind = new URL(req.url).searchParams.get('kind') || undefined;
  const usage = diskUsage();
  return NextResponse.json({
    ok: true,
    media: listMedia(kind),
    storage: {
      writable: writableFilesystem(),
      uploadDir: config.storage.uploadDir,
      files: usage.files,
      size: humanSize(usage.bytes),
      externalBase: config.storage.publicAssetBase || null,
      database: dbInfo().backend,
      persistent: dbInfo().persistent,
    },
  });
}

/** POST /api/admin/media — upload a loose file (handy for reusing one PDF). */
export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const form = await readForm(req);
  if (!form) return NextResponse.json({ error: 'Expected multipart/form-data.' }, { status: 400 });
  const file = fileOf(form, 'file');
  if (!file) return NextResponse.json({ error: 'No file was attached.' }, { status: 400 });

  const kindRaw = str(form, 'kind') || 'pdf';
  const kind = kindRaw === 'cover' ? 'cover' : kindRaw === 'preview' ? 'preview' : 'pdf';

  ensureUploadDirs();
  if (!writableFilesystem()) {
    return NextResponse.json(
      {
        error:
          'This host has no writable filesystem, so files cannot be stored here. Deploy on a VPS/Railway/Render, or set PUBLIC_ASSET_BASE_URL and paste file URLs instead of uploading.',
      },
      { status: 507 },
    );
  }

  try {
    const saved = await saveUploadedFile(file, kind, str(form, 'prefix'));
    logEvent('media.uploaded', undefined, undefined, `${saved.filename} (${humanSize(saved.size)})`);
    return NextResponse.json({ ok: true, file: { ...saved, humanSize: humanSize(saved.size) } });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Upload failed.' }, { status: 400 });
  }
}

/** DELETE /api/admin/media?id=… */
export async function DELETE(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const id = new URL(req.url).searchParams.get('id') || '';
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });
  const ok = removeMedia(id);
  return NextResponse.json({ ok, media: listMedia() });
}
