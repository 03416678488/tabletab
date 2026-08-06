import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from 'crypto';

/**
 * Symmetric field encryption for stored integration credentials (AES-256-GCM).
 *
 * Values are prefixed so encrypted and legacy-plain values coexist: `open()`
 * passes non-prefixed strings through unchanged, so existing connections keep
 * working and get sealed on their next reconnect.
 *
 * Key: `INTEGRATION_ENC_KEY` (preferred) or `JWT_SECRET`, hashed to 32 bytes.
 * Rotating the key makes existing ciphertexts unreadable — set a stable value.
 */
const PREFIX = 'enc:v1:';

const SENSITIVE_KEYS = new Set([
  'apiKey',
  'apiSecret',
  'webhookToken',
  'webhookSecret',
  'secretKey',
  'authToken',
  'menuApiKey',
]);

function key(): Buffer {
  const raw = process.env.INTEGRATION_ENC_KEY || process.env.JWT_SECRET || 'insecure-dev-key';
  return createHash('sha256').update(raw).digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return (
    PREFIX +
    [iv.toString('base64'), tag.toString('base64'), ciphertext.toString('base64')].join(':')
  );
}

/** Decrypt a sealed value; a non-prefixed (legacy-plain) value passes through. */
export function decryptSecret(value: string): string {
  if (!value.startsWith(PREFIX)) return value;
  const [ivB, tagB, ctB] = value.slice(PREFIX.length).split(':');
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(ivB, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(ctB, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

/**
 * Constant-time string equality for secrets/tokens. Compares fixed-length
 * SHA-256 digests so neither the timing nor the length of a mismatch leaks.
 */
export function constantTimeEqual(a: string | undefined | null, b: string | undefined | null): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Encrypt the sensitive keys of a config object for storage. */
export function sealConfig(
  config: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!config) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config)) {
    out[k] = SENSITIVE_KEYS.has(k) && typeof v === 'string' ? encryptSecret(v) : v;
  }
  return out;
}

/** Decrypt the sensitive keys of a stored config object for use. */
export function openConfig(
  config: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!config) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config)) {
    if (SENSITIVE_KEYS.has(k) && typeof v === 'string') {
      try {
        out[k] = decryptSecret(v);
      } catch {
        out[k] = ''; // undecryptable → treat as missing rather than leak ciphertext
      }
    } else {
      out[k] = v;
    }
  }
  return out;
}
