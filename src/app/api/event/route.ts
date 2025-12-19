import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const decoded = verifyToken(token);
  if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('username', decoded.username)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('host_id', user.id)
    .single();

  if (error || !event) {
    // Return empty event if none exists yet
    return NextResponse.json({ location: '', date: '', time: '' });
  }

  return NextResponse.json(event);
}