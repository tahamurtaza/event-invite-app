import jwt from 'jsonwebtoken';

export const SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';

export function verifyToken(token: string | undefined | null) {
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET) as { username: string; role: string };
  } catch {
    return null;
  }
}