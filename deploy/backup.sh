#!/usr/bin/env bash
# ============================================================================
#  StudyPalace — backup the two things you cannot afford to lose
# ============================================================================
#     data/     -> your database (products, orders, customers)
#     uploads/  -> the PDFs you are selling
#     .env.local-> your keys (without it you cannot rebuild the same store)
#
#  Run manually:      sudo bash deploy/backup.sh
#  Install as a daily 3:30 am cron job:
#      sudo bash deploy/backup.sh --install-cron
#
#  Backups are written to /var/backups/studypalace and the last 14 are kept.
#  COPY THEM OFF THE SERVER too (see the guide) — a backup on the same disk
#  does not save you if the instance dies.
# ============================================================================
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/studypalace}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/studypalace}"
KEEP=14

if [ "${1:-}" = "--install-cron" ]; then
  [ "$(id -u)" -eq 0 ] || { echo "Run with sudo"; exit 1; }
  SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
  CRON_LINE="30 3 * * * root /usr/bin/env bash $SCRIPT >> /var/log/studypalace-backup.log 2>&1"
  echo "$CRON_LINE" > /etc/cron.d/studypalace-backup
  chmod 644 /etc/cron.d/studypalace-backup
  echo "✓ Daily 03:30 backup installed -> /etc/cron.d/studypalace-backup"
  echo "  Logs: /var/log/studypalace-backup.log"
  exit 0
fi

[ "$(id -u)" -eq 0 ] || { echo "Run with sudo:  sudo bash deploy/backup.sh"; exit 1; }
[ -d "$APP_DIR" ] || { echo "App directory $APP_DIR not found"; exit 1; }

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/studypalace-$STAMP.tar.gz"

# Build the archive in a staging folder so we can include a crash-consistent
# database snapshot instead of copying a live WAL file.
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
STAGE="$TMP/payload"
mkdir -p "$STAGE"

# 1. database
if [ -d "$APP_DIR/data" ]; then
  mkdir -p "$STAGE/data"
  if command -v sqlite3 >/dev/null 2>&1 && [ -f "$APP_DIR/data/studypalace.db" ]; then
    sqlite3 "$APP_DIR/data/studypalace.db" ".backup '$STAGE/data/studypalace.db'"
    echo "  · database: consistent snapshot via sqlite3 .backup"
  else
    cp -a "$APP_DIR/data/." "$STAGE/data/"
    echo "  · database: file copy (install sqlite3 for crash-safe snapshots)"
  fi
fi

# 2. the PDFs you sell
if [ -d "$APP_DIR/uploads" ]; then
  cp -a "$APP_DIR/uploads" "$STAGE/uploads"
  echo "  · uploads: $(find "$STAGE/uploads" -type f | wc -l) file(s)"
fi

# 3. config (so a restore brings the same keys back)
[ -f "$APP_DIR/.env.local" ] && cp "$APP_DIR/.env.local" "$STAGE/env.local"

# 4. a restore script inside the archive
cat > "$STAGE/RESTORE.txt" <<'RESTORE'
To restore StudyPalace from this backup:

  1. Install the app again:  sudo bash deploy/setup-lightsail.sh
  2. Stop it:                sudo -u sp pm2 stop studypalace
  3. Extract this archive:   tar -xzf studypalace-BACKUP.tar.gz -C /tmp/restore
  4. Copy the files back:
       sudo cp -a /tmp/restore/data/.    /opt/studypalace/data/
       sudo cp -a /tmp/restore/uploads   /opt/studypalace/uploads
       sudo cp    /tmp/restore/env.local /opt/studypalace/.env.local
       sudo chown -R sp:sp /opt/studypalace
  5. Start it:               sudo -u sp pm2 start studypalace
RESTORE

tar -czf "$OUT" -C "$STAGE" .
chmod 600 "$OUT"

SIZE="$(du -h "$OUT" | cut -f1)"
echo "✓ Backup created: $OUT ($SIZE)"

# keep only the newest $KEEP
ls -1t "$BACKUP_DIR"/studypalace-*.tar.gz 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f
echo "  · keeping the last $KEEP backups in $BACKUP_DIR"

cat <<'EOF'

  ⚠ Now copy it OFF this server. From your own laptop:

     scp -i ~/LightsailDefaultKey.pem \
       ubuntu@YOUR_SERVER_IP:/var/backups/studypalace/studypalace-*.tar.gz \
       ~/studypalace-backups/

  Or install the AWS CLI on the server and sync to an S3 bucket.
EOF
