import { randomBytes, scrypt, timingSafeEqual, createHash } from 'crypto';

export interface StoredPassword {
  passwordHash: string;
  salt?: string; // absent on legacy unsalted SHA-256 hashes
}

function scryptKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<StoredPassword> {
  const salt = randomBytes(16);
  const key = await scryptKey(password.trim(), salt);
  return { passwordHash: key.toString('hex'), salt: salt.toString('hex') };
}

export async function verifyPassword(stored: StoredPassword, password: string): Promise<boolean> {
  const expected = Buffer.from(stored.passwordHash, 'hex');
  let actual: Buffer;
  if (stored.salt) {
    actual = await scryptKey(password.trim(), Buffer.from(stored.salt, 'hex'));
  } else {
    // Legacy rooms created before salted hashing
    actual = createHash('sha256').update(password.trim()).digest();
  }
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
