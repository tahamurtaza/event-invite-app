import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { uniqueId, coming, people } = await req.json();
  if (!uniqueId || coming === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const { error } = await supabase
    .from('invitees')
    .update({
      rsvp_coming: coming,
      rsvp_people: coming ? people : 0,
    })
    .eq('unique_id', uniqueId);  // Fixed: was 'uniqueId'

  if (error) {
    console.error('RSVP update error:', error);
    return NextResponse.json({ error: 'Failed to submit RSVP' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}