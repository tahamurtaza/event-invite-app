import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const decoded = verifyToken(token);
  if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { name, phone, family_size = 1 } = await req.json();
  if (!name || !phone) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Fetch the user safely
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('username', decoded.username)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const unique_id = crypto.randomUUID();

  const { error } = await supabase
    .from('invitees')
    .insert({
      host_id: user.id,
      name,
      phone,
      unique_id,
      family_size,
    });

  if (error) {
    console.error('Supabase insert error:', error);
    return NextResponse.json({ error: 'Failed to add invitee' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}