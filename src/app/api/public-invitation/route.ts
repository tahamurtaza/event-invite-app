import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // Fetch invitee
  const { data: invitee, error: inviteeError } = await supabase
    .from('invitees')
    .select('*')
    .eq('unique_id', id)
    .single();

  if (inviteeError || !invitee) {
    return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
  }

  // Fetch event for the host
  const { data: eventData } = await supabase
    .from('events')
    .select('location, date, time')
    .eq('host_id', invitee.host_id)
    .single();

  const event = eventData || { location: '', date: '', time: '' };

  return NextResponse.json({ invitee, event });
}