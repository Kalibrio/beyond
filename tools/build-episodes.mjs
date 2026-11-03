// Encrypts private/episodes.src.json into docs/episodes.html (AES-256-GCM, PBKDF2-SHA256).
// Usage: BEYOND_PW=... node tools/build-episodes.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';
const pw = process.env.BEYOND_PW; if (!pw) { console.error('Set BEYOND_PW'); process.exit(1); }
const tpl = readFileSync('private/episodes.template.html', 'utf8');
const data = readFileSync('private/episodes.src.json', 'utf8'); JSON.parse(data);
const iter = 600000, salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(data)));
const b64 = u => Buffer.from(u).toString('base64');
const out = tpl.replace('/*__PAYLOAD__*/null', JSON.stringify({ iter, salt: b64(salt), iv: b64(iv), ct: b64(ct) }));
if (out === tpl) throw new Error('payload marker missing');
writeFileSync('docs/episodes.html', out);
console.log('docs/episodes.html written,', ct.length, 'bytes encrypted');
