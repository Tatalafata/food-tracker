import { createHostedRecipeHandler } from './handler.mjs';

const { env, serve } = globalThis.Deno;
function projectKey(current, legacy) {
  const keys = JSON.parse(env.get(current) ?? '{}');
  return keys.default ?? env.get(legacy);
}

serve(createHostedRecipeHandler({
  url: env.get('SUPABASE_URL')?.replace(/\/$/, ''),
  publishableKey: projectKey('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY'),
  serviceKey: projectKey('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY'),
  openaiKey: env.get('CHEFSUGGEST_OPENAI_API_KEY'),
}));
