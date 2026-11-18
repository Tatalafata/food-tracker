import type { Language } from '@/store/i18n';

export const recipeNotesCopy: Record<Language, { tab: string; title: string; placeholder: string; empty: string; readError: string }> = {
  it: {
    tab: 'Note', title: 'Note personali', placeholder: 'Es. Cuocere 5 minuti in meno',
    empty: 'Scrivi una nota in una ricetta per ritrovarla qui.', readError: 'Non è stato possibile leggere le tue note.',
  },
  en: {
    tab: 'Notes', title: 'Personal notes', placeholder: 'E.g. Bake for 5 minutes less',
    empty: 'Write a note on a recipe to find it here.', readError: 'Could not load your notes.',
  },
  fr: {
    tab: 'Notes', title: 'Notes personnelles', placeholder: 'Ex. Réduire la cuisson de 5 minutes',
    empty: 'Ajoutez une note à une recette pour la retrouver ici.', readError: 'Impossible de charger vos notes.',
  },
  de: {
    tab: 'Notizen', title: 'Persönliche Notizen', placeholder: 'Z. B. 5 Minuten kürzer backen',
    empty: 'Schreibe eine Notiz zu einem Rezept, um es hier wiederzufinden.', readError: 'Deine Notizen konnten nicht geladen werden.',
  },
};
