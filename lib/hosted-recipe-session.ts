import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface GuestSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const supabaseRecipeUrl = /^(https:\/\/([a-z0-9]+)\.supabase\.co)\/functions\/v1\/?$/;
const publishableKey = process.env.EXPO_PUBLIC_RECIPES_PUBLISHABLE_KEY?.trim() ?? '';
let guestSession: GuestSession | null = null;
let inFlight: Promise<GuestSession> | null = null;

async function signIn(origin: string, project: string, signal: AbortSignal) {
  const storageKey = 'chefsuggest.recipes.' + project;
  const secureStorage = Platform.OS !== 'web' && await SecureStore.isAvailableAsync();
  const refresh = guestSession?.refreshToken
    ?? (secureStorage ? await SecureStore.getItemAsync(storageKey).catch(() => null) : null);
  const headers = { apikey: publishableKey, 'Content-Type': 'application/json' };
  let response = refresh ? await fetch(origin + '/auth/v1/token?grant_type=refresh_token', {
    method: 'POST', headers, body: JSON.stringify({ refresh_token: refresh }), signal,
  }) : null;
  if (!response || response.status === 400 || response.status === 401) {
    response = await fetch(origin + '/auth/v1/signup', {
      method: 'POST', headers, body: '{}', signal,
    });
  }
  if (response.status === 429) throw new Error('limit');
  if (!response.ok) throw new Error('network');
  const data = await response.json();
  if (typeof data.access_token !== 'string' || typeof data.refresh_token !== 'string'
    || !Number.isFinite(data.expires_in) || data.expires_in <= 0) throw new Error('network');
  const session = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  guestSession = session;
  if (secureStorage) await SecureStore.setItemAsync(storageKey, session.refreshToken).catch(() => {});
  return session;
}

export async function hostedRecipeHeaders(apiUrl: string, signal: AbortSignal): Promise<Record<string, string>> {
  const match = apiUrl.match(supabaseRecipeUrl);
  if (!match) return {};
  if (!/^sb_publishable_[a-zA-Z0-9_-]+$/.test(publishableKey)) throw new Error('key');
  const session = guestSession && guestSession.expiresAt > Date.now() + 60000 ? guestSession :
    await (inFlight ??= signIn(match[1], match[2], signal).finally(() => { inFlight = null; }));
  return { apikey: publishableKey, Authorization: 'Bearer ' + session.accessToken };
}
