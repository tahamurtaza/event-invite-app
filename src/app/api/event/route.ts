import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const decoded = verifyToken(token);
  if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('username', decoded.username)
    .single();

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('host_id', user.id)
    .single();

  return NextResponse.json(event || { location: '', date: '', time: '' });
}