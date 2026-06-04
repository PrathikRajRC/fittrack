// Account auth helpers — password hashing + validation.

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return typeof email === "string" && EMAIL_RE.test(email.trim());
}

// Returns null if valid, else an error message.
export function passwordProblem(password) {
  if (typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (password.length > 200) return "Password is too long.";
  return null;
}

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

// Shape the user object we expose to the client (never leak passwordHash).
export function publicUser(user) {
  if (!user) return null;
  return {
    id:        user.id,
    email:     user.email,
    name:      user.name ?? null,
    createdAt: user.createdAt,
  };
}
