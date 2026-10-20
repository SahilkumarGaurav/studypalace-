# `deploy/` — server deployment files

Everything you need to run StudyPalace on a real server.

| File | What it does |
|---|---|
| **[LIGHTSAIL-GUIDE.md](./LIGHTSAIL-GUIDE.md)** | 👈 **Start here.** Full step-by-step Amazon Lightsail guide: instance setup, SSH, firewall, static IP, DNS, HTTPS, Razorpay webhook, backups, troubleshooting, cost breakdown. |
| `setup-lightsail.sh` | One-command server install. Node 20, Caddy (auto-HTTPS), PM2, swap, build, firewall, start. Safe to re-run. |
| `deploy.sh` | Ship an update from your laptop. Syncs code (never your data), rebuilds, restarts. |
| `backup.sh` | Backs up `data/` + `uploads/` + `.env.local` into one archive. `--install-cron` makes it daily. |
| `Caddyfile` | Reverse proxy config with automatic Let's Encrypt certificates. |
| `ecosystem.config.cjs` | PM2 process definition — auto-restart on crash, auto-start on reboot. |

## The 4-command version

```bash
# 1. on the server, after copying the project to /opt/studypalace
cd /opt/studypalace && sudo -E bash deploy/setup-lightsail.sh

# 2. put your keys in
sudo nano /opt/studypalace/.env.local      # then: sudo -u sp pm2 restart studypalace

# 3. daily backups
sudo bash deploy/backup.sh --install-cron

# 4. domain + HTTPS (after your A record points at the server)
cd /opt/studypalace && sudo DOMAIN=yourdomain.com bash deploy/setup-lightsail.sh
```

Then read the full guide for DNS, the Razorpay webhook, going live and Google Search Console.

## Works on any Ubuntu/Debian VPS

Nothing here is Lightsail-specific except the IP-lookup URL in the final message.
The same script works on **DigitalOcean, Hetzner, Vultr, Linode, AWS EC2, Hostinger VPS** —
any Ubuntu 22.04/24.04 or Debian 12 box.
