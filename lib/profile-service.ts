import { readProfileBackup, type ProfileBackup } from '@/lib/profile-backup';

const serviceUrl = process.env.EXPO_PUBLIC_PROFILE_URL?.trim().replace(/\/$/, '') ?? '';
const publicKey = process.env.EXPO_PUBLIC_PROFILE_KEY?.trim() ?? '';
export const profileServiceReady = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(serviceUrl)
  && /^sb_publishable_[a-zA-Z0-9_-]+$/.test(publicKey);

export interface ProfileSession {
  accessToken: string;
  userId: string;
  email: string;
}

export interface RemoteBackup {
  snapshot: ProfileBackup;
  savedAt: string;
}

export class ProfileRequestError extends Error {
  constructor(readonly status: number) {
    super('Profile request failed');
  }
}

async function request(path: string, method: string, payload?: object, session?: ProfileSession, returning = false): Promise<unknown> {
  if (!profileServiceReady) throw new Error('Profile service unavailable');
  const headers: Record<string, string> = { apikey: publicKey, Accept: 'application/json' };
  if (payload) headers['Content-Type'] = 'application/json';
  if (session) headers.Authorization = 'Bearer ' + session.accessToken;
  if (returning) headers.Prefer = 'return=representation';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(serviceUrl + path, {
      method, headers, body: payload ? JSON.stringify(payload) : undefined, signal: controller.signal,
    });
    if (!response.ok) throw new ProfileRequestError(response.status);
    if (response.status === 204) return null;
    const body = await response.text();
    return body ? JSON.parse(body) : null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function requestProfileCode(email: string) {
  await request('/auth/v1/otp', 'POST', { email, create_user: true });
}

export async function verifyProfileCode(email: string, token: string): Promise<ProfileSession> {
  const response = await request('/auth/v1/verify', 'POST', { email, token, type: 'email' }) as {
    access_token?: string; user?: { id?: string; email?: string };
  } | null;
  if (!response?.access_token || !response.user?.id || !response.user.email) throw new Error('Missing profile session');
  return { accessToken: response.access_token, userId: response.user.id, email: response.user.email };
}

function readRows(response: unknown): RemoteBackup | null {
  if (!Array.isArray(response) || response.length > 1) throw new Error('Invalid backup response');
  if (!response.length) return null;
  const row = response[0];
  if (typeof row?.updated_at !== 'string' || !Number.isFinite(Date.parse(row.updated_at))) throw new Error('Invalid backup date');
  return { savedAt: row.updated_at, snapshot: readProfileBackup(row.backup) };
}

function userPath(session: ProfileSession) {
  return '/rest/v1/chefsuggest_backups?user_id=eq.' + encodeURIComponent(session.userId);
}

export async function getProfileBackup(session: ProfileSession) {
  return readRows(await request(userPath(session) + '&select=backup,updated_at', 'GET', undefined, session));
}

export async function saveProfileBackup(session: ProfileSession, backup: ProfileBackup, previous: RemoteBackup | null) {
  const result = previous
    ? await request(userPath(session) + '&updated_at=eq.' + encodeURIComponent(previous.savedAt),
      'PATCH', { backup }, session, true)
    : await request('/rest/v1/chefsuggest_backups', 'POST', { user_id: session.userId, backup }, session, true);
  const copy = readRows(result);
  if (!copy) throw new ProfileRequestError(409);
  return copy;
}
