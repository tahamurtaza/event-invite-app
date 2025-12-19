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

  const { data: invitees } = await supabase
    .from('invitees')
    .select('*')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false });

  return NextResponse.json(invitees || []);
}