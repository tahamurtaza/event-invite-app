import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error, count } = await supabase.from('users').select('*', { count: 'exact', head: true });

  if (error) {
    return NextResponse.json({ connected: false, error: error.message });
  }

  return NextResponse.json({ connected: true, userCount: count || 0 });
}