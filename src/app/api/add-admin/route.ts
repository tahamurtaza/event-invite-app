import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { verifyToken } from '@/lib/auth';

const usersPath = path.join(process.cwd(), 'data/users.json');
const hostsDir = path.join(process.cwd(), 'data/hosts');

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  if (users.find((u: any) => u.username === username)) {
    return NextResponse.json({ error: 'Username exists' }, { status: 400 });
  }

  const hashed = bcrypt.hashSync(password, 10);
  const newUser = { id: users.length + 1, username, password: hashed, role: 'admin' };
  users.push(newUser);
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

  // Create host-specific folder and initial files
  const hostDir = path.join(hostsDir, username);
  fs.mkdirSync(hostDir, { recursive: true });

  // Default event
  fs.writeFileSync(path.join(hostDir, 'event.json'), JSON.stringify({
    location: 'Not set yet',
    date: 'Not set',
    time: 'Not set'
  }, null, 2));

  // Empty invitees
  fs.writeFileSync(path.join(hostDir, 'invitees.json'), JSON.stringify([], null, 2));

  return NextResponse.json({ success: true, message: `Host "${username}" created successfully!` });
}