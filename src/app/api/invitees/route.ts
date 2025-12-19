import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { verifyToken } from '@/lib/auth';
import { getHostInviteesPath } from '@/lib/host';

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const decoded = verifyToken(token);
  if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const username = decoded.username;
  const inviteesPath = getHostInviteesPath(username);

  if (!fs.existsSync(inviteesPath)) {
    return NextResponse.json([]);
  }

  const invitees = JSON.parse(fs.readFileSync(inviteesPath, 'utf8'));
  return NextResponse.json(invitees);
}