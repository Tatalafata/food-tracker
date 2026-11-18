import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { generateRecipeResponse, hasRecipeKey, maxRecipeRequestBytes, parseRecipeRequest } from './recipe-generation.mjs';

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
    if (req.url === '/health' && req.method === 'GET') { send(200, { service: 'chefsuggest-recipes' }); return; }
    if (req.url !== '/recipes' || req.method !== 'POST') { send(404, { error: 'not_found' }); return; }
    if (!hasRecipeKey(key)) { send(503, { error: 'not_configured' }); return; }
    try {
      let raw = '';
      for await (const chunk of req) {
        raw += chunk;
        if (Buffer.byteLength(raw) > maxRecipeRequestBytes) { send(413, { error: 'too_large' }); return; }
      }
      const body = parseRecipeRequest(raw);
      if (!body) { send(400, { error: 'invalid_request' }); return; }
      const { prompt, preferences } = body;
      const cacheKey = JSON.stringify([prompt, preferences.easy, preferences.quick]);
      const today = new Date().toISOString().slice(0, 10);
      if (today !== day) { day = today; calls = 0; cache.clear(); }
      if (cache.has(cacheKey)) { send(200, { recipes: cache.get(cacheKey) }); return; }
      if (busy || calls >= dailyLimit || Date.now() - lastCall < 30000) { send(429, { error: 'limit' }); return; }
      busy = true; calls++; lastCall = Date.now();
      try {
        const result = await generateRecipeResponse({ key, prompt, preferences, fetchImpl });
        if (result.status === 200) cache.set(cacheKey, result.data.recipes);
        send(result.status, result.data);
      } finally { busy = false; }
    } catch { send(502, { error: 'unavailable' }); }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createRecipeServer().listen(3001, '127.0.0.1', () => console.log('Servizio ricette locale: http://localhost:3001 (massimo 20 richieste OpenAI al giorno; chiave mai mostrata).'));
}
