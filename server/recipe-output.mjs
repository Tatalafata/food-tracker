// The model supplies quantity references as structured data. Only the server
// creates the templates used by the app, so portion scaling does not depend on
// the model writing special punctuation correctly inside natural language.
export function prepareRecipeOutput(recipes) {
  if (!Array.isArray(recipes)) return null;
  return recipes.map(recipe => {
    if (!recipe || !Array.isArray(recipe.ingredients) || !Array.isArray(recipe.steps)) return null;
    const steps = recipe.steps.map(step => {
      if (!step || typeof step.instruction !== 'string' || !Array.isArray(step.quantities) || step.instruction.includes('{{')) return null;
      const quantities = step.quantities.map(quantity => {
        if (!quantity || !Number.isInteger(quantity.ingredientIndex) || quantity.ingredientIndex < 0
          || !recipe.ingredients[quantity.ingredientIndex] || !Number.isFinite(quantity.fraction) || quantity.fraction <= 0 || quantity.fraction > 1) return null;
        return `${recipe.ingredients[quantity.ingredientIndex].name}: {{${quantity.ingredientIndex}:${quantity.fraction}}}`;
      });
      if (quantities.includes(null)) return null;
      return step.instruction + (quantities.length ? '\n' + quantities.join(' · ') : '');
    });
    return { ...recipe, steps };
  });
}
