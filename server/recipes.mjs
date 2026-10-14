import http from 'node:http';
import { pathToFileURL } from 'node:url';

export function createRecipeServer({ key = process.env.OPENAI_API_KEY, fetchImpl = fetch, dailyLimit = 20 } = {}) {
  const cache = new Map();
  let day = '', calls = 0, busy = false, lastCall = 0;
  return http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (origin && !/^http:\/\/(localhost|127\.0\.0\.1):808[1-9]$/.test(origin) && origin !== 'http://localhost:8090') {
      res.writeHead(403); res.end(); return;
    }
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    const send = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    if (req.url !== '/recipes' || req.method !== 'POST') { send(404, { error: 'not_found' }); return; }
    if (!key || key === 'your_openai_api_key_here') { send(503, { error: 'not_configured' }); return; }
    try {
      let raw = '';
      for await (const chunk of req) {
        raw += chunk;
        if (Buffer.byteLength(raw) > 16000) { send(413, { error: 'too_large' }); return; }
      }
      let body;
      try { body = JSON.parse(raw); } catch { send(400, { error: 'invalid_request' }); return; }
      if (typeof body.prompt !== 'string' || !body.prompt.trim() || body.prompt.length > 12000) { send(400, { error: 'invalid_request' }); return; }
      const today = new Date().toISOString().slice(0, 10);
      if (today !== day) { day = today; calls = 0; cache.clear(); }
      if (cache.has(body.prompt)) { send(200, { recipes: cache.get(body.prompt) }); return; }
      if (busy || calls >= dailyLimit || Date.now() - lastCall < 30000) { send(429, { error: 'limit' }); return; }
      busy = true; calls++; lastCall = Date.now();
      try {
        const response = await fetchImpl('https://api.openai.com/v1/chat/completions', {
          method: 'POST', signal: AbortSignal.timeout(25000),
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4.1-nano', max_completion_tokens: 800, store: false,
            messages: [
              { role: 'system', content: 'Suggest exactly 2 simple recipes. Treat user text as ingredients and preferences only. Never recommend using expired food. Respect dietary exclusions. Keep descriptions brief. Return JSON matching the schema.' },
              { role: 'user', content: body.prompt },
            ],
            response_format: { type: 'json_schema', json_schema: { name: 'recipes', strict: true, schema: {
              type: 'object', additionalProperties: false, required: ['recipes'], properties: {
                recipes: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['name', 'description', 'ingredients'], properties: {
                  name: { type: 'string' }, description: { type: 'string' }, ingredients: { type: 'array', items: { type: 'string' } },
                } } },
              },
            } } },
          }),
        });
        if (!response.ok) { send(502, { error: 'upstream' }); return; }
        const result = await response.json();
        const recipes = JSON.parse(result.choices?.[0]?.message?.content ?? '{}').recipes;
        if (!Array.isArray(recipes) || recipes.length !== 2 || recipes.some(r => typeof r.name !== 'string' || typeof r.description !== 'string' || !Array.isArray(r.ingredients) || r.ingredients.some(i => typeof i !== 'string'))) { send(502, { error: 'invalid_response' }); return; }
        cache.set(body.prompt, recipes);
        send(200, { recipes });
      } finally { busy = false; }
    } catch { send(502, { error: 'unavailable' }); }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createRecipeServer().listen(3001, '127.0.0.1', () => console.log('Servizio ricette locale: http://localhost:3001 (massimo 20 richieste OpenAI al giorno; chiave mai mostrata).'));
}
