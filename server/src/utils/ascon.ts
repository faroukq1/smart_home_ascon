// ASCON v1.2 — pure TypeScript, no dependencies
// ASCON-128: key=128bit, nonce=128bit, rate=64bit, a=12, b=6
// ASCON-HASH: output=256bit, rate=64bit, a=b=12

const MASK64 = (1n << 64n) - 1n;

const RC = [
  0xf0n, 0xe1n, 0xd2n, 0xc3n, 0xb4n, 0xa5n,
  0x96n, 0x87n, 0x78n, 0x69n, 0x5an, 0x4bn,
];

function rot(x: bigint, n: number): bigint {
  return ((x >> BigInt(n)) | (x << BigInt(64 - n))) & MASK64;
}

function permute(S: bigint[], rounds: number): void {
  for (let r = 12 - rounds; r < 12; r++) {
    S[2] ^= RC[r];
    // S-box
    S[0] ^= S[4]; S[4] ^= S[3]; S[2] ^= S[1];
    const t = S.slice();
    S[0] = (t[0] ^ ((MASK64 ^ t[1]) & t[2])) & MASK64;
    S[1] = (t[1] ^ ((MASK64 ^ t[2]) & t[3])) & MASK64;
    S[2] = (t[2] ^ ((MASK64 ^ t[3]) & t[4])) & MASK64;
    S[3] = (t[3] ^ ((MASK64 ^ t[4]) & t[0])) & MASK64;
    S[4] = (t[4] ^ ((MASK64 ^ t[0]) & t[1])) & MASK64;
    S[1] ^= S[0]; S[0] ^= S[4]; S[3] ^= S[2];
    S[2] = (MASK64 ^ S[2]) & MASK64;
    // Linear diffusion
    S[0] ^= rot(S[0], 19) ^ rot(S[0], 28);
    S[1] ^= rot(S[1], 61) ^ rot(S[1], 39);
    S[2] ^= rot(S[2], 1)  ^ rot(S[2], 6);
    S[3] ^= rot(S[3], 10) ^ rot(S[3], 17);
    S[4] ^= rot(S[4], 7)  ^ rot(S[4], 41);
    for (let i = 0; i < 5; i++) S[i] &= MASK64;
  }
}

function load64(b: Uint8Array, off = 0): bigint {
  let v = 0n;
  for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(b[off + i] ?? 0);
  return v;
}

function store64(v: bigint): Uint8Array {
  const b = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) { b[i] = Number(v & 0xffn); v >>= 8n; }
  return b;
}

function padMsg(m: Uint8Array, rate: number): Uint8Array {
  const pl = rate - (m.length % rate);
  const out = new Uint8Array(m.length + pl);
  out.set(m); out[m.length] = 0x80;
  return out;
}

const ASCON128_IV = 0x80400c0600000000n;
const ASCONHASH_IV = 0x00400c0000000100n;

export const DEFAULT_KEY_HEX = "00112233445566778899aabbccddeeff";

export function encrypt128(
  key: Uint8Array,
  nonce: Uint8Array,
  pt: Uint8Array,
  ad: Uint8Array = new Uint8Array()
): { ct: Uint8Array; tag: Uint8Array } {
  const k0 = load64(key, 0), k1 = load64(key, 8);
  const n0 = load64(nonce, 0), n1 = load64(nonce, 8);
  const S = [ASCON128_IV, k0, k1, n0, n1];
  permute(S, 12);
  S[3] = (S[3] ^ k0) & MASK64; S[4] = (S[4] ^ k1) & MASK64;

  if (ad.length) {
    const adp = padMsg(ad, 8);
    for (let i = 0; i < adp.length; i += 8) {
      S[0] = (S[0] ^ load64(adp, i)) & MASK64; permute(S, 6);
    }
  }
  S[4] ^= 1n;

  const ptp = padMsg(pt, 8);
  const ctFull = new Uint8Array(ptp.length);
  for (let i = 0; i < ptp.length; i += 8) {
    S[0] = (S[0] ^ load64(ptp, i)) & MASK64;
    ctFull.set(store64(S[0]), i);
    if (i + 8 < ptp.length) permute(S, 6);
  }

  S[1] = (S[1] ^ k0) & MASK64; S[2] = (S[2] ^ k1) & MASK64;
  permute(S, 12);
  S[3] = (S[3] ^ k0) & MASK64; S[4] = (S[4] ^ k1) & MASK64;
  const tag = new Uint8Array(16);
  tag.set(store64(S[3]), 0); tag.set(store64(S[4]), 8);
  return { ct: ctFull.slice(0, pt.length), tag };
}

export function decrypt128(
  key: Uint8Array,
  nonce: Uint8Array,
  ct: Uint8Array,
  tag: Uint8Array,
  ad: Uint8Array = new Uint8Array()
): Uint8Array | null {
  const k0 = load64(key, 0), k1 = load64(key, 8);
  const n0 = load64(nonce, 0), n1 = load64(nonce, 8);
  const S = [ASCON128_IV, k0, k1, n0, n1];
  permute(S, 12);
  S[3] = (S[3] ^ k0) & MASK64; S[4] = (S[4] ^ k1) & MASK64;

  if (ad.length) {
    const adp = padMsg(ad, 8);
    for (let i = 0; i < adp.length; i += 8) {
      S[0] = (S[0] ^ load64(adp, i)) & MASK64; permute(S, 6);
    }
  }
  S[4] ^= 1n;

  const ctLen = ct.length;
  const pt = new Uint8Array(ctLen);
  const nFull = Math.floor(ctLen / 8);
  const cn = ctLen % 8;

  for (let i = 0; i < nFull; i++) {
    const cb = load64(ct, i * 8);
    pt.set(store64((S[0] ^ cb) & MASK64), i * 8);
    S[0] = cb;
    permute(S, 6);
  }

  if (cn > 0) {
    const sb = store64(S[0]);
    const cp = ct.slice(nFull * 8);
    for (let i = 0; i < cn; i++) pt[nFull * 8 + i] = sb[i] ^ cp[i];
    const ns = Uint8Array.from(sb);
    for (let i = 0; i < cn; i++) ns[i] = cp[i];
    ns[cn] ^= 0x80;
    S[0] = load64(ns);
  } else {
    S[0] = (S[0] ^ 0x8000000000000000n) & MASK64;
  }

  S[1] = (S[1] ^ k0) & MASK64; S[2] = (S[2] ^ k1) & MASK64;
  permute(S, 12);
  S[3] = (S[3] ^ k0) & MASK64; S[4] = (S[4] ^ k1) & MASK64;

  const exp = new Uint8Array(16);
  exp.set(store64(S[3]), 0); exp.set(store64(S[4]), 8);
  let diff = 0;
  for (let i = 0; i < 16; i++) diff |= tag[i] ^ exp[i];
  return diff === 0 ? pt : null;
}

export function hashAscon(msg: Uint8Array): Uint8Array {
  const S = [ASCONHASH_IV, 0n, 0n, 0n, 0n];
  permute(S, 12);
  const mp = padMsg(msg, 8);
  for (let i = 0; i < mp.length; i += 8) {
    S[0] = (S[0] ^ load64(mp, i)) & MASK64; permute(S, 12);
  }
  const out = new Uint8Array(32);
  out.set(store64(S[0]), 0);  permute(S, 12);
  out.set(store64(S[0]), 8);  permute(S, 12);
  out.set(store64(S[0]), 16); permute(S, 12);
  out.set(store64(S[0]), 24);
  return out;
}

export function toHex(b: Uint8Array): string {
  return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
}

export function fromHex(s: string): Uint8Array {
  if (s.length % 2 !== 0) throw new Error("Invalid hex string length");
  const b = new Uint8Array(s.length / 2);
  for (let i = 0; i < b.length; i++) {
    const byte = parseInt(s.slice(i * 2, i * 2 + 2), 16);
    if (isNaN(byte)) throw new Error("Invalid hex string");
    b[i] = byte;
  }
  return b;
}

export function strToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

export function getKey(hexKey?: string): Uint8Array {
  return fromHex(hexKey || DEFAULT_KEY_HEX);
}
