import { generateRecipeResponse, hasRecipeKey, maxRecipeRequestBytes, parseRecipeRequest } from '../../../server/recipe-generation.mjs';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'apikey, authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const uuid = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i;

function json(status, data) {
  return Response.json(data, { status, headers: { ...cors, 'Cache-Control': 'no-store' } });
}

async function readRequest(request) {
  const reader = request.body?.getReader();
  if (!reader) return { body: null };
  const decoder = new TextDecoder();
  let raw = '';
  let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) return { body: parseRecipeRequest(raw + decoder.decode()) };
      bytes += chunk.value.byteLength;
      if (bytes > maxRecipeRequestBytes) {
        await reader.cancel();
        return { tooLarge: true };
      }
      raw += decoder.decode(chunk.value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

export function createHostedRecipeHandler({ url, publishableKey, serviceKey, openaiKey, fetchImpl = fetch }) {
  return async request => {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json(405, { error: 'not_found' });
    const authorization = request.headers.get('Authorization');
    if (!authorization || !/^Bearer [\w.-]{16,4096}$/i.test(authorization)) return json(401, { error: 'unauthorized' });
    if (!url || !publishableKey || !serviceKey) return json(503, { error: 'not_configured' });
    if (Number(request.headers.get('Content-Length')) > maxRecipeRequestBytes) return json(413, { error: 'too_large' });

    try {
      const userResponse = await fetchImpl(url + '/auth/v1/user', {
        headers: { apikey: publishableKey, Authorization: authorization },
        signal: AbortSignal.timeout(8000),
      });
      if ([400, 401, 403].includes(userResponse.status)) return json(401, { error: 'unauthorized' });
      if (!userResponse.ok) return json(503, { error: 'unavailable' });
      const user = await userResponse.json();
      if (typeof user?.id !== 'string' || !uuid.test(user.id)) return json(401, { error: 'unauthorized' });
      const { body, tooLarge } = await readRequest(request);
      if (tooLarge) return json(413, { error: 'too_large' });
      if (!body) return json(400, { error: 'invalid_request' });
      if (!hasRecipeKey(openaiKey)) return json(503, { error: 'not_configured' });

      const quotaResponse = await fetchImpl(url + '/rest/v1/rpc/chefsuggest_reserve_recipe_request', {
        method: 'POST',
        headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_id: user.id }),
        signal: AbortSignal.timeout(8000),
      });
      if (!quotaResponse.ok) return json(503, { error: 'unavailable' });
      const reserved = await quotaResponse.json();
      if (reserved === false) return json(429, { error: 'limit' });
      if (reserved !== true) return json(503, { error: 'unavailable' });

      const result = await generateRecipeResponse({ ...body, key: openaiKey, fetchImpl });
      return json(result.status, result.data);
    } catch {
      return json(502, { error: 'unavailable' });
    }
  };
}
