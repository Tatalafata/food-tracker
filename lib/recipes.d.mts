export interface Recipe {
  name: string;
  description: string;
  ingredients: { name: string; amount: number | null; unit: string }[];
  steps: string[];
}
export function isRecipe(value: unknown): value is Recipe;
export const RECIPE_COUNT: 5;
export function isRecipeBatch(value: unknown): value is Recipe[];
export function scaledAmount(amount: number | null, servings: number): number | null;
export function formatStep(step: string, ingredients: Recipe['ingredients'], servings: number, language: string): string;
export function normalizeStepShares(recipe: Recipe): Recipe;
