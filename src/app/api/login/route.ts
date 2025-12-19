import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { SECRET } from '@/lib/auth';

const usersPath = path.join(process.cwd(), 'data/users.json');

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  const user = users.find((u: any) => u.username === username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = jwt.sign({ username: user.username, role: user.role }, SECRET, { expiresIn: '1h' });
  return NextResponse.json({ token });
}