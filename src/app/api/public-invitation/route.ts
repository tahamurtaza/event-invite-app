import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data: inviteeData, error } = await supabase
    .from('invitees')
    .select('*, events(location, date, time, theme)')
    .eq('unique_id', id);

  if (error || !inviteeData || inviteeData.length === 0) {
    return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
  }

  const invitee = inviteeData[0];
  const event = {
    location: invitee.events?.location || '',
    date: invitee.events?.date || '',
    time: invitee.events?.time || '',
    theme: invitee.events?.theme || 'birthday',
  };

  const { events, ...inviteeClean } = invitee;

  return NextResponse.json({ invitee: inviteeClean, event });
}