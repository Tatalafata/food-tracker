import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRecipeServer } from './recipes.mjs';

test('private proxy: structured request, cache, cap and blocked origins', async () => {
  let calls = 0;
  const server = createRecipeServer({ key: 'test-only', dailyLimit: 1, fetchImpl: async (_url, options) => {
    calls++;
    const request = JSON.parse(options.body);
    assert.equal(request.model, 'gpt-4.1-nano');
    assert.equal(request.max_completion_tokens, 800);
    assert.equal(request.response_format.json_schema.strict, true);
    return Response.json({ choices: [{ message: { content: JSON.stringify({ recipes: Array.from({ length: 2 }, () => ({ name: 'Pasta', description: 'Simple recipe', ingredients: ['pasta'] })) }) } }] });
  } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/recipes`;
  const ask = prompt => fetch(url, { method: 'POST', body: JSON.stringify({ prompt }) });
  try {
    assert.equal((await ask('pasta')).status, 200);
    assert.equal((await ask('pasta')).status, 200);
    assert.equal(calls, 1);
    assert.equal((await ask('rice')).status, 429);
    assert.equal((await ask('x'.repeat(12001))).status, 400);
    assert.equal((await fetch(url, { method: 'POST', headers: { Origin: 'https://untrusted.example' } })).status, 403);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('missing key returns a safe configuration error', async () => {
  const server = createRecipeServer({ key: '' });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/recipes`, { method: 'POST' });
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'not_configured' });
  } finally { await new Promise(resolve => server.close(resolve)); }
});
