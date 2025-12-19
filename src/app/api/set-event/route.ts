import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const decoded = verifyToken(token);
  if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { location, date, time } = await req.json();
  if (!location || !date || !time) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 });
  }

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('username', decoded.username)
    .single();

  const { error } = await supabase
    .from('events')
    .upsert({ host_id: user.id, location, date, time }, { onConflict: 'host_id' });

  if (error) return NextResponse.json({ error: 'Failed to save' }, { status: 500 });

  return NextResponse.json({ success: true });
}