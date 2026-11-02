// Generates a VAPID key pair for Web Push.
//
//   node scripts/generate-vapid-keys.mjs
//
// Outputs two things:
//   1. VAPID_KEYS         — JWK pair, set as a Supabase Edge Function secret.
//                           This is the private half. Never commit it.
//   2. applicationServerKey — base64url public key for the browser, goes in
//                           .env as VITE_VAPID_PUBLIC_KEY (and in Vercel).
//
// The JWK shape is what jsr:@negrel/webpush's importVapidKeys() expects.

import { webcrypto as crypto } from 'node:crypto'

function b64urlToBytes(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(Buffer.from(b64, 'base64'))
}

function bytesToB64url(bytes) {
  return Buffer.from(bytes).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const pair = await crypto.subtle.generateKey(
  { name: 'ECDSA', namedCurve: 'P-256' },
  true,
  ['sign', 'verify']
)

const privateKey = await crypto.subtle.exportKey('jwk', pair.privateKey)
const publicKey = await crypto.subtle.exportKey('jwk', pair.publicKey)

// The browser wants the raw uncompressed EC point: 0x04 || X || Y.
const x = b64urlToBytes(publicKey.x)
const y = b64urlToBytes(publicKey.y)
const raw = new Uint8Array(65)
raw[0] = 4
raw.set(x, 1)
raw.set(y, 33)
const applicationServerKey = bytesToB64url(raw)

console.log('\n── 1. Supabase Edge Function secret ──────────────────────────')
console.log('Set this as VAPID_KEYS (keep it secret, do not commit):\n')
console.log(JSON.stringify({ privateKey, publicKey }))

console.log('\n── 2. Client key ─────────────────────────────────────────────')
console.log('Add to .env and to the Vercel environment:\n')
console.log(`VITE_VAPID_PUBLIC_KEY=${applicationServerKey}`)
console.log('')
