import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data: invitee } = await supabase
    .from('invitees')
    .select('*, events(location, date, time)')
    .eq('unique_id', id)
    .single();

  if (!invitee) return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });

  const event = invitee.events || { location: '', date: '', time: '' };
  delete (invitee as any).events;

  return NextResponse.json({ invitee, event });
}