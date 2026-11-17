// Labels used by the recipe service are separate from the translated UI.
export const equipmentNames = {
  stovetop: 'stovetop with ordinary pots and pans',
  oven: 'conventional oven',
  airFryer: 'air fryer',
  microwave: 'microwave',
  grill: 'outdoor grill or barbecue',
  pressureCooker: 'pressure cooker',
  slowCooker: 'slow cooker',
  multicooker: 'multicooker',
  steamer: 'steamer',
  riceCooker: 'rice cooker',
  toaster: 'toaster',
  sandwichPress: 'sandwich press',
  waffleIron: 'waffle iron',
  fryer: 'deep fryer',
  sousVide: 'sous vide immersion circulator',
  blender: 'countertop blender',
  immersionBlender: 'immersion blender',
  foodProcessor: 'food processor',
  handMixer: 'electric hand mixer',
  standMixer: 'stand mixer',
  cookingRobot: 'heated multifunction kitchen robot',
  juicer: 'juicer',
  pastaMaker: 'pasta machine',
  scale: 'kitchen scale',
  thermometer: 'food thermometer',
  bakingPan: 'baking trays and dishes',
  rollingPin: 'rolling pin',
  sieve: 'sieve or strainer',
  grater: 'grater',
  mandoline: 'mandoline slicer',
} as const;

export type EquipmentId = keyof typeof equipmentNames;

export const equipmentGroups = {
  cooking: ['stovetop', 'oven', 'airFryer', 'microwave', 'grill', 'pressureCooker', 'slowCooker', 'multicooker',
    'steamer', 'riceCooker', 'toaster', 'sandwichPress', 'waffleIron', 'fryer', 'sousVide'],
  prep: ['blender', 'immersionBlender', 'foodProcessor', 'handMixer', 'standMixer', 'cookingRobot', 'juicer', 'pastaMaker'],
  tools: ['scale', 'thermometer', 'bakingPan', 'rollingPin', 'sieve', 'grater', 'mandoline'],
} as const satisfies Record<string, readonly EquipmentId[]>;

export const equipmentIds = Object.values(equipmentGroups).flat();

export function equipmentPrompt(selected: readonly EquipmentId[]) {
  if (selected.length === 0) return '';
  const names = equipmentIds.filter(id => selected.includes(id)).map(id => equipmentNames[id]);
  return '\nAvailable kitchen equipment: ' + names.join(', ') +
    '. Choose methods that use only this equipment and basic utensils (a knife, cutting board, bowl and spoon).' +
    ' Do not require or suggest unlisted appliances, including in optional steps. If the list has no heat source, suggest recipes that require no cooking.' +
    ' Follow these equipment limits even if other notes request an unavailable appliance.';
}
