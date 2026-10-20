#!/usr/bin/env bash
# ============================================================================
#  StudyPalace — Amazon Lightsail one-command server setup
# ============================================================================
#  Run this ON THE SERVER, as root (or with sudo), from inside the project:
#
#      sudo bash deploy/setup-lightsail.sh
#
#  It installs Node.js 20, Caddy (automatic HTTPS), PM2, a 2 GB swap file
#  (so `next build` doesn't get killed on a 1 GB instance), creates the app
#  directory, installs dependencies, builds the app and starts it.
#
#  It is safe to re-run — it skips anything already done.
#  It does NOT touch your .env.local, your database or your uploaded PDFs.
# ============================================================================
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/studypalace}"
APP_USER="${APP_USER:-sp}"
NODE_MAJOR=20
DOMAIN="${DOMAIN:-}"          # optional: DOMAIN=studypalace.in sudo -E bash deploy/setup-lightsail.sh

log()  { printf '\n\033[1;35m==> %s\033[0m\n' "$1"; }
ok()   { printf '  \033[1;32m✓\033[0m %s\n' "$1"; }
warn() { printf '  \033[1;33m!\033[0m %s\n' "$1"; }
die()  { printf '\n\033[1;31m✗ %s\033[0m\n\n' "$1" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Run this as root:  sudo bash deploy/setup-lightsail.sh"

# ---------------------------------------------------------------------------
log "1/9  Updating package lists"
# ---------------------------------------------------------------------------
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl gnupg git build-essential python3 ufw rsync sqlite3 unzip
ok "base packages installed"

# ---------------------------------------------------------------------------
log "2/9  Adding 2 GB of swap (prevents the build being killed on 1 GB RAM)"
# ---------------------------------------------------------------------------
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  # Keep swap for emergencies only; prefer real RAM for speed.
  echo 'vm.swappiness=10' > /etc/sysctl.d/99-swap.conf
  sysctl --system >/dev/null
  ok "swap enabled: $(free -h | awk '/^Swap:/{print $2}')"
else
  ok "swap already present: $(free -h | awk '/^Swap:/{print $2}')"
fi

# ---------------------------------------------------------------------------
log "3/9  Installing Node.js ${NODE_MAJOR}.x"
# ---------------------------------------------------------------------------
CURRENT_NODE="$(node -v 2>/dev/null || echo none)"
if [[ "$CURRENT_NODE" == v${NODE_MAJOR}.* ]]; then
  ok "Node ${CURRENT_NODE} already installed"
else
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
  ok "Node $(node -v), npm $(npm -v)"
fi

# ---------------------------------------------------------------------------
log "4/9  Installing Caddy (automatic HTTPS)"
# ---------------------------------------------------------------------------
if command -v caddy >/dev/null 2>&1; then
  ok "Caddy already installed ($(caddy version | head -1))"
else
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https lsb-release
  curl -fsSL 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -fsSL 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    > /etc/apt/sources.list.d/caddy-stable.list
  sed -i 's|^deb |deb [signed-by=/usr/share/keyrings/caddy-stable-archive-keyring.gpg] |' \
    /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
  ok "Caddy installed"
fi
mkdir -p /var/log/caddy

# ---------------------------------------------------------------------------
log "5/9  Installing PM2 (keeps the app alive + starts it on boot)"
# ---------------------------------------------------------------------------
if command -v pm2 >/dev/null 2>&1; then
  ok "PM2 already installed"
else
  npm install -g pm2
  ok "PM2 installed"
fi

# ---------------------------------------------------------------------------
log "6/9  Creating the app user and directories"
# ---------------------------------------------------------------------------
if ! id -u "$APP_USER" >/dev/null 2>&1; then
  # A real home directory is required: PM2 stores its process list in ~/.pm2 and
  # `pm2 startup` needs a valid --hp path to restore the app after a reboot.
  useradd --system --home "/home/$APP_USER" --create-home --shell /usr/sbin/nologin "$APP_USER"
fi
mkdir -p "$APP_DIR" "$APP_DIR/data" "$APP_DIR/uploads" /var/log/studypalace "/home/$APP_USER/.pm2"
chown -R "$APP_USER":"$APP_USER" "/home/$APP_USER"
ok "user '$APP_USER' + $APP_DIR ready"

# ---------------------------------------------------------------------------
log "7/9  Copying the project into $APP_DIR"
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [ "$PROJECT_DIR" != "$APP_DIR" ]; then
  # Copy everything except the things that must not be overwritten.
  rsync -a --delete \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.git' \
    --exclude 'data' \
    --exclude 'uploads' \
    --exclude '.env.local' \
    "$PROJECT_DIR"/ "$APP_DIR"/
  ok "project files copied"
else
  ok "already running from $APP_DIR"
fi

# Preserve an existing .env.local across redeploys
if [ ! -f "$APP_DIR/.env.local" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env.local"
  warn "created $APP_DIR/.env.local from the template — YOU MUST EDIT IT (step 8 below)"
fi

chown -R "$APP_USER":"$APP_USER" "$APP_DIR" /var/log/studypalace

# ---------------------------------------------------------------------------
log "8/9  Installing dependencies and building"
# ---------------------------------------------------------------------------
cd "$APP_DIR"
sudo -u "$APP_USER" npm ci --omit=dev=false --no-audit --no-fund \
  || sudo -u "$APP_USER" npm install --no-audit --no-fund
ok "dependencies installed"

sudo -u "$APP_USER" npm run build
ok "production build complete"

# ---------------------------------------------------------------------------
log "9/9  Firewall, Caddy config and starting the app"
# ---------------------------------------------------------------------------
# UFW: allow SSH + web only. (Also open 80/443 in the Lightsail console!)
ufw allow OpenSSH  >/dev/null 2>&1 || ufw allow 22/tcp
ufw allow 80/tcp   >/dev/null
ufw allow 443/tcp  >/dev/null
ufw --force enable >/dev/null
ok "ufw: SSH, HTTP, HTTPS open"

if [ -n "$DOMAIN" ]; then
  sed "s/studypalace\.in, www\.studypalace\.in/${DOMAIN}, www.${DOMAIN}/" \
    "$APP_DIR/deploy/Caddyfile" > /etc/caddy/Caddyfile
  ok "Caddy configured for ${DOMAIN}"
else
  # No domain supplied yet: serve plain HTTP on :80 so you can test by IP.
  cat > /etc/caddy/Caddyfile <<'EOF'
:80 {
	reverse_proxy 127.0.0.1:3000
	encode gzip
}
EOF
  warn "no DOMAIN given — Caddy is serving plain HTTP on port 80 for testing."
  warn "Re-run with:  DOMAIN=yourdomain.com sudo -E bash deploy/setup-lightsail.sh"
fi

caddy validate --config /etc/caddy/Caddyfile >/dev/null 2>&1 || die "Caddyfile is invalid"
systemctl enable caddy >/dev/null 2>&1 || true
systemctl restart caddy
ok "Caddy running"

cd "$APP_DIR"
sudo -u "$APP_USER" pm2 delete studypalace >/dev/null 2>&1 || true
sudo -u "$APP_USER" pm2 start deploy/ecosystem.config.cjs
sudo -u "$APP_USER" pm2 save >/dev/null

# Make PM2 (and therefore the shop) come back automatically after a reboot.
pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" > /tmp/pm2-startup.sh 2>/dev/null || true
if [ -s /tmp/pm2-startup.sh ]; then
  bash /tmp/pm2-startup.sh >/dev/null 2>&1 || true
  sudo -u "$APP_USER" pm2 save >/dev/null || true
fi
ok "app started with PM2 (and will restart on boot)"

sleep 4
if curl -fsS -o /dev/null http://127.0.0.1:3000/; then
  ok "Next.js is responding on 127.0.0.1:3000"
else
  warn "Next.js did not answer yet — check:  pm2 logs studypalace"
fi

IP="$(curl -fsS --max-time 5 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'YOUR_SERVER_IP')"

cat <<EOF


============================================================
  StudyPalace is installed.
============================================================

  Test it now        http://${IP}/
  Admin panel        http://${IP}/admin/login

  App directory      ${APP_DIR}
  Config file        ${APP_DIR}/.env.local      <-- EDIT THIS NEXT
  Database           ${APP_DIR}/data/
  Your PDFs          ${APP_DIR}/uploads/
  Logs               pm2 logs studypalace

  NEXT STEPS
  1. Edit the config:   sudo nano ${APP_DIR}/.env.local
     Set ADMIN_EMAIL, ADMIN_PASSWORD, APP_SECRET and your Razorpay keys.
     Generate secrets with:  cd ${APP_DIR} && npm run secret
  2. Restart:           cd ${APP_DIR} && sudo -u ${APP_USER} pm2 restart studypalace
  3. Point your domain's A record at ${IP}
  4. Enable HTTPS:      DOMAIN=yourdomain.com sudo -E bash ${APP_DIR}/deploy/setup-lightsail.sh

  Also open ports 80 and 443 in the Lightsail console:
     Instance -> Networking -> Firewall
============================================================

EOF
