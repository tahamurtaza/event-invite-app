import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data: invitee, error } = await supabase
    .from('invitees')
    .select('*, events(location, date, time)')
    .eq('unique_id', id)
    .single();

  if (error || !invitee) return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });

  const event = {
    location: invitee.events?.location || '',
    date: invitee.events?.date || '',
    time: invitee.events?.time || '',
  };

  // Remove the joined events object
  const { events, ...inviteeWithoutEvents } = invitee;

  return NextResponse.json({ invitee: inviteeWithoutEvents, event });
}