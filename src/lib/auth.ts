import jwt from 'jsonwebtoken';

export const SECRET = 'your-secret-key-change-this-in-production'; // Use env var in prod

export function verifyToken(token: string | null) {
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET) as { username: string; role: string };
  } catch {
    return null;
  }
}