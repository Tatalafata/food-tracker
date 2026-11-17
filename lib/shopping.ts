import { scaledAmount, type Recipe } from '@/lib/recipes.mjs';

export interface ShoppingEntry {
  name: string;
  quantity: string;
}

function normalizeIngredient(name: string) {
  return name.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '')
    .replace(/œ/g, 'oe').replace(/ß/g, 'ss').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

// Only group names for the same ingredient. A sauce, substitute or dried
// ingredient should not be mistaken for a fresh ingredient with a similar name.
const equivalents = [
  'pomodoro|pomodori|pomodoro fresco|pomodori freschi|tomato|tomatoes|fresh tomatoes|tomate|tomates|frische tomaten',
  'basilico|basilico fresco|basil|fresh basil|basilic|basilic frais|basilikum|frisches basilikum',
  'mozzarella|mozzarella fresca|fresh mozzarella|mozzarella fraîche|frischer mozzarella',
  'olio extravergine d’oliva|olio extravergine di oliva|olio extra vergine di oliva|olio evo|extra virgin olive oil|huile d’olive vierge extra|natives olivenöl extra',
  'aceto balsamico|balsamic vinegar|vinaigre balsamique|balsamico essig',
  'aglio|spicchio d’aglio|spicchi d’aglio|garlic|garlic clove|garlic cloves|ail|gousse d’ail|gousses d’ail|knoblauch|knoblauchzehe|knoblauchzehen',
  'uovo|uova|egg|eggs|free range eggs|œuf|œufs|ei|eier',
  'latte|latte vaccino|latte intero|milk|whole milk|cow milk|lait|lait entier|milch|vollmilch',
  'burro|butter|beurre',
  'sale|sale fino|salt|table salt|sel|sel fin|salz',
  'pepe nero|black pepper|poivre noir|schwarzer pfeffer',
  'prezzemolo|prezzemolo fresco|parsley|fresh parsley|persil|persil frais|petersilie',
  'ceci cotti|ceci in scatola|cooked chickpeas|canned chickpeas|pois chiches cuits|gekochte kichererbsen',
  'limone|limoni|lemon|lemons|citron|citrons|zitrone|zitronen',
  'succo di limone|lemon juice|jus de citron|zitronensaft',
  'mela|mele|apple|apples|pomme|pommes|apfel|äpfel',
  'cipolla|cipolle|onion|onions|oignon|oignons|zwiebel|zwiebeln',
  'carota|carote|carrot|carrots|carotte|carottes|karotte|karotten',
  'patata|patate|potato|potatoes|pomme de terre|pommes de terre|kartoffel|kartoffeln',
  'zucchina|zucchine|zucchini|courgette|courgettes',
  'melanzana|melanzane|eggplant|eggplants|aubergine|aubergines',
  'petto di pollo|petti di pollo|chicken breast|chicken breasts|blanc de poulet|blancs de poulet|hähnchenbrust',
  'filetto di salmone|filetti di salmone|salmon fillet|salmon fillets|filet de saumon|filets de saumon|lachsfilet',
  'avocado|avocado maturo|avocados|ripe avocado|avocat|avocats|avocat mûr|reife avocado',
  'cannella|cannella in polvere|cinnamon|ground cinnamon|cannelle|zimt',
];

const aliases = new Map(equivalents.flatMap(group => {
  const names = group.split('|').map(normalizeIngredient);
  return names.map(name => [name, names[0]] as const);
}));

export function ingredientKey(name: string) {
  const normalized = normalizeIngredient(name);
  return aliases.get(normalized) ?? normalized;
}

export function missingIngredients(
  ingredients: Recipe['ingredients'],
  pantryNames: readonly string[],
  servings: number,
  language: string,
  toTaste: string,
): ShoppingEntry[] {
  const available = new Set(pantryNames.map(ingredientKey));
  // Tap water is normally available and isn't an item to buy.
  const water = new Set(['acqua', 'water', 'eau', 'wasser', 'acqua del rubinetto', 'tap water', 'eau du robinet', 'leitungswasser']);
  const format = new Intl.NumberFormat(language, { maximumFractionDigits: 3 });
  const missing: ShoppingEntry[] = [];
  for (const ingredient of ingredients) {
    const key = ingredientKey(ingredient.name);
    if (!key || available.has(key) || water.has(key)) continue;
    available.add(key);
    const amount = scaledAmount(ingredient.amount, servings);
    const quantity = amount === null ? toTaste : [format.format(amount), ingredient.unit].filter(Boolean).join(' ');
    missing.push({ name: ingredient.name.trim(), quantity });
  }
  return missing;
}
