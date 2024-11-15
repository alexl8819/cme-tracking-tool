import { Buffer } from '@craftzdog/react-native-buffer';
import { getRandomValues } from 'expo-crypto';
import { sha256 } from '@noble/hashes/sha2';
import { pbkdf2Async } from '@noble/hashes/pbkdf2';
import { gcm } from '@noble/ciphers/aes';
import { utf8ToBytes } from '@noble/ciphers/utils';

export async function deriveEncryptionKey (plaintext: string, salt: string | Uint8Array = _randomBytes(16), keyLength: number = 32) {
  if (typeof salt === 'string') {
    salt = toBytes(salt);
  }

  const key = await pbkdf2Async(sha256, plaintext, salt, {
    c: 50000, // 100000, // TODO: adjust, might need to reduce
    dkLen: keyLength
  });

  return {
    key,
    salt
  };
}

export function encryptAes (data, key = _randomBytes(32), encoding = 'utf8'): Uint8array {
  const nonce = _randomBytes(24);
  console.log(`nonce(encrypt): ${toHexValue(nonce)}`);
  const d = toBytes(data, encoding);
  console.log(`data len (encrypt): ${d.length}`);
  const aes = gcm(key, nonce);
  const ciphertext = aes.encrypt(d);
  console.log(`ciphertext len: ${ciphertext.length}`);
  return toHexValue(nonce) + toHexValue(ciphertext);
}

export function decryptAes (ciphertext, key: Uint8Array): string {
  const nonce = ciphertext.slice(0, 48); // first 48 bytes are nonce
  console.log(`nonce (decrypt): ${nonce}`);
  const aes = gcm(key, toBytes(nonce));
  console.log(`ciphertext len: ${ciphertext.slice(48).length}`);
  const data = toBytes(ciphertext.slice(48));
  console.log(`data len: ${data.length}`);
  return aes.decrypt(data);
}

export function hash (data: string): string {
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(data);
  const digest = sha256.create().update(encodedData).digest();
  return toHexValue(digest);
}

export function toHexValue (bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// TODO: may not need utf8ToBytes and just use Buffer.from(data, encoding)
export function toBytes (str: string, encoding = 'hex'): Uint8Array {
  return encoding === 'utf8' ? utf8ToBytes(str) : new Uint8Array(Buffer.from(str, encoding));
}

function _randomBytes (size: number): Uint8Array {
  const bytes = new Uint8Array(size);
  getRandomValues(bytes);
  return bytes;
}
