import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifyToken } from '@/lib/auth';

const hostsDir = path.join(process.cwd(), 'data/hosts');

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const decoded = verifyToken(token);

  if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { location, date, time } = await req.json();

  if (!location || !date || !time) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  const username = decoded.username;
  const hostDir = path.join(hostsDir, username);
  const eventPath = path.join(hostDir, 'event.json');

  try {
    // Ensure host directory exists
    if (!fs.existsSync(hostDir)) {
      fs.mkdirSync(hostDir, { recursive: true });
    }

    const eventData = { location: location.trim(), date: date.trim(), time: time.trim() };
    fs.writeFileSync(eventPath, JSON.stringify(eventData, null, 2));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving event:', error);
    return NextResponse.json({ error: 'Failed to save event: ' + error.message }, { status: 500 });
  }
}