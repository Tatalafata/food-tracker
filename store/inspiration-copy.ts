export const inspirationCopy = {
  it: {
    search: 'Cerca una ricetta', clear: 'Svuota la ricerca', example: 'Es. tiramisù, risotto',
    recipe: 'ricetta', recipes: 'ricette', empty: 'Nessuna ricetta trovata. Prova un altro nome o cambia i filtri.',
    failed: 'Impossibile aprire il sito.', filters: 'Filtri', reset: 'Azzera filtri', show: (count: string) => 'Mostra ' + count,
    type: 'Tipo di piatto', savory: 'Salate', sweet: 'Dolci', time: 'Tempo totale',
    limit: (minutes: number) => 'Entro ' + minutes + ' min', difficulty: 'Difficoltà', advanced: 'Avanzata',
    diets: 'Preferenze alimentari', dietHint: 'Si basano sulle categorie delle ricette. In caso di allergie, controlla gli ingredienti.',
    onlyPhotos: 'Solo con foto', credits: 'Crediti fotografici', photoError: 'Impossibile aprire i crediti.',
  },
  en: {
    search: 'Search recipes', clear: 'Clear search', example: 'E.g. apple pie',
    recipe: 'recipe', recipes: 'recipes', empty: 'No recipes found. Try a different name or change the filters.',
    failed: 'Could not open the website.', filters: 'Filters', reset: 'Reset filters', show: (count: string) => 'Show ' + count,
    type: 'Dish type', savory: 'Savory', sweet: 'Sweet', time: 'Total time',
    limit: (minutes: number) => 'Up to ' + minutes + ' min', difficulty: 'Difficulty', advanced: 'Advanced',
    diets: 'Dietary preferences', dietHint: 'Based on recipe categories. If you have an allergy, check the ingredients.',
    onlyPhotos: 'With photos only', credits: 'Photo credits', photoError: 'Could not open the credits.',
  },
  fr: {
    search: 'Rechercher une recette', clear: 'Effacer la recherche', example: 'Ex. tiramisu, risotto',
    recipe: 'recette', recipes: 'recettes', empty: 'Aucune recette trouvée. Essayez un autre nom ou modifiez les filtres.',
    failed: 'Impossible d’ouvrir le site.', filters: 'Filtres', reset: 'Réinitialiser', show: (count: string) => 'Afficher ' + count,
    type: 'Type de plat', savory: 'Salé', sweet: 'Sucré', time: 'Temps total',
    limit: (minutes: number) => 'Max. ' + minutes + ' min', difficulty: 'Difficulté', advanced: 'Avancée',
    diets: 'Préférences alimentaires', dietHint: 'Selon les catégories des recettes. En cas d’allergie, vérifiez les ingrédients.',
    onlyPhotos: 'Avec photo seulement', credits: 'Crédits photo', photoError: 'Impossible d’ouvrir les crédits.',
  },
  de: {
    search: 'Rezept suchen', clear: 'Suche leeren', example: 'Z. B. Tiramisu',
    recipe: 'Rezept', recipes: 'Rezepte', empty: 'Keine Rezepte gefunden. Probiere einen anderen Namen oder ändere die Filter.',
    failed: 'Die Seite konnte nicht geöffnet werden.', filters: 'Filter', reset: 'Filter zurücksetzen', show: (count: string) => count + ' anzeigen',
    type: 'Gerichtstyp', savory: 'Herzhaft', sweet: 'Süß', time: 'Gesamtzeit',
    limit: (minutes: number) => 'Bis ' + minutes + ' Min.', difficulty: 'Schwierigkeit', advanced: 'Anspruchsvoll',
    diets: 'Ernährungsvorlieben', dietHint: 'Nach Rezeptkategorien. Prüfe bei Allergien die Zutaten.',
    onlyPhotos: 'Nur mit Foto', credits: 'Bildnachweise', photoError: 'Die Bildnachweise konnten nicht geöffnet werden.',
  },
};

export function formatInspirationCount(language: keyof typeof inspirationCopy, count: number) {
  const copy = inspirationCopy[language];
  return new Intl.NumberFormat(language).format(count) + ' ' + (count === 1 ? copy.recipe : copy.recipes);
}
