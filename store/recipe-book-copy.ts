import type { Language } from '@/store/i18n';

interface RecipeBookCopy {
  title: string;
  back: string;
  favorites: string;
  history: string;
  inspiration: string;
  searches: string;
  cooked: string;
  addFavorite: string;
  removeFavorite: string;
  markCooked: string;
  emptyFavorites: string;
  emptyHistory: string;
  emptyCooked: string;
  all: string;
  savory: string;
  sweet: string;
  vegan: string;
  source: string;
  readError: string;
  historySaveError: string;
}

export const recipeBookCopy: Record<Language, RecipeBookCopy> = {
  it: {
    title: 'Ricettario', back: 'Torna alle ricette', favorites: 'Preferiti', history: 'Cronologia',
    inspiration: 'Ispirazione', searches: 'Ricerche', cooked: 'Cucinate', addFavorite: 'Aggiungi ai preferiti',
    removeFavorite: 'Rimuovi dai preferiti', markCooked: 'L’ho cucinata',
    emptyFavorites: 'Tocca la stella in una ricetta per ritrovarla qui.',
    emptyHistory: 'Le ricette che generi compariranno qui, raggruppate per ricerca.',
    emptyCooked: 'Tocca «L’ho cucinata» in una ricetta per ritrovarla qui.',
    all: 'Tutte', savory: 'Salate', sweet: 'Dolci', vegan: 'Vegane', source: 'Adattata da Wikibooks',
    readError: 'Non è stato possibile caricare il ricettario.',
    historySaveError: 'Le ricette sono pronte, ma non è stato possibile salvarle nella cronologia.',
  },
  en: {
    title: 'Recipe book', back: 'Back to recipes', favorites: 'Favorites', history: 'History',
    inspiration: 'Inspiration', searches: 'Searches', cooked: 'Cooked', addFavorite: 'Add to favorites',
    removeFavorite: 'Remove from favorites', markCooked: 'I cooked this',
    emptyFavorites: 'Tap the star on a recipe to find it here.',
    emptyHistory: 'The recipes you generate will appear here, grouped by search.',
    emptyCooked: 'Tap “I cooked this” in a recipe to find it here.',
    all: 'All', savory: 'Savory', sweet: 'Sweet', vegan: 'Vegan', source: 'Adapted from Wikibooks',
    readError: 'Could not load the recipe book.',
    historySaveError: 'Your recipes are ready, but they could not be saved to history.',
  },
  fr: {
    title: 'Livre de recettes', back: 'Retour aux recettes', favorites: 'Favoris', history: 'Historique',
    inspiration: 'Inspiration', searches: 'Recherches', cooked: 'Cuisinées', addFavorite: 'Ajouter aux favoris',
    removeFavorite: 'Retirer des favoris', markCooked: 'Je l’ai cuisinée',
    emptyFavorites: 'Touchez l’étoile d’une recette pour la retrouver ici.',
    emptyHistory: 'Les recettes générées apparaîtront ici, regroupées par recherche.',
    emptyCooked: 'Touchez « Je l’ai cuisinée » pour retrouver la recette ici.',
    all: 'Toutes', savory: 'Salées', sweet: 'Sucrées', vegan: 'Véganes', source: 'Adaptée de Wikilivres (Wikibooks)',
    readError: 'Impossible de charger le livre de recettes.',
    historySaveError: 'Les recettes sont prêtes, mais elles n’ont pas pu être enregistrées dans l’historique.',
  },
  de: {
    title: 'Rezeptbuch', back: 'Zurück zu den Rezepten', favorites: 'Favoriten', history: 'Verlauf',
    inspiration: 'Inspiration', searches: 'Suchen', cooked: 'Gekocht', addFavorite: 'Zu Favoriten hinzufügen',
    removeFavorite: 'Aus Favoriten entfernen', markCooked: 'Habe ich gekocht',
    emptyFavorites: 'Tippe auf den Stern bei einem Rezept, um es hier wiederzufinden.',
    emptyHistory: 'Erstellte Rezepte erscheinen hier, nach Suche gruppiert.',
    emptyCooked: 'Tippe auf „Habe ich gekocht“, um das Rezept hier wiederzufinden.',
    all: 'Alle', savory: 'Herzhaft', sweet: 'Süß', vegan: 'Vegan', source: 'Angepasst aus Wikibooks',
    readError: 'Das Rezeptbuch konnte nicht geladen werden.',
    historySaveError: 'Die Rezepte sind fertig, konnten aber nicht im Verlauf gespeichert werden.',
  },
};
