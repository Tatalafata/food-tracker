import type { Recipe } from '@/lib/recipes.mjs';
import type { Language } from '@/store/i18n';

// Recipe adaptations, including translations and metric quantities per serving,
// are licensed CC BY-SA 4.0. The linked Wikibooks pages credit their contributors.
// https://creativecommons.org/licenses/by-sa/4.0/
type Localized = readonly [it: string, en: string, fr: string, de: string];
type Ingredient = readonly [name: Localized, amount: number, unit: 'g' | 'ml' | 'piece'];
export type InspirationFilter = 'all' | 'savory' | 'sweet' | 'vegan';

interface CatalogEntry {
  page: string;
  kind: 'savory' | 'sweet';
  vegan?: boolean;
  minutes: number;
  name: Localized;
  description: Localized;
  ingredients: Ingredient[];
  steps: Localized[];
}

const oil = ['Olio extravergine d’oliva', 'Extra virgin olive oil', 'Huile d’olive vierge extra', 'Natives Olivenöl extra'] as const;
const garlic = ['Aglio', 'Garlic', 'Ail', 'Knoblauch'] as const;
const salt = ['Sale', 'Salt', 'Sel', 'Salz'] as const;
const lemon = ['Succo di limone', 'Lemon juice', 'Jus de citron', 'Zitronensaft'] as const;
const flour = ['Farina', 'Flour', 'Farine', 'Mehl'] as const;
const butter = ['Burro', 'Butter', 'Beurre', 'Butter'] as const;
const milk = ['Latte', 'Milk', 'Lait', 'Milch'] as const;
const eggs = ['Uovo', 'Egg', 'Œuf', 'Ei'] as const;
const cinnamon = ['Cannella', 'Cinnamon', 'Cannelle', 'Zimt'] as const;
const sugar = ['Zucchero di canna', 'Brown sugar', 'Sucre roux', 'Brauner Zucker'] as const;
const pepper = ['Pepe nero', 'Black pepper', 'Poivre noir', 'Schwarzer Pfeffer'] as const;

const catalog: CatalogEntry[] = [
  {
    page: 'Spaghetti_Aglio_e_Olio', kind: 'savory', vegan: true, minutes: 20,
    name: ['Spaghetti aglio e olio', 'Garlic and olive oil spaghetti', 'Spaghetti à l’ail et à l’huile', 'Spaghetti mit Knoblauch und Olivenöl'],
    description: ['Aglio dorato, peperoncino e prezzemolo fresco.', 'Golden garlic, chilli and fresh parsley.', 'Ail doré, piment et persil frais.', 'Goldener Knoblauch, Chili und frische Petersilie.'],
    ingredients: [[['Spaghetti di semola', 'Durum wheat spaghetti', 'Spaghettis de blé dur', 'Hartweizen-Spaghetti'], 90, 'g'], [oil, 20, 'ml'], [garlic, 5, 'g'],
      [['Peperoncino secco', 'Dried chilli', 'Piment séché', 'Getrocknete Chili'], 0.5, 'g'],
      [['Prezzemolo', 'Parsley', 'Persil', 'Petersilie'], 4, 'g'], [salt, 3, 'g']],
    steps: [
      ['Cuoci la pasta in acqua salata fino a lasciarla al dente.', 'Boil the pasta in salted water until just firm.', 'Cuisez les pâtes dans de l’eau salée en les gardant al dente.', 'Koche die Nudeln in Salzwasser bissfest.'],
      ['Affetta l’aglio e scaldalo a fuoco dolce nell’olio con il peperoncino.', 'Slice the garlic and warm it gently in the oil with the chilli.', 'Émincez l’ail et chauffez-le doucement dans l’huile avec le piment.', 'Schneide den Knoblauch und erwärme ihn mit Chili sanft im Öl.'],
      ['Scola gli spaghetti quando l’aglio è dorato. Saltali in padella con un po’ della loro acqua.', 'Drain when the garlic is golden. Toss the pasta with the oil and a splash of cooking water.', 'Égouttez les pâtes lorsque l’ail est doré. Mélangez-les à l’huile avec un peu d’eau de cuisson.', 'Gieße die Nudeln ab, sobald der Knoblauch goldgelb ist. Schwenke sie mit einem Schuss Kochwasser im Öl.'],
      ['Completa con il prezzemolo tritato e servi caldo.', 'Finish with chopped parsley and serve warm.', 'Ajoutez le persil haché et servez chaud.', 'Bestreue die Nudeln mit gehackter Petersilie und serviere sie warm.'],
    ],
  },
  {
    page: 'Hummus_(Greek)', kind: 'savory', vegan: true, minutes: 12,
    name: ['Hummus di ceci', 'Chickpea hummus', 'Houmous de pois chiches', 'Kichererbsen-Hummus'],
    description: ['Crema di ceci con tahina e limone.', 'A creamy chickpea dip with tahini and lemon.', 'Une crème de pois chiches au tahini et au citron.', 'Cremiger Kichererbsen-Dip mit Tahin und Zitrone.'],
    ingredients: [[['Ceci cotti', 'Cooked chickpeas', 'Pois chiches cuits', 'Gekochte Kichererbsen'], 130, 'g'],
      [['Tahina', 'Tahini', 'Tahini', 'Tahin'], 18, 'g'], [lemon, 15, 'ml'], [oil, 10, 'ml'],
      [['Acqua', 'Water', 'Eau', 'Wasser'], 25, 'ml'], [salt, 1, 'g']],
    steps: [
      ['Scola i ceci e versali nel bicchiere del frullatore.', 'Drain the chickpeas and transfer them to a blender.', 'Égouttez les pois chiches et versez-les dans le mixeur.', 'Gieße die Kichererbsen ab und gib sie in den Mixer.'],
      ['Unisci tahina, succo di limone e sale.', 'Add tahini, lemon juice and salt.', 'Ajoutez le tahini, le jus de citron et le sel.', 'Gib Tahin, Zitronensaft und Salz dazu.'],
      ['Frulla e versa l’acqua poco per volta, fino a ottenere una crema liscia.', 'Blend, adding the water gradually to get a smooth texture.', 'Mixez en ajoutant l’eau petit à petit jusqu’à obtenir une crème lisse.', 'Püriere alles und gib das Wasser nach und nach dazu, bis die Creme glatt ist.'],
      ['Metti la crema in una ciotola e condisci con l’olio.', 'Spoon into a bowl and finish with the oil.', 'Servez dans un bol avec un filet d’huile.', 'Fülle den Dip in eine Schale und gib das Öl darüber.'],
    ],
  },
  {
    page: 'Caprese_Salad', kind: 'savory', minutes: 10,
    name: ['Caprese al basilico', 'Basil caprese salad', 'Salade caprese au basilic', 'Caprese mit Basilikum'],
    description: ['Pomodori e mozzarella con basilico e balsamico.', 'Tomato and mozzarella with basil and balsamic vinegar.', 'Tomates et mozzarella au basilic et au balsamique.', 'Tomate und Mozzarella mit Basilikum und Balsamico.'],
    ingredients: [[['Pomodoro', 'Tomato', 'Tomate', 'Tomate'], 160, 'g'], [['Mozzarella', 'Mozzarella', 'Mozzarella', 'Mozzarella'], 120, 'g'],
      [['Basilico', 'Basil', 'Basilic', 'Basilikum'], 4, 'g'], [oil, 10, 'ml'],
      [['Aceto balsamico', 'Balsamic vinegar', 'Vinaigre balsamique', 'Balsamico-Essig'], 5, 'ml']],
    steps: [
      ['Lava il pomodoro e il basilico e asciugali.', 'Wash and dry the tomato and basil.', 'Lavez et séchez la tomate et le basilic.', 'Wasche und trockne Tomate und Basilikum.'],
      ['Scola la mozzarella e affettala con il pomodoro.', 'Drain the mozzarella and slice it along with the tomato.', 'Égouttez la mozzarella et coupez-la en tranches avec la tomate.', 'Lass den Mozzarella abtropfen und schneide ihn und die Tomate in Scheiben.'],
      ['Disponi le fette alternate sul piatto e aggiungi le foglie di basilico.', 'Alternate the slices on a plate and tuck in the basil leaves.', 'Alternez les tranches sur une assiette et ajoutez les feuilles de basilic.', 'Lege die Scheiben abwechselnd auf einen Teller und verteile die Basilikumblätter.'],
      ['Versa un filo d’olio e l’aceto, poi servi.', 'Drizzle with the oil and vinegar and serve.', 'Arrosez d’huile et de vinaigre et servez.', 'Beträufle den Salat mit Öl und Essig und serviere ihn.'],
    ],
  },
  {
    page: 'Crispy_Salmon', kind: 'savory', minutes: 40,
    name: ['Salmone croccante al limone', 'Crispy lemon salmon', 'Saumon croustillant au citron', 'Knuspriger Zitronenlachs'],
    description: ['Filetto al forno con panatura di panko.', 'Baked salmon coated in panko breadcrumbs.', 'Filet de saumon au four, pané au panko.', 'Gebackenes Lachsfilet mit Panko-Kruste.'],
    ingredients: [[['Filetto di salmone', 'Salmon fillet', 'Filet de saumon', 'Lachsfilet'], 170, 'g'],
      [['Panko', 'Panko', 'Panko', 'Panko'], 25, 'g'], [flour, 20, 'g'], [lemon, 20, 'ml'], [oil, 10, 'ml'], [salt, 1, 'g'], [pepper, 0.5, 'g']],
    steps: [
      ['Scalda il forno a 190 °C. Prepara tre piatti con farina, limone e panko. Condisci la farina con sale e pepe.', 'Heat the oven to 190°C. Set out flour, lemon juice and panko in separate dishes. Season the flour.', 'Préchauffez le four à 190 °C. Répartissez farine, citron et panko dans trois assiettes. Salez et poivrez la farine.', 'Heize den Ofen auf 190 °C vor. Stelle Mehl, Zitrone und Panko separat bereit. Würze das Mehl.'],
      ['Passa il filetto prima nella farina, poi nel limone e infine nel panko.', 'Dust the fillet in flour, dip it in lemon juice, then coat it with panko.', 'Passez le filet dans la farine, puis le citron et enfin le panko.', 'Wende das Filet erst im Mehl, dann im Zitronensaft und schließlich im Panko.'],
      ['Ungi il filetto e cuocilo su una teglia. Inizia a controllare dopo 18 minuti, fino a 63 °C al centro.', 'Brush the fillet with oil and bake. Start checking after 18 minutes and cook until the centre reaches 63°C.', 'Huilez le filet et enfournez-le. Vérifiez après 18 minutes et poursuivez jusqu’à 63 °C à cœur.', 'Bestreiche das Filet mit Öl und backe es. Prüfe nach 18 Minuten und gare es bis 63 °C Kerntemperatur.'],
      ['Gratina brevemente se vuoi più colore e porta subito in tavola.', 'Brown it briefly under the grill if desired and serve immediately.', 'Faites dorer brièvement sous le gril si besoin et servez aussitôt.', 'Bräune die Kruste bei Bedarf kurz unter dem Grill und serviere sofort.'],
    ],
  },
  {
    page: 'French_Toast', kind: 'sweet', minutes: 15,
    name: ['French toast alla cannella', 'Cinnamon French toast', 'Pain perdu à la cannelle', 'Arme Ritter mit Zimt'],
    description: ['Pane dorato in padella con latte, uovo e cannella.', 'Pan-toasted bread with milk, egg and cinnamon.', 'Pain doré à la poêle au lait, à l’œuf et à la cannelle.', 'In der Pfanne gebratenes Brot mit Milch, Ei und Zimt.'],
    ingredients: [[['Pane a fette', 'Sliced bread', 'Pain en tranches', 'Brot in Scheiben'], 70, 'g'],
      [eggs, 1, 'piece'], [milk, 45, 'ml'], [cinnamon, 0.5, 'g'], [butter, 8, 'g'], [sugar, 7, 'g']],
    steps: [
      ['Sbatti l’uovo con latte, cannella e zucchero in un piatto fondo.', 'Beat the egg with milk, cinnamon and sugar in a shallow bowl.', 'Battez l’œuf avec le lait, la cannelle et le sucre dans une assiette creuse.', 'Verquirle Ei, Milch, Zimt und Zucker in einem tiefen Teller.'],
      ['Sciogli il burro in padella a fuoco medio-basso.', 'Melt the butter in a skillet over medium-low heat.', 'Faites fondre le beurre dans une poêle à feu moyen-doux.', 'Schmelze die Butter bei mittlerer bis niedriger Hitze in einer Pfanne.'],
      ['Immergi il pane per pochi secondi su ciascun lato e trasferiscilo in padella.', 'Dip each side of the bread briefly and transfer it to the pan.', 'Trempez brièvement chaque face du pain et transférez-le dans la poêle.', 'Tauche jede Brotseite kurz in die Mischung und lege das Brot in die Pfanne.'],
      ['Gira le fette quando sono dorate. Finisci la cottura anche al centro e servi caldo.', 'Flip when golden. Cook through and serve warm.', 'Retournez les tranches une fois dorées. Laissez cuire à cœur et servez chaud.', 'Wende die Scheiben, sobald sie goldbraun sind. Gare sie durch und serviere warm.'],
    ],
  },
  {
    page: 'Banana_Pancakes', kind: 'sweet', minutes: 25,
    name: ['Pancake alla banana', 'Banana pancakes', 'Pancakes à la banane', 'Bananen-Pancakes'],
    description: ['Pancake morbidi con banana matura.', 'Soft pancakes made with ripe banana.', 'Des pancakes moelleux à la banane mûre.', 'Weiche Pancakes mit reifer Banane.'],
    ingredients: [[['Banana matura', 'Ripe banana', 'Banane mûre', 'Reife Banane'], 70, 'g'],
      [butter, 10, 'g'], [eggs, 0.5, 'piece'], [milk, 75, 'ml'],
      [['Farina autolievitante', 'Self-raising flour', 'Farine avec levure', 'Selbsttreibendes Mehl'], 60, 'g'], [sugar, 7, 'g'], [cinnamon, 0.5, 'g']],
    steps: [
      ['Schiaccia la banana. Unisci quasi tutto il burro fuso, l’uovo sbattuto e il latte.', 'Mash the banana. Stir in most of the melted butter, the beaten egg and the milk.', 'Écrasez la banane. Ajoutez la majeure partie du beurre fondu, l’œuf battu et le lait.', 'Zerdrücke die Banane. Rühre den Großteil der geschmolzenen Butter, das verquirlte Ei und die Milch ein.'],
      ['Mescola farina, zucchero e cannella. Versa il composto di banana e amalgama brevemente.', 'Mix the flour, sugar and cinnamon. Add the banana mixture and stir briefly.', 'Mélangez la farine, le sucre et la cannelle. Incorporez rapidement le mélange à la banane.', 'Mische Mehl, Zucker und Zimt. Gib die Bananenmischung dazu und rühre kurz um.'],
      ['Ungi una padella con il burro rimasto e versa piccole porzioni di impasto.', 'Use the remaining butter to grease a pan and spoon in small rounds of batter.', 'Graissez une poêle avec le reste du beurre et déposez de petites portions de pâte.', 'Fette eine Pfanne mit der restlichen Butter und gib kleine Teigportionen hinein.'],
      ['Cuoci a fuoco medio-basso. Gira i pancake quando compaiono bolle e cuoci fino a doratura.', 'Cook over medium-low heat. Flip when bubbles appear and cook until golden.', 'Cuisez à feu moyen-doux. Retournez quand des bulles apparaissent et poursuivez jusqu’à coloration dorée.', 'Brate sie bei mittlerer bis niedriger Hitze. Wende sie, wenn Blasen aufsteigen, und brate sie goldbraun.'],
    ],
  },
  {
    page: 'Fruit_Crumble', kind: 'sweet', minutes: 45,
    name: ['Crumble di mele', 'Apple crumble', 'Crumble aux pommes', 'Apfel-Crumble'],
    description: ['Mele al forno sotto briciole di farina e burro.', 'Baked apples with a buttery crumb topping.', 'Pommes au four sous une pâte sablée émiettée.', 'Gebackene Äpfel unter Butterstreuseln.'],
    ingredients: [[['Mela', 'Apple', 'Pomme', 'Apfel'], 160, 'g'], [flour, 35, 'g'], [butter, 18, 'g'], [sugar, 12, 'g']],
    steps: [
      ['Scalda il forno a 160 °C. Sbuccia la mela, togli il torsolo e tagliala a cubetti.', 'Heat the oven to 160°C. Peel, core and dice the apple.', 'Préchauffez le four à 160 °C. Pelez et épépinez la pomme, puis coupez-la en dés.', 'Heize den Ofen auf 160 °C vor. Schäle und entkerne den Apfel und würfle ihn.'],
      ['Metti i cubetti in una pirofila piccola e cospargili di zucchero.', 'Put the apple in a small baking dish and scatter the sugar over it.', 'Mettez les dés dans un petit plat et répartissez le sucre dessus.', 'Gib die Würfel in eine kleine Auflaufform und streue den Zucker darüber.'],
      ['Lavora il burro freddo con la farina usando le dita e copri la frutta con le briciole.', 'Rub the cold butter into the flour and spread the crumbs over the fruit.', 'Sablez le beurre froid avec la farine et répartissez les miettes sur les pommes.', 'Verreibe kalte Butter und Mehl mit den Fingern und verteile die Streusel auf dem Obst.'],
      ['Cuoci per circa 30 minuti, finché la mela è tenera, e lascia intiepidire.', 'Bake for about 30 minutes until the apple softens, then let it cool slightly.', 'Enfournez environ 30 minutes jusqu’à ce que la pomme soit tendre, puis laissez tiédir.', 'Backe etwa 30 Minuten, bis die Äpfel weich sind, und lass den Crumble kurz abkühlen.'],
    ],
  },
  {
    page: 'Chocolate_Mousse_(Vegan)', kind: 'sweet', vegan: true, minutes: 10,
    name: ['Mousse vegana al cacao', 'Vegan cocoa mousse', 'Mousse végane au cacao', 'Vegane Kakao-Mousse'],
    description: ['Dessert cremoso con avocado, cacao e agave.', 'A creamy dessert with avocado, cocoa and agave.', 'Dessert crémeux à l’avocat, au cacao et à l’agave.', 'Cremiges Dessert mit Avocado, Kakao und Agave.'],
    ingredients: [[['Avocado maturo', 'Ripe avocado', 'Avocat mûr', 'Reife Avocado'], 100, 'g'],
      [['Cacao amaro', 'Unsweetened cocoa powder', 'Cacao non sucré', 'Ungesüßter Kakao'], 10, 'g'],
      [['Sciroppo di agave', 'Agave syrup', 'Sirop d’agave', 'Agavendicksaft'], 15, 'g']],
    steps: [
      ['Apri l’avocado e preleva la polpa.', 'Halve the avocado and scoop out the flesh.', 'Coupez l’avocat et prélevez la chair.', 'Halbiere die Avocado und löse das Fruchtfleisch heraus.'],
      ['Riduci la polpa in crema con un frullatore.', 'Blend the flesh to a smooth cream.', 'Mixez la chair jusqu’à obtenir une crème lisse.', 'Püriere das Fruchtfleisch zu einer glatten Creme.'],
      ['Aggiungi cacao e sciroppo e frulla finché il colore è uniforme.', 'Add cocoa and syrup and blend until the colour is even.', 'Ajoutez le cacao et le sirop, puis mixez jusqu’à obtenir une couleur homogène.', 'Gib Kakao und Sirup dazu und püriere, bis die Farbe gleichmäßig ist.'],
      ['Versa in una coppetta e servi fresco.', 'Spoon into a small glass and serve cool.', 'Versez dans une verrine et servez frais.', 'Fülle die Mousse in ein kleines Glas und serviere sie kühl.'],
    ],
  },
];

const localeIndex = { it: 0, en: 1, fr: 2, de: 3 } as const;
const piece: Localized = ['pz', 'pcs', 'pièce(s)', 'Stk.'];

export function inspirationRecipes(language: Language, filter: InspirationFilter = 'all'): Recipe[] {
  const index = localeIndex[language];
  return catalog
    .filter(entry => filter === 'all' || (filter === 'vegan' ? entry.vegan : entry.kind === filter))
    .map(entry => ({
      wikiPage: entry.page,
      name: entry.name[index],
      description: entry.description[index],
      difficulty: 'easy',
      totalMinutes: entry.minutes,
      ingredients: entry.ingredients.map(([name, amount, unit]) => ({
        name: name[index], amount, unit: unit === 'piece' ? piece[index] : unit,
      })),
      steps: entry.steps.map(step => step[index]),
    }));
}
