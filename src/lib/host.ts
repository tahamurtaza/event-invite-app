import path from 'path';

export function getHostDir(username: string) {
  return path.join(process.cwd(), 'data/hosts', username);
}

export function getHostEventPath(username: string) {
  return path.join(getHostDir(username), 'event.json');
}

export function getHostInviteesPath(username: string) {
  return path.join(getHostDir(username), 'invitees.json');
}