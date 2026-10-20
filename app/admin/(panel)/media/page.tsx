import { diskUsage, humanSize, writableFilesystem } from '@/lib/files';
import { listMedia } from '@/lib/repo';
import { dbInfo } from '@/lib/db';
import { config } from '@/lib/config';
import MediaManager from '@/components/admin/MediaManager';

export const dynamic = 'force-dynamic';

export default function AdminMediaPage() {
  const usage = diskUsage();
  const db = dbInfo();
  return (
    <MediaManager
      media={listMedia() as never}
      storage={{
        writable: writableFilesystem(),
        uploadDir: config.storage.uploadDir,
        files: usage.files,
        size: humanSize(usage.bytes),
        externalBase: config.storage.publicAssetBase || null,
        database: db.backend,
        persistent: db.persistent,
      }}
    />
  );
}
