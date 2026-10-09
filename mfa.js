const crypto = require('node:crypto');

function encryptionKey() {
  const encoded = process.env.MFA_ENCRYPTION_KEY || '';
  const key = Buffer.from(encoded, 'base64');
  if (key.length !== 32) throw new Error('MFA_ENCRYPTION_KEY duhet të jetë çelës Base64 me 32 bajte.');
  return key;
}

function encryptSecret(secret) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map(part => part.toString('base64')).join('.');
}

function decryptSecret(value) {
  const [iv, tag, ciphertext] = String(value || '').split('.').map(part => Buffer.from(part, 'base64'));
  if (!iv || !tag || !ciphertext) throw new Error('Sekreti MFA nuk është i vlefshëm.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

function base32Encode(buffer) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0, value = 0, output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) { output += alphabet[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits) output += alphabet[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(input) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0, value = 0;
  const bytes = [];
  for (const char of String(input).toUpperCase().replace(/=+$/g, '').replace(/\s/g, '')) {
    const index = alphabet.indexOf(char);
    if (index < 0) throw new Error('Sekreti TOTP nuk është i vlefshëm.');
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) { bytes.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(bytes);
}

function codeFor(secret, counter) {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac('sha1', base32Decode(secret)).update(message).digest();
  const offset = digest[digest.length - 1] & 15;
  const binary = ((digest[offset] & 127) << 24) | ((digest[offset + 1] & 255) << 16) | ((digest[offset + 2] & 255) << 8) | (digest[offset + 3] & 255);
  return String(binary % 1000000).padStart(6, '0');
}

function matchingCounter(secret, submittedCode, now = Date.now(), lastCounter = -1) {
  const code = String(submittedCode || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(code)) return null;
  const current = Math.floor(now / 30000);
  for (const counter of [current - 1, current, current + 1]) {
    if (counter <= lastCounter) continue;
    const expected = Buffer.from(codeFor(secret, counter));
    const actual = Buffer.from(code);
    if (crypto.timingSafeEqual(expected, actual)) return counter;
  }
  return null;
}

function createSecret() { return base32Encode(crypto.randomBytes(20)); }
function recoveryCode() { const raw = crypto.randomBytes(8).toString('hex').toUpperCase(); return raw.match(/.{1,4}/g).join('-'); }
function hashRecoveryCode(code) { return crypto.createHash('sha256').update(String(code || '').replace(/-/g, '').toUpperCase()).digest('hex'); }
function recoveryCodeLooksValid(code) { return /^[a-f0-9]{16}$/i.test(String(code || '').replace(/-/g, '')); }

module.exports = { encryptSecret, decryptSecret, createSecret, matchingCounter, recoveryCode, hashRecoveryCode, recoveryCodeLooksValid };

