import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const hostsDir = path.join(process.cwd(), 'data/hosts');

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uniqueId = searchParams.get('id');

  if (!uniqueId) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const hostFolders = fs.readdirSync(hostsDir);
  for (const host of hostFolders) {
    const inviteesPath = path.join(hostsDir, host, 'invitees.json');
    const eventPath = path.join(hostsDir, host, 'event.json');

    if (!fs.existsSync(inviteesPath)) continue;

    const invitees = JSON.parse(fs.readFileSync(inviteesPath, 'utf8'));
    const invitee = invitees.find((i: any) => i.uniqueId === uniqueId);
    if (invitee) {
      const event = fs.existsSync(eventPath) 
        ? JSON.parse(fs.readFileSync(eventPath, 'utf8')) 
        : { location: 'Not set', date: 'Not set', time: 'Not set' };

      return NextResponse.json({ invitee, event });
    }
  }

  return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
}