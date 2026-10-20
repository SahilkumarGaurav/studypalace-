/**
 * PM2 process file — keeps StudyPalace running, restarts it on crash,
 * and brings it back automatically after a server reboot.
 *
 * Start it with:  pm2 start deploy/ecosystem.config.cjs
 */
module.exports = {
  apps: [
    {
      name: 'studypalace',
      // `next start` serves the production build in .next/
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000 -H 127.0.0.1',
      cwd: '/opt/studypalace',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Everything else (keys, admin password, database path) is read from
        // /opt/studypalace/.env.local — Next.js loads it automatically.
      },
      error_file: '/var/log/studypalace/error.log',
      out_file: '/var/log/studypalace/out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
