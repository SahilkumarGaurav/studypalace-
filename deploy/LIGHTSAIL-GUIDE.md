# Deploying StudyPalace on Amazon Lightsail — step by step

Written for someone doing this for the first time. Copy-paste the commands.
Total time: **about 40 minutes**, most of it waiting.

**Ongoing cost:** ~$5–10/month for the instance + ~$0.50 for a static IP. Nothing else. Caddy gives you free HTTPS certificates automatically.

---

## What you need before you start

| Thing | Where to get it |
|---|---|
| An AWS account | aws.amazon.com — card required, but Lightsail is billed separately and cheaply |
| A domain name | Any registrar (GoDaddy, Namecheap, Hostinger, BigRock). e.g. `studypalace.in` |
| Your Razorpay keys | Razorpay Dashboard → Settings → **API Keys** |
| The project code on your laptop | The `studypalace/` folder from this workspace |

> No domain yet? You can still do steps 1–6 and test on the raw IP address. Add the domain later at step 7.

---

## Step 1 — Create the Lightsail instance

1. Go to **https://lightsail.aws.amazon.com**
2. Top-right: pick a region **close to your students** → `Mumbai (ap-south-1)`.
3. Click **Create instance**.
4. Choose:
   - **Platform:** Linux/Unix
   - **Blueprint:** OS Only → **Ubuntu 22.04 LTS** (or 24.04)
   - **SSH key pair:** download the default key it offers, e.g. `LightsailDefaultKey-ap-south-1.pem`. **Keep this file safe** — it's how you log in.
   - **Instance plan:**
     - **$5/mo (1 GB RAM, 40 GB SSD)** — fine to start. The setup script adds 2 GB of swap so the build won't fail.
     - **$10/mo (2 GB RAM)** — noticeably faster builds. Pick this if you can.
   - **Instance name:** `studypalace`
5. Click **Create instance**. Wait ~2 minutes until the status says **Running**.
6. Copy the **public IP** shown on the instance card (e.g. `3.109.12.44`).

### 1b. Make the IP permanent (important)

The public IP changes every time the instance restarts, which would break your domain and your HTTPS certificate.

1. Left menu → **Networking** → **Create static IP**.
2. Attach it to your `studypalace` instance → **Create**.
3. Copy the new static IP. **This is the IP you will use from now on.**

> A static IP costs ~$0.005/hour (~$3.60/mo) but is **free while attached to a running instance** — so as long as it's attached, you pay nothing extra.

### 1c. Open the firewall

1. Click your instance → **Networking** tab.
2. Under **Firewall**, make sure these three rules exist (add any that are missing):

| Application | Protocol | Port |
|---|---|---|
| SSH | TCP | 22 |
| HTTP | TCP | 80 |
| HTTPS | TCP | 443 |

> Ubuntu blueprints usually include all three already. **If 80/443 are missing your site will look "down" even though it's running.**

---

## Step 2 — Log in over SSH

**Mac / Linux** — open Terminal:

```bash
chmod 600 ~/Downloads/LightsailDefaultKey-ap-south-1.pem
ssh -i ~/Downloads/LightsailDefaultKey-ap-south-1.pem ubuntu@YOUR_STATIC_IP
```

**Windows** — use PowerShell (Windows 10/11 has SSH built in):

```powershell
ssh -i C:\Users\YOU\Downloads\LightsailDefaultKey-ap-south-1.pem ubuntu@YOUR_STATIC_IP
```

Or just click **Connect using SSH** in the Lightsail console — it opens a browser terminal, no key needed. That's the easiest route and everything below works there too.

Once you see `ubuntu@ip-172-26-x-x:~$` you're in.

---

## Step 3 — Get the code onto the server

Pick **one** of these.

### Option A — From GitHub (recommended, makes updates easy)

Push the `studypalace` folder to a **private** GitHub repo first (on your laptop):

```bash
cd studypalace
git init && git add -A && git commit -m "StudyPalace"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/studypalace.git
git push -u origin main
```

> ⚠️ Make the repo **private**. `.gitignore` already excludes `.env.local`, `data/` and `uploads/`, but private is still the right choice for a store.

Then on the server:

```bash
sudo mkdir -p /opt/studypalace
sudo chown ubuntu:ubuntu /opt/studypalace
git clone https://github.com/YOUR_USERNAME/studypalace.git /opt/studypalace
cd /opt/studypalace
```

### Option B — Upload from your laptop with `scp`

Run this **on your laptop**, not the server (from the folder *containing* `studypalace`):

```bash
scp -i ~/Downloads/LightsailDefaultKey-ap-south-1.pem \
    -r studypalace ubuntu@YOUR_STATIC_IP:/tmp/studypalace
```

Then **on the server**:

```bash
sudo mkdir -p /opt/studypalace
sudo cp -a /tmp/studypalace/. /opt/studypalace/
sudo chown -R ubuntu:ubuntu /opt/studypalace
cd /opt/studypalace
```

> Don't upload `node_modules` — if you have one, delete it first or add `--exclude node_modules` (use `rsync` instead of `scp`).

---

## Step 4 — Run the setup script (does everything)

```bash
cd /opt/studypalace
sudo -E bash deploy/setup-lightsail.sh
```

This one command installs Node.js 20, Caddy, PM2, build tools and sqlite3; adds 2 GB of swap; creates a locked-down `sp` system user; installs dependencies; builds the production app; configures the firewall; and starts the site.

**It takes 5–10 minutes** (mostly `npm install` and `next build`). Go make a chai. ☕

When it finishes you'll see a summary box with your URL. Test it in your browser:

```
http://YOUR_STATIC_IP/
```

You should see the StudyPalace home page. If you don't, jump to **Troubleshooting** at the bottom.

---

## Step 5 — Configure your keys and password 🔑

This is the step that actually makes it *your* store.

### 5a. Generate strong secrets

```bash
cd /opt/studypalace
npm run secret
```

It prints two lines. Copy them.

### 5b. Edit the config file

```bash
sudo nano /opt/studypalace/.env.local
```

Fill in **at least** these (paste the two generated lines from 5a):

```ini
# --- your store's public address (no trailing slash) ---
NEXT_PUBLIC_SITE_URL=http://YOUR_STATIC_IP        # change to https://yourdomain.com at Step 7

# --- admin login: ONLY you ---
ADMIN_EMAIL="you@yourdomain.com"
ADMIN_PASSWORD="Zephyr-3600-nebula"               # from npm run secret

# --- signs your session cookie + download links ---
APP_SECRET="5bec4a80ea468ccb5f50090a32e0b5..."    # from npm run secret

# --- Razorpay: Dashboard -> Settings -> API Keys ---
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxxxxxxxx"
RAZORPAY_WEBHOOK_SECRET=""                        # filled in at Step 8

# --- support details shown on the site ---
SUPPORT_EMAIL="you@yourdomain.com"
SUPPORT_WHATSAPP="919876543210"

# --- database + files: leave these as-is on Lightsail ---
DATABASE_URL=file:./data/studypalace.db
UPLOAD_DIR=./uploads
```

> ⚠️ **Always wrap values in double quotes if they contain `#`, `$` or spaces.** Next.js treats an unquoted `#` as a comment and silently truncates the value — this is the #1 reason people get "incorrect password" on a fresh deploy.

Save in nano: **Ctrl+O**, **Enter**, then **Ctrl+X**.

### 5c. Restart to pick up the config

```bash
cd /opt/studypalace
sudo -u sp pm2 restart studypalace --update-env
```

> `NEXT_PUBLIC_*` values are baked in at **build** time. If you change `NEXT_PUBLIC_SITE_URL`, rebuild: `sudo -u sp npm run build && sudo -u sp pm2 restart studypalace`.

### 5d. Log into your admin panel

```
http://YOUR_STATIC_IP/admin/login
```

Sign in with the email + password you just set. Then:

1. Go to **Settings** — you'll see a green/red checklist. Fix every red item.
2. Go to **Products → + Add a product**, upload a PDF, set a price, save.
3. Open the product page and do a **real ₹1 test purchase** with your Razorpay test keys to confirm downloads work.

---

## Step 6 — Set up automatic backups 💾

Your database and your PDFs live on this one disk. Back them up.

```bash
sudo bash /opt/studypalace/deploy/backup.sh --install-cron
```

That installs a daily 3:30 am backup into `/var/backups/studypalace/`, keeping the last 14.

**Also copy backups off the server.** From your laptop, once a week:

```bash
scp -i ~/Downloads/LightsailDefaultKey-ap-south-1.pem \
    ubuntu@YOUR_STATIC_IP:/var/backups/studypalace/studypalace-*.tar.gz \
    ~/studypalace-backups/
```

**And turn on Lightsail's own snapshots** (this is the one that saves you if the whole instance dies):

1. Instance → **Snapshots & backups** tab
2. Enable **Automatic snapshots** → daily, keep 7
3. Cost: ~$0.05/GB/month. For a PDF store this is pennies.

---

## Step 7 — Point your domain and switch on HTTPS 🔒

### 7a. Add the DNS record

At your domain registrar (or Cloudflare, which is free):

| Type | Name / Host | Value | TTL |
|---|---|---|---|
| `A` | `@` | `YOUR_STATIC_IP` | 300 |
| `A` | `www` | `YOUR_STATIC_IP` | 300 |

Wait for it to propagate — check with:

```bash
dig +short yourdomain.com
```

It should print your static IP. This can take 5 minutes to a few hours.

### 7b. Turn on HTTPS

Once DNS points at the server, re-run the setup script with your domain:

```bash
cd /opt/studypalace
sudo DOMAIN=yourdomain.com bash deploy/setup-lightsail.sh
```

Caddy will fetch a Let's Encrypt certificate for `yourdomain.com` **and** `www.yourdomain.com`, and renew it forever, automatically.

Then update the site URL and rebuild:

```bash
sudo nano /opt/studypalace/.env.local
#   NEXT_PUBLIC_SITE_URL="https://yourdomain.com"
sudo -u sp npm run build
sudo -u sp pm2 restart studypalace
```

Test **https://yourdomain.com** — you should see the padlock. 🔒

> HTTPS is not optional: Razorpay's live mode, Google rankings, and browser trust all require it.

---

## Step 8 — Add the Razorpay webhook (do this)

Without it, a student who closes the tab mid-payment can be left with an order stuck on "unpaid" even though they paid.

1. Razorpay Dashboard → **Webhooks** → **Add New Webhook**
2. URL: `https://yourdomain.com/api/razorpay/webhook`
3. Secret: click **Generate** and copy it
4. Events: tick **payment.captured**, **payment.failed**, **order.paid**
5. Save
6. Put the secret on the server:

```bash
sudo nano /opt/studypalace/.env.local
#   RAZORPAY_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxx"
sudo -u sp pm2 restart studypalace --update-env
```

7. Check it's registered — **Admin → Settings** should now show *"Webhook configured ✓"*.

Test it:

```bash
curl https://yourdomain.com/api/razorpay/webhook
# {"ok":true,...}   <- means the endpoint is alive
```

---

## Step 9 — Go live on Razorpay

1. Complete Razorpay **KYC** (otherwise live keys won't settle money to your bank).
2. Dashboard → Settings → API Keys → **Generate Live Key**.
3. Replace the test keys in `.env.local` with the live ones.
4. Restart: `sudo -u sp pm2 restart studypalace --update-env`
5. **Admin → Settings** must show `LIVE mode`. If it says *"You are serving the LIVE site with a Razorpay TEST key"*, you've mixed them up.
6. Make one real purchase of a cheap product, then refund yourself from the Razorpay dashboard to confirm settlement works.

---

## Step 10 — Submit to Google

1. Go to **https://search.google.com/search-console**
2. Add property → **Domain** → `yourdomain.com` (verify with a DNS TXT record)
3. **Sitemaps** → enter `sitemap.xml` → Submit
4. Use **URL Inspection** on `/`, `/shop` and each guide page → **Request indexing**

Your sitemap updates itself the moment you add a product — no re-submission needed.

---

## Updating the site later

### If you used GitHub (Option A)

```bash
cd /opt/studypalace
git pull
sudo -u sp npm install --no-audit --no-fund
sudo -u sp npm run build
sudo -u sp pm2 restart studypalace
```

### If you uploaded with scp (Option B)

From your **laptop**:

```bash
bash deploy/deploy.sh ubuntu@YOUR_STATIC_IP -i ~/Downloads/LightsailDefaultKey-ap-south-1.pem
```

It syncs the code (never touching `.env.local`, `data/` or `uploads/`), rebuilds and restarts. Downtime is 10–30 seconds.

---

## Everyday commands cheat sheet

```bash
# status
sudo -u sp pm2 status
sudo -u sp pm2 logs studypalace --lines 100

# restart / stop / start
sudo -u sp pm2 restart studypalace
sudo -u sp pm2 stop studypalace
sudo -u sp pm2 start studypalace

# web server
sudo systemctl status caddy
sudo systemctl restart caddy
sudo caddy validate --config /etc/caddy/Caddyfile

# disk space (PDFs add up)
df -h /
du -sh /opt/studypalace/uploads /opt/studypalace/data

# manual backup right now
sudo bash /opt/studypalace/deploy/backup.sh

# watch live traffic
sudo tail -f /var/log/caddy/studypalace.log
```

---

## Troubleshooting

**Site won't load at all (browser spins / "site can't be reached")**
→ Ports 80/443 aren't open. Lightsail console → instance → **Networking** → Firewall → add HTTP and HTTPS. This is the #1 cause.

**`502 Bad Gateway`**
→ Caddy is up but the app isn't. Run `sudo -u sp pm2 logs studypalace --lines 50`. Usually a bad `.env.local` value or a missing build.

**"Incorrect email or password" on /admin/login**
→ Your `ADMIN_PASSWORD` almost certainly contains an unquoted `#`. Edit `.env.local`, wrap the value in double quotes, then `sudo -u sp pm2 restart studypalace --update-env`.

**Build fails with "JavaScript heap out of memory" or gets killed**
→ Swap didn't get created. Run:
```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
free -h        # should show ~2G of Swap
```
Then rebuild.

**HTTPS shows a certificate error**
→ DNS isn't pointing here yet, or port 443 is closed. Check `dig +short yourdomain.com` returns your static IP, then `sudo journalctl -u caddy --no-pager | tail -30`.

**Payment succeeds but no download button**
→ The webhook isn't configured or the student closed the tab. Admin → Orders → open the order → **Mark as paid** (only after confirming in the Razorpay dashboard that the money was captured).

**Admin → Settings shows "Database is in-memory"**
→ `DATABASE_URL` is wrong or `/opt/studypalace/data` isn't writable. Fix:
```bash
sudo mkdir -p /opt/studypalace/data
sudo chown -R sp:sp /opt/studypalace/data /opt/studypalace/uploads
```
Then restart. **Don't add products until this is green** — in-memory data vanishes on restart.

**Uploads fail**
→ Same permission fix as above, plus check `df -h /` for a full disk.

**I locked myself out of the server**
→ Lightsail console → your instance → **Connect using SSH** (browser terminal, no key needed). From there you can reset anything.

---

## Cost summary

| Item | Cost |
|---|---|
| Lightsail 1 GB instance | $5/mo |
| Static IP (attached & running) | **$0** |
| Domain name | ~₹800/year |
| HTTPS certificate (Let's Encrypt via Caddy) | **$0** |
| Automatic snapshots | ~$0.10/mo for a small store |
| Razorpay per transaction | ~2% |
| **Total to run** | **≈ $5/month** |

---

## Pre-launch checklist

- [ ] `https://yourdomain.com` loads with a padlock
- [ ] `/admin/login` works and **only** with your credentials
- [ ] Admin → **Settings** shows an all-green checklist
- [ ] Razorpay says **LIVE mode**
- [ ] Webhook configured and tested
- [ ] At least one product live with a real PDF attached
- [ ] You completed a real test purchase and the PDF downloaded
- [ ] `/refund-policy` shows your no-return policy
- [ ] `SUPPORT_EMAIL` is an inbox you actually read
- [ ] Daily backup cron installed **and** snapshots enabled
- [ ] Sitemap submitted to Google Search Console
