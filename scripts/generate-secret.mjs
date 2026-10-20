#!/usr/bin/env node
/**
 * scripts/generate-secret.mjs
 * Prints a strong APP_SECRET and a suggested ADMIN_PASSWORD.
 * Run:  npm run secret
 */
import { randomBytes, randomInt } from 'node:crypto';

const secret = randomBytes(32).toString('hex');

// A readable-but-strong password. Avoids `#` because an unquoted `#` in a .env
// file is treated as the start of a comment by Next.js and silently truncates
// the value. If you do use one, wrap the value in double quotes.
const WORDS = ['Palace', 'Nebula', 'Saffron', 'Monsoon', 'Indigo', 'Lotus', 'Vertex', 'Kaveri', 'Zephyr', 'Basalt'];
const w1 = WORDS[randomInt(WORDS.length)];
const w2 = WORDS[randomInt(WORDS.length)];
const password = `${w1}-${randomInt(1000, 9999)}-${w2.toLowerCase()}`;

console.log(`
Copy these two lines into your .env.local (or your host's environment variables):

APP_SECRET="${secret}"
ADMIN_PASSWORD="${password}"

Then restart the app.
`);
