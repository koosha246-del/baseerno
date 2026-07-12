import bcrypt from "bcryptjs";

/**
 * Password hashing helpers (bcrypt, 12 rounds).
 * Used at registration and login verification.
 */

const ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
