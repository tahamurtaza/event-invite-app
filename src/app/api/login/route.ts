import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabase';

const SECRET = process.env.JWT_SECRET || 'fallback-secret';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !user || !bcrypt.compareSync(password, user.password)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = jwt.sign({ username: user.username, role: user.role }, SECRET, { expiresIn: '24h' });
  return NextResponse.json({ token });
}