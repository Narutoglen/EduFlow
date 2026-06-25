import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const PASSWORD_PREFIX = "pbkdf2_sha256";
const PASSWORD_ITERATIONS = 120_000;
const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_DIGEST = "sha256";

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = pbkdf2Sync(
    password,
    salt,
    PASSWORD_ITERATIONS,
    PASSWORD_KEY_LENGTH,
    PASSWORD_DIGEST,
  ).toString("hex");
  return `${PASSWORD_PREFIX}$${PASSWORD_ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash?: string | null) {
  if (!storedHash) return false;
  const [prefix, iterations, salt, expected] = storedHash.split("$");
  if (prefix !== PASSWORD_PREFIX || !iterations || !salt || !expected) return false;

  const candidate = pbkdf2Sync(
    password,
    salt,
    Number(iterations),
    Buffer.from(expected, "hex").length,
    PASSWORD_DIGEST,
  );
  const expectedBuffer = Buffer.from(expected, "hex");
  return (
    candidate.length === expectedBuffer.length &&
    timingSafeEqual(candidate, expectedBuffer)
  );
}

export function newSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
