import jwt from 'jsonwebtoken';

export const SECRET = '9f8e7d6c5b4a392817161514131211100f0e0d0c0b0a09080706050403020100a1b2c3d4e5f67890abcdef1234567890fedcba0987654321'; // Change this!

export function verifyToken(token: string | undefined | null) {
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET) as { username: string; role: string };
  } catch {
    return null;
  }
}