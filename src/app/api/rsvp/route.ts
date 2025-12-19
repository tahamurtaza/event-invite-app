import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const hostsDir = path.join(process.cwd(), 'data/hosts');

export async function POST(req: NextRequest) {
  const { uniqueId, coming, people } = await req.json();
  if (!uniqueId || coming === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Search all hosts for the uniqueId
  const hostFolders = fs.readdirSync(hostsDir);
  for (const host of hostFolders) {
    const inviteesPath = path.join(hostsDir, host, 'invitees.json');
    if (!fs.existsSync(inviteesPath)) continue;

    const invitees = JSON.parse(fs.readFileSync(inviteesPath, 'utf8'));
    const invitee = invitees.find((i: any) => i.uniqueId === uniqueId);
    if (invitee) {
      invitee.rsvp_coming = coming;
      invitee.rsvp_people = coming ? (people || 1) : 0;
      fs.writeFileSync(inviteesPath, JSON.stringify(invitees, null, 2));
      return NextResponse.json({ success: true });
    }
  }

  return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
}