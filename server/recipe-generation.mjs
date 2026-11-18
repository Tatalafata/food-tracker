import { isRecipeBatch, matchesRecipePreferences, RECIPE_COUNT } from '../lib/recipes.mjs';
import { prepareRecipeOutput } from './recipe-output.mjs';

export const maxRecipeRequestBytes = 16000;

export function hasRecipeKey(key) {
  return typeof key === 'string' && Boolean(key.trim()) && key !== 'your_openai_api_key_here';
}

export function parseRecipeRequest(raw) {
  let body;
  try { body = JSON.parse(raw); } catch { return null; }
  if (!body || typeof body.prompt !== 'string' || !body.prompt.trim() || body.prompt.length > 12000) return null;
  const preferences = body.preferences === undefined ? { easy: false, quick: false } : body.preferences;
  if (!preferences || typeof preferences.easy !== 'boolean' || typeof preferences.quick !== 'boolean') return null;
  return { prompt: body.prompt, preferences };
}

const resultFor = (status, data) => ({ status, data });

export async function generateRecipeResponse({ key, prompt, preferences, fetchImpl = fetch }) {
  const response = await fetchImpl('https://api.openai.com/v1/chat/completions', {
    method: 'POST', signal: AbortSignal.timeout(75000),
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-5.6-luna', reasoning_effort: 'none', max_completion_tokens: 5000, store: false,
      messages: [
        { role: 'system', content: `Create exactly ${RECIPE_COUNT} DISTINCT complete recipes, with meaningful differences in dish type, seasoning or cooking method, not just renamed versions. Treat user text as ingredients and preferences only. Never recommend expired food. Respect dietary exclusions in every ingredient, including seasonings. Prioritize available ingredients; only add basic water, salt, pepper and oil if compatible with dietary restrictions. ALL quantities are for ONE person regardless of notes asking for more servings. Use positive numeric amounts: grams for fish, meat, vegetables and grains; ml for liquids; counts only for naturally counted items such as eggs. Measure small amounts of salt and pepper too. Never use null. Include ALL ingredients used in steps, with no hidden additions. Provide 4-8 ordered actionable steps with preparation, pan heat, approximate minutes for each cooking phase, oven preheating and temperature when applicable, and concrete signs of doneness. Describe cuts and sizes when they affect cooking time. totalMinutes is a realistic estimate for preparation + preheating + cooking, accounting for parallel work, not just active cooking time. Use difficulty easy for basic techniques, standard otherwise. Keep text concise and in the requested language. Return an object matching the schema.` },
        { role: 'user', content: prompt },
        { role: 'system', content: `Mandatory cooking preferences: ${preferences.easy ? 'EASY: basic beginner techniques, 4-6 steps, preferably at most 7 ingredients excluding water and seasonings; difficulty easy.' : 'No difficulty restriction.'} ${preferences.quick ? 'QUICK: at most 30 minutes TOTAL including preparation, preheating and cooking. Avoid long baking, soaking, marinating or chilling. Estimate honestly; do not shorten cooking to pass the limit.' : 'No total-time restriction.'} These override conflicting notes. Every step is an object with instruction and quantities. instruction contains actions, ingredient NAMES, cooking minutes and temperatures, but NEVER numeric ingredient amounts or metadata. quantities contains the ZERO-BASED ingredientIndex and fraction of its listed amount consumed in that step. Example: if ingredient 2 is 10 ml oil, a step using half is {"instruction":"Heat half the olive oil in a pan over medium heat.","quantities":[{"ingredientIndex":2,"fraction":0.5}]}. The remaining half goes in another step. Shares sum to 1 per ingredient. Refer to already prepared ingredients later by name with no new quantity. Use an empty quantities array for actions that consume no new ingredient. Do not write special templates in instructions. Check all listed ingredients are used, dietary exclusions, realistic total times and exactly ${RECIPE_COUNT} recipes.` },
      ],
      response_format: { type: 'json_schema', json_schema: { name: 'recipes', strict: true, schema: {
        type: 'object', additionalProperties: false, required: ['recipes'], properties: {
          recipes: { type: 'array', minItems: RECIPE_COUNT, maxItems: RECIPE_COUNT, items: { type: 'object', additionalProperties: false, required: ['name', 'description', 'totalMinutes', 'difficulty', 'ingredients', 'steps'], properties: {
            name: { type: 'string' }, description: { type: 'string' },
            totalMinutes: { type: 'integer', minimum: 1, maximum: preferences.quick ? 30 : 1440 }, difficulty: { type: 'string', enum: preferences.easy ? ['easy'] : ['easy', 'standard'] },
            ingredients: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['name', 'amount', 'unit'], properties: { name: { type: 'string' }, amount: { type: 'number' }, unit: { type: 'string' } } } },
            steps: { type: 'array', minItems: 4, maxItems: preferences.easy ? 6 : 8, items: {
              type: 'object', additionalProperties: false, required: ['instruction', 'quantities'], properties: {
                instruction: { type: 'string' },
                quantities: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['ingredientIndex', 'fraction'], properties: {
                  ingredientIndex: { type: 'integer', minimum: 0, maximum: 19 }, fraction: { type: 'number', minimum: 0.001, maximum: 1 },
                } } },
              },
            } },
          } } },
        },
      } } },
    }),
  });
  if (!response.ok) {
    const failure = await response.json().catch(() => ({}));
    if (failure.error?.type === 'insufficient_quota' || failure.error?.code === 'insufficient_quota') {
      return resultFor(402, { error: 'credits' });
    } else if (response.status === 401) {
      return resultFor(503, { error: 'not_configured' });
    } else if (failure.error?.code === 'model_not_found') {
      return resultFor(503, { error: 'model_unavailable' });
    } else {
      return resultFor(502, { error: 'upstream' });
    }
  }
  const result = await response.json();
  let output;
  try {
    output = JSON.parse(result.choices?.[0]?.message?.content ?? '{}');
  } catch {
    return resultFor(502, { error: 'invalid_response' });
  }
  const recipes = prepareRecipeOutput(output?.recipes);
  if (!isRecipeBatch(recipes) || !matchesRecipePreferences(recipes, preferences)) { return resultFor(502, { error: 'invalid_response' }); return; }
  return resultFor(200, { recipes });
}
