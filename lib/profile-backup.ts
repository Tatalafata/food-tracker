import AsyncStorage from '@react-native-async-storage/async-storage';

import { isRecipe } from '@/lib/recipes.mjs';

const stores = {
  pantry: '@freshtrack:pantry',
  kitchen: '@chefsuggest:kitchen',
  dietary: '@chefsuggest:dietary_preferences',
  book: '@chefsuggest:recipe_book',
  plans: '@chefsuggest:recipe_plans',
  notifications: '@chefsuggest:notif_prefs',
  language: '@freshtrack:language',
} as const;
const pendingKey = '@chefsuggest:pending-profile-restore';
const fields = Object.keys(stores) as (keyof typeof stores)[];

export interface ProfileBackup {
  version: 1;
  data: Record<keyof typeof stores, string | null>;
}

function object(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function identified(value: unknown): value is Record<string, unknown> & { id: string } {
  return object(value) && typeof value.id === 'string';
}

function validRecord(field: keyof typeof stores, stored: unknown) {
  if (stored === null) return true;
  if (typeof stored !== 'string') return false;
  if (field === 'language') return ['it', 'en', 'fr', 'de'].includes(stored);

  const data: unknown = JSON.parse(stored);
  switch (field) {
    case 'pantry':
      return Array.isArray(data) && data.every(item => identified(item) && typeof item.name === 'string'
        && (item.expiryDate === undefined || typeof item.expiryDate === 'string'));
    case 'kitchen':
      return object(data) && Array.isArray(data.equipment) && data.equipment.every(item => typeof item === 'string')
        && (data.firstName === undefined || typeof data.firstName === 'string')
        && (data.lastName === undefined || typeof data.lastName === 'string')
        && Array.isArray(data.shopping) && data.shopping.every(item => identified(item)
          && typeof item.name === 'string' && typeof item.quantity === 'string' && typeof item.bought === 'boolean');
    case 'dietary':
      return object(data) && Array.isArray(data.defaultIds) && data.defaultIds.every(item => typeof item === 'string')
        && Array.isArray(data.custom) && data.custom.every(item => identified(item)
          && typeof item.name === 'string' && typeof item.description === 'string');
    case 'book':
    case 'plans':
      return Array.isArray(data) && data.every(item => object(item) && isRecipe(item.recipe)
        && typeof item.servings === 'number' && Number.isInteger(item.servings) && item.servings >= 1 && item.servings <= 12);
    case 'notifications':
      return object(data);
  }
}

export function readProfileBackup(value: unknown): ProfileBackup {
  if (!object(value) || value.version !== 1 || !object(value.data)) throw new Error('Invalid backup');
  const data = value.data;
  if (!fields.every(field => validRecord(field, data[field]))) throw new Error('Invalid backup records');
  // Keep the transfer below the per-record limit on Android's local storage.
  const backup = { version: 1 as const, data: Object.fromEntries(fields.map(field => [field, data[field]])) as ProfileBackup['data'] };
  if (JSON.stringify(backup).length > 350000) throw new Error('Backup too large');
  return backup;
}

export async function collectProfileBackup(): Promise<ProfileBackup> {
  const items = new Map(await AsyncStorage.multiGet(Object.values(stores)));
  return readProfileBackup({ version: 1, data: Object.fromEntries(fields.map(field => [field, items.get(stores[field]) ?? null])) });
}

export async function stageProfileRestore(backup: ProfileBackup) {
  await AsyncStorage.setItem(pendingKey, JSON.stringify(readProfileBackup(backup)));
}

// Restore before the app's stores start reading or writing their live values.
// If a write fails, leave the complete snapshot staged so the operation can retry.
export async function applyProfileRestore() {
  const raw = await AsyncStorage.getItem(pendingKey).catch(() => null);
  if (raw === null) return;
  const backup = readProfileBackup(JSON.parse(raw));
  const entries: [string, string][] = [
    ['@freshtrack:initialized', 'true'], ['@chefsuggest:onboarded', 'true'],
    [stores.pantry, backup.data.pantry ?? '[]'],
  ];
  const absent: string[] = [];
  for (const field of fields) {
    if (field === 'pantry') continue;
    const value = backup.data[field];
    if (value === null) absent.push(stores[field]);
    else entries.push([stores[field], value]);
  }
  await AsyncStorage.multiSet(entries);
  if (absent.length) await AsyncStorage.multiRemove(absent);
  await AsyncStorage.removeItem(pendingKey);
}
