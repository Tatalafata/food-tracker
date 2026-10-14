import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRecipeServer } from './recipes.mjs';
import { prepareRecipeOutput } from './recipe-output.mjs';
import { isRecipe, isRecipeBatch, matchesRecipePreferences, scaledAmount, formatStep, normalizeStepShares } from '../lib/recipes.mjs';

const fixtureRecipes = Array.from({ length: 5 }, (_, index) => ({
  name: 'Pasta ' + (index + 1), description: 'Simple recipe',
  totalMinutes: 20, difficulty: 'easy',
  ingredients: [{ name: 'pasta', amount: 80, unit: 'g' }], steps: ['Boil water.', 'Add pasta.\npasta: {{0:1}}', 'Cook for 10 minutes.', 'Drain and serve.'],
}));

const upstreamRecipes = recipes => recipes.map(recipe => ({ ...recipe, steps: recipe.steps.map(step => ({
  instruction: step.split('\n')[0],
  quantities: [...step.matchAll(/\{\{(\d+):([\d.]+)\}\}/g)].map(([, index, fraction]) => ({ ingredientIndex: Number(index), fraction: Number(fraction) })),
})) }));

test('a batch requires five complete recipes with different titles', () => {
  assert.ok(isRecipeBatch(fixtureRecipes));
  assert.equal(isRecipeBatch(fixtureRecipes.slice(0, 2)), false);
  assert.equal(isRecipeBatch(fixtureRecipes.slice(0, 4)), false);
  assert.equal(isRecipeBatch([...fixtureRecipes, { ...fixtureRecipes[0], name: 'Sixth recipe' }]), false);
  assert.equal(isRecipeBatch([...fixtureRecipes.slice(0, 4), { ...fixtureRecipes[4], steps: [] }]), false);
  assert.equal(isRecipeBatch([...fixtureRecipes.slice(0, 4), { ...fixtureRecipes[4], name: ' PASTA 1 ' }]), false);
});

test('servings multiply numeric quantities without changing to-taste ingredients', () => {
  assert.equal(scaledAmount(150, 1), 150);
  assert.equal(scaledAmount(150, 2), 300);
  assert.equal(scaledAmount(0.5, 3), 1.5);
  assert.equal(scaledAmount(0.1, 3), 0.3);
  assert.equal(scaledAmount(null, 12), null);
  assert.throws(() => scaledAmount(100, 0));
  assert.throws(() => scaledAmount(100, 13));
  const recipe = { ...fixtureRecipes[0], name: 'Salmon', ingredients: [{ name: 'Salmon', amount: 150, unit: 'g' }] };
  assert.ok(isRecipe(recipe));
  assert.equal(isRecipe({ ...recipe, ingredients: ['Salmon'] }), false);
  assert.equal(isRecipe({ ...recipe, ingredients: [{ name: 'Salmon', amount: -1, unit: 'g' }] }), false);
  assert.equal(isRecipe({ ...recipe, steps: [] }), false);
  assert.equal(isRecipe({ ...recipe, steps: ['Use 5 ml oil.', ...recipe.steps.slice(1)] }), false);
  assert.equal(isRecipe({ ...recipe, steps: ['Use {{8:1}}.', ...recipe.steps.slice(1)] }), false);
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
    assert.equal(request.max_completion_tokens, 5000);
    assert.equal(request.response_format.json_schema.strict, true);
    assert.ok(request.response_format.json_schema.schema.properties.recipes.items.required.includes('totalMinutes'));
    return Response.json({ choices: [{ message: { content: JSON.stringify({ recipes: upstreamRecipes(fixtureRecipes) }) } }] });
  } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/recipes`;
  const ask = (prompt, preferences) => fetch(url, { method: 'POST', body: JSON.stringify({ prompt, preferences }) });
  try {
    const first = await ask('pasta');
    assert.equal(first.status, 200);
    assert.deepEqual((await first.json()).recipes, fixtureRecipes);
    const cached = await ask('pasta');
    assert.equal(cached.status, 200);
    assert.deepEqual((await cached.json()).recipes, fixtureRecipes);
    assert.equal(calls, 1);
    assert.equal((await ask('pasta', { easy: true, quick: false })).status, 429, 'changing filters cannot reuse an unfiltered cached result');
    assert.equal((await ask('pasta', { easy: false, quick: false })).status, 200, 'explicit defaults share the unfiltered cache');
    assert.equal((await ask('pasta', { easy: 'yes', quick: true })).status, 400);
    assert.equal((await ask('pasta', null)).status, 400);
    assert.equal((await ask('rice')).status, 429);
    assert.equal((await ask('x'.repeat(12001))).status, 400);
    assert.equal((await fetch(url, { method: 'POST', headers: { Origin: 'https://untrusted.example' } })).status, 403);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('time and difficulty are required and cooking filters reject unsuitable recipes', () => {
  const recipe = fixtureRecipes[0];
  assert.equal(isRecipe({ ...recipe, totalMinutes: undefined }), false);
  assert.equal(isRecipe({ ...recipe, totalMinutes: 0 }), false);
  assert.equal(isRecipe({ ...recipe, totalMinutes: 20.5 }), false);
  assert.equal(isRecipe({ ...recipe, difficulty: 'expert' }), false);
  assert.ok(matchesRecipePreferences(fixtureRecipes, { easy: true, quick: true }));
  assert.equal(matchesRecipePreferences([{ ...recipe, totalMinutes: 31 }], { easy: false, quick: true }), false);
  assert.equal(matchesRecipePreferences([{ ...recipe, difficulty: 'standard' }], { easy: true, quick: false }), false);
  assert.equal(matchesRecipePreferences([{ ...recipe, steps: Array(7).fill('Prepare.') }], { easy: true, quick: false }), false);
  assert.ok(matchesRecipePreferences([{ ...recipe, totalMinutes: 90, difficulty: 'standard' }], { easy: false, quick: false }));
});

test('cooking preferences reach the model and a matching result is cached', async () => {
  let calls = 0;
  const server = createRecipeServer({ key: 'test-only', fetchImpl: async (_url, options) => {
    calls++;
    const request = JSON.parse(options.body);
    const policy = request.messages.at(-1);
    assert.equal(policy.role, 'system');
    assert.match(policy.content, /EASY:/);
    assert.match(policy.content, /QUICK:/);
    assert.match(policy.content, /30 minutes TOTAL/);
    const schema = request.response_format.json_schema.schema.properties.recipes;
    assert.equal(schema.minItems, 5);
    assert.equal(schema.maxItems, 5);
    assert.equal(schema.items.properties.totalMinutes.maximum, 30);
    assert.deepEqual(schema.items.properties.difficulty.enum, ['easy']);
    assert.equal(schema.items.properties.steps.maxItems, 6);
    return Response.json({ choices: [{ message: { content: JSON.stringify({ recipes: upstreamRecipes(fixtureRecipes) }) } }] });
  } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/recipes`;
  const ask = preferences => fetch(url, { method: 'POST', body: JSON.stringify({ prompt: 'pasta', preferences }) });
  try {
    assert.equal((await ask({ easy: true, quick: true })).status, 200);
    assert.equal((await ask({ quick: true, easy: true })).status, 200, 'object key order does not change the cache');
    assert.equal(calls, 1);
    assert.equal((await ask({ easy: true, quick: false })).status, 429, 'quick filter must be part of the cache key');
  } finally { await new Promise(resolve => server.close(resolve)); }
});

for (const invalidRecipe of [
  { ...fixtureRecipes[0], totalMinutes: 40 },
  { ...fixtureRecipes[0], difficulty: 'standard' },
  { ...fixtureRecipes[0], steps: Array(7).fill('Prepare.') },
]) {
  test(`proxy rejects an output violating cooking preferences (${invalidRecipe.totalMinutes} min, ${invalidRecipe.difficulty}, ${invalidRecipe.steps.length} steps)`, async () => {
    const recipes = [invalidRecipe, ...fixtureRecipes.slice(1)];
    const server = createRecipeServer({ key: 'test-only', fetchImpl: async () => Response.json({ choices: [{ message: { content: JSON.stringify({ recipes: upstreamRecipes(recipes) }) } }] }) });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/recipes`, { method: 'POST', body: JSON.stringify({ prompt: 'pasta', preferences: { easy: true, quick: true } }) });
      assert.equal(response.status, 502);
      assert.deepEqual(await response.json(), { error: 'invalid_response' });
    } finally { await new Promise(resolve => server.close(resolve)); }
  });
}

test('structured ingredient references become scalable step quantities; invalid references are rejected', () => {
  const output = upstreamRecipes(fixtureRecipes);
  assert.deepEqual(prepareRecipeOutput(output), fixtureRecipes);
  output[0].steps[1].quantities[0].ingredientIndex = 20;
  assert.equal(isRecipeBatch(prepareRecipeOutput(output)), false);
  output[0].steps[1].quantities[0] = { ingredientIndex: 0, fraction: -1 };
  assert.equal(isRecipeBatch(prepareRecipeOutput(output)), false);
  output[0].steps[1].quantities[0] = { ingredientIndex: 0, fraction: 0.5 };
  const recipe = prepareRecipeOutput(output)[0];
  assert.equal(formatStep(recipe.steps[1], recipe.ingredients, 2, 'en'), 'Add pasta.\npasta: 80 g');
  output[0].steps[1].instruction = 'Add 100 g pasta.';
  assert.equal(isRecipeBatch(prepareRecipeOutput(output)), false);
});

test('a stale two-recipe response is rejected rather than cached as a complete batch', async () => {
  const server = createRecipeServer({ key: 'test-only', fetchImpl: async () => Response.json({ choices: [{ message: { content: JSON.stringify({ recipes: upstreamRecipes(fixtureRecipes.slice(0, 2)) }) } }] }) });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/recipes`, { method: 'POST', body: JSON.stringify({ prompt: 'pasta' }) });
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: 'invalid_response' });
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
