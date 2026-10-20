#!/usr/bin/env bash
# ============================================================================
#  StudyPalace — ship an update to the Lightsail server
# ============================================================================
#  Run this FROM YOUR LAPTOP, inside the project folder:
#
#      bash deploy/deploy.sh ubuntu@1.2.3.4 -i ~/LightsailDefaultKey.pem
#
#  It copies your code (never your .env.local, database or uploads),
#  installs dependencies, rebuilds and restarts the app with zero manual steps.
#  Downtime is usually 10–30 seconds.
# ============================================================================
set -Eeuo pipefail

TARGET="${1:-}"
SSH_OPTS="${2:-}"
APP_DIR="${APP_DIR:-/opt/studypalace}"
APP_USER="${APP_USER:-sp}"

if [ -z "$TARGET" ]; then
  cat <<'EOF'
Usage:
  bash deploy/deploy.sh ubuntu@YOUR_SERVER_IP [-i /path/to/key.pem]

Examples:
  bash deploy/deploy.sh ubuntu@3.109.12.44 -i ~/LightsailDefaultKey-us-east-1.pem
  bash deploy/deploy.sh ubuntu@studypalace.in
EOF
  exit 1
fi

SSH="ssh ${SSH_OPTS} ${TARGET}"

echo "==> Checking the server is reachable"
$SSH 'echo connected: $(hostname)'

echo "==> Syncing code (skipping .env.local, data/, uploads/, node_modules, .next)"
rsync -az --delete \
  -e "ssh ${SSH_OPTS}" \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude 'data' \
  --exclude 'uploads' \
  --exclude '.env.local' \
  --exclude '.env*.local' \
  ./ "${TARGET}:${APP_DIR}/"

echo "==> Installing dependencies and rebuilding"
$SSH "sudo chown -R ${APP_USER}:${APP_USER} ${APP_DIR}"
$SSH "cd ${APP_DIR} && sudo -u ${APP_USER} npm install --no-audit --no-fund"
$SSH "cd ${APP_DIR} && sudo -u ${APP_USER} npm run build"

echo "==> Restarting"
$SSH "cd ${APP_DIR} && sudo -u ${APP_USER} pm2 restart studypalace --update-env"

sleep 3
echo "==> Health check"
$SSH "curl -fsS -o /dev/null -w 'home page: HTTP %{http_code}\n' http://127.0.0.1:3000/" || \
  echo "⚠ The app did not answer. Run:  ssh ${TARGET} 'pm2 logs studypalace --lines 50'"

echo
echo "✓ Deployed."
echo "  Visit your site and check /admin/login still works."
