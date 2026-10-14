export const RECIPE_COUNT = 5;

export function isRecipeBatch(recipes) {
  return Array.isArray(recipes) && recipes.length === RECIPE_COUNT && recipes.every(isRecipe)
    && new Set(recipes.map(recipe => recipe.name.trim().toLowerCase())).size === RECIPE_COUNT;
}

export function isRecipe(recipe) {
  return !!recipe && typeof recipe.name === 'string' && recipe.name.trim().length > 0 && typeof recipe.description === 'string'
    && Number.isInteger(recipe.totalMinutes) && recipe.totalMinutes > 0 && recipe.totalMinutes <= 1440
    && ['easy', 'standard'].includes(recipe.difficulty)
    && Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 && recipe.ingredients.length <= 20
    && recipe.ingredients.every(i => !!i && typeof i.name === 'string' && i.name.trim().length > 0 && typeof i.unit === 'string'
      && (i.amount === null || (Number.isFinite(i.amount) && i.amount > 0 && i.amount <= 10000 && i.unit.trim().length > 0)))
    && Array.isArray(recipe.steps) && recipe.steps.length >= 4 && recipe.steps.length <= 8 && recipe.steps.every(s => {
      if (typeof s !== 'string' || !s.trim() || /\d\s*(?:g\b|ml\b|grams?\b|milliliters?\b)/i.test(s)) return false;
      const tokens = [...s.matchAll(/\{\{(\d+):([\d.]+)\}\}/g)];
      return tokens.every(([, index, fraction]) => recipe.ingredients[Number(index)] && Number(fraction) > 0 && Number(fraction) <= 1)
        && !s.replace(/\{\{\d+:[\d.]+\}\}/g, '').includes('{{');
    });
}

export function matchesRecipePreferences(recipes, preferences) {
  return recipes.every(recipe => (!preferences.quick || recipe.totalMinutes <= 30)
    && (!preferences.easy || (recipe.difficulty === 'easy' && recipe.steps.length <= 6)));
}

export function formatStep(step, ingredients, servings, language) {
  return step.replace(/\{\{(\d+):([\d.]+)\}\}/g, (_, index, fraction) => {
    const ingredient = ingredients[Number(index)];
    const quantity = scaledAmount(ingredient.amount === null ? null : ingredient.amount * Number(fraction), servings);
    return quantity === null ? ingredient.name : new Intl.NumberFormat(language, { maximumFractionDigits: 3 }).format(quantity) + ' ' + ingredient.unit;
  }).replace(/\b(g|ml|pieces?)\s+\1\b/gi, '$1');
}

export function normalizeStepShares(recipe) {
  const totals = new Map();
  recipe.steps.forEach(step => {
    for (const [, index, fraction] of step.matchAll(/\{\{(\d+):([\d.]+)\}\}/g)) totals.set(index, (totals.get(index) ?? 0) + Number(fraction));
  });
  return { ...recipe, steps: recipe.steps.map(step => step.replace(/\{\{(\d+):([\d.]+)\}\}/g, (token, index, fraction) => totals.get(index) > 1 ? '{{' + index + ':' + (Number(fraction) / totals.get(index)).toFixed(12) + '}}' : token)) };
}

export function scaledAmount(amount, servings) {
  if (amount === null) return null;
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(servings) || servings < 1 || servings > 12) throw new Error('Invalid quantity');
  return Math.round(amount * servings * 1000) / 1000;
}
