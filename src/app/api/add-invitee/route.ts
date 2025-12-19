import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import crypto from 'crypto';
import { verifyToken } from '@/lib/auth';
import { getHostInviteesPath } from '@/lib/host';

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const decoded = verifyToken(token);
  if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { name, phone, family_size = 1 } = await req.json();
  if (!name || !phone) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const username = decoded.username;
  const inviteesPath = getHostInviteesPath(username);

  const invitees = fs.existsSync(inviteesPath)
    ? JSON.parse(fs.readFileSync(inviteesPath, 'utf8'))
    : [];

  const uniqueId = crypto.randomUUID();
  const newInvitee = {
    id: invitees.length + 1,
    name,
    phone,
    uniqueId,
    family_size: Number(family_size),
    rsvp_coming: null,
    rsvp_people: 0
  };
  invitees.push(newInvitee);
  fs.writeFileSync(inviteesPath, JSON.stringify(invitees, null, 2));

  return NextResponse.json({ success: true });
}