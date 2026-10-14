import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRecipeServer } from './recipes.mjs';
import { isRecipe, scaledAmount, formatStep, normalizeStepShares } from '../lib/recipes.mjs';

test('servings multiply numeric quantities without changing to-taste ingredients', () => {
  assert.equal(scaledAmount(150, 1), 150);
  assert.equal(scaledAmount(150, 2), 300);
  assert.equal(scaledAmount(0.5, 3), 1.5);
  assert.equal(scaledAmount(0.1, 3), 0.3);
  assert.equal(scaledAmount(null, 12), null);
  assert.throws(() => scaledAmount(100, 0));
  assert.throws(() => scaledAmount(100, 13));
  const recipe = { name: 'Salmon', description: 'Simple', ingredients: [{ name: 'Salmon', amount: 150, unit: 'g' }], steps: ['Heat oil.', 'Cook salmon.'] };
  assert.ok(isRecipe(recipe));
  assert.equal(isRecipe({ ...recipe, ingredients: ['Salmon'] }), false);
  assert.equal(isRecipe({ ...recipe, ingredients: [{ name: 'Salmon', amount: -1, unit: 'g' }] }), false);
  assert.equal(isRecipe({ ...recipe, steps: [] }), false);
  assert.equal(isRecipe({ ...recipe, steps: ['Use 5 ml oil.', 'Cook.'] }), false);
  assert.equal(isRecipe({ ...recipe, steps: ['Use {{8:1}}.', 'Cook.'] }), false);
  assert.equal(formatStep('Use {{0:0.5}} and cook 10 minutes at 200°C.', recipe.ingredients, 2, 'en'), 'Use 150 g and cook 10 minutes at 200°C.');
  assert.equal(formatStep('Use {{0:1}} g.', recipe.ingredients, 1, 'en'), 'Use 150 g.');
  const shared = normalizeStepShares({ ...recipe, steps: ['Use {{0:1}}.', 'Use {{0:1}}.'] });
  assert.equal(formatStep(shared.steps[0], recipe.ingredients, 1, 'en'), 'Use 75 g.');
});

test('private proxy: structured request, cache, cap and blocked origins', async () => {
  let calls = 0;
  const server = createRecipeServer({ key: 'test-only', dailyLimit: 1, fetchImpl: async (_url, options) => {
    calls++;
    const request = JSON.parse(options.body);
    assert.equal(request.model, 'gpt-4.1-nano');
    assert.equal(request.max_completion_tokens, 2200);
    assert.equal(request.response_format.json_schema.strict, true);
    return Response.json({ choices: [{ message: { content: JSON.stringify({ recipes: Array.from({ length: 2 }, () => ({ name: 'Pasta', description: 'Simple recipe', ingredients: [{ name: 'pasta', amount: 80, unit: 'g' }], steps: ['Boil water.', 'Cook the pasta.'] })) }) } }] });
  } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/recipes`;
  const ask = prompt => fetch(url, { method: 'POST', body: JSON.stringify({ prompt }) });
  try {
    const first = await ask('pasta');
    assert.equal(first.status, 200);
    assert.ok((await first.json()).recipes.every(isRecipe));
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

test('exhausted OpenAI credit becomes a clear error without exposing upstream details', async () => {
  const server = createRecipeServer({ key: 'test-only', fetchImpl: async () => Response.json({ error: { type: 'insufficient_quota', code: 'credit_balance_exhausted' } }, { status: 429 }) });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/recipes`, { method: 'POST', body: JSON.stringify({ prompt: 'pasta' }) });
    assert.equal(response.status, 402);
    assert.deepEqual(await response.json(), { error: 'credits' });
  } finally { await new Promise(resolve => server.close(resolve)); }
});
