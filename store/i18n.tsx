import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Language = 'en' | 'it' | 'fr' | 'de';

const LANGUAGE_KEY = '@freshtrack:language';

export interface Translations {
  // Tab labels
  tabHome: string;
  tabPantry: string;
  tabScan: string;
  tabCalendar: string;
  tabRecipes: string;
  tabSettings: string;
  // Shared
  cancel: string;
  save: string;
  saveError: string;
  productEdit: {
    title: string;
    open: (name: string) => string;
    barcode: string;
    notes: string;
    missing: string;
  };
  dietary: {
    defaults: string;
    defaultsHint: string;
    add: string;
    name: string;
    description: string;
    usage: string;
    loadError: string;
  };
  addProductNoExpiryHint: string;
  dateYear: string;
  dateMonth: string;
  dateDay: string;
  scannerSettings: string;
  recipesUnavailable: string;
  recipesNetworkError: string;
  recipesLimit: string;
  recipesCredits: string;
  recipesResultCount: (n: number) => string;
  recipeOpen: string;
  recipeClose: string;
  recipeIngredients: string;
  recipePreparation: string;
  recipeMore: string;
  recipeFewer: string;
  recipeToTaste: string;
  recipeScalingHint: string;
  recipeServings: (n: number) => string;
  // Home
  homeSubtitle: (n: number) => string;
  homeExpired: string;
  homeExpiringSoon: string;
  homeGood: string;
  homeNeedsAttention: string;
  homeAllGood: string;
  homeNothingExpiring: string;
  // Expiry labels (shared)
  labelExpiredAgo: (n: number) => string;
  labelExpiresToday: string;
  labelTomorrow: string;
  labelDaysLeft: (n: number) => string;
  labelDays: (n: number) => string;
  // Pantry
  pantryTitle: string;
  pantrySubtitle: (n: number) => string;
  pantryRemoveTitle: string;
  pantryRemoveConfirm: (name: string) => string;
  pantryRemove: string;
  pantryRemoveExpired: string;
  pantryRemoveExpiredConfirm: (n: number) => string;
  pantryEmptyTitle: string;
  pantryEmptyText: string;
  pantryBestBefore: string;
  // Scanner
  scannerTitle: string;
  scannerSubtitle: string;
  scannerCameraTitle: string;
  scannerCameraText: string;
  scannerGrantAccess: string;
  scannerLookingUp: string;
  scannerAlignHint: string;
  scannerConfirmTitle: string;
  scannerBarcodeLabel: string;
  scannerNameLabel: string;
  scannerNamePlaceholder: string;
  scannerExpiryLabel: string;
  scannerAddBtn: string;
  scannerScanAgain: string;
  scannerSuccess: (name: string) => string;
  scannerAutoFilled: string;
  scannerNotFound: string;
  scannerMissingName: string;
  scannerMissingNameMsg: string;
  scannerInvalidDate: string;
  scannerInvalidDateMsg: string;
  // Calendar
  calendarTitle: string;
  calendarSubtitle: string;
  calendarNothingOnDay: string;
  calendarLegendExpired: string;
  calendarLegendSoon: string;
  calendarLegendGood: string;
  calendarDayItems: (date: string, n: number) => string;
  calendarDayEmpty: (date: string) => string;
  // Recipes
  recipesTitle: string;
  recipesSubtitle: string;
  recipesIntro: string;
  recipesGetIdeas: string;
  recipesRefresh: string;
  recipesAsking: string;
  recipesNoResult: string;
  recipesKeyIngredients: string;
  recipesEmptyState: string;
  recipesApiKeyTitle: string;
  recipesApiKeyMsg: string;
  recipesEmptyPantryTitle: string;
  recipesEmptyPantryMsg: string;
  recipesErrorTitle: string;
  recipesExpiresIn: (n: number) => string;
  recipesExpiresToday: string;
  recipesExpired: string;
  // Custom recipe mode
  recipesModeQuick: string;
  recipesModeCustom: string;
  recipesPantrySection: string;
  recipesExtraSection: string;
  recipesExtraPlaceholder: string;
  recipesExtraAdd: string;
  recipesNotesSection: string;
  recipesNotesPlaceholder: string;
  recipesSelectAll: string;
  recipesDeselectAll: string;
  recipesNoPantryItems: string;
  recipesCustomEmptyState: string;
  recipesCustomNoIngredients: string;
  // Dietary labels
  recipesDietarySection: string;
  recipesCookingSection: string;
  recipesQualityError: string;
  recipesCookingHint: string;
  recipesEasyFilter: string;
  recipesQuickFilter: string;
  recipeEstimatedTime: (minutes: number) => string;
  recipeEasy: string;
  recipeStandard: string;
  dietLabels: {
    vegetarian: string;
    vegan: string;
    pescatarian: string;
    glutenFree: string;
    lactoseFree: string;
    dairyFree: string;
    eggFree: string;
    nutFree: string;
    lowCarb: string;
    keto: string;
    halal: string;
    kosher: string;
  };
  // Onboarding
  onboardingTitle: string;
  onboardingSubtitle: string;
  onboardingStarterTitle: string;
  onboardingStarterSubtitle: string;
  onboardingMoreTitle: string;
  onboardingAdd: (n: number) => string;
  onboardingDone: string;
  onboardingSkip: string;
  onboardingAddOwn: string;
  onboardingCategorySpices: string;
  onboardingCategoryBaking: string;
  onboardingCategoryOils: string;
  onboardingCategoryDryGoods: string;
  onboardingCategoryCondiments: string;
  // No expiry
  noExpiryDate: string;
  // Add product screen
  addProductTitle: string;
  addProductNameLabel: string;
  addProductNamePlaceholder: string;
  addProductExpiryLabel: string;
  addProductNoExpiry: string;
  addProductAddBtn: string;
  addProductMissingName: string;
  addProductMissingNameMsg: string;
  addProductSuccess: (name: string) => string;
  addProductPickDate: string;
  addProductConfirm: string;
  addProductCancel: string;
  // Notification settings
  settingsNotifications: string;
  settingsNotifEnabled: string;
  settingsNotifEnabledSubtitle: string;
  settingsNotifDaysBefore: string;
  settingsNotifDay: (n: number) => string;
  settingsNotifSummary: string;
  settingsNotifSummarySubtitle: string;
  // Settings
  settingsTitle: string;
  settingsLanguage: string;
  settingsLanguageSubtitle: string;
  // Language name (for OpenAI prompt)
  languageName: string;
}

const en: Translations = {
  recipesResultCount: (n) => `${n} recipes to try`,
  recipeOpen: "Open full recipe",
  recipeClose: "Close recipe",
  recipeIngredients: "Ingredients",
  recipePreparation: "Preparation",
  recipeMore: "More servings",
  recipeFewer: "Fewer servings",
  recipeToTaste: "to taste",
  recipeScalingHint: "Quantities adjust to the servings. Check cooking times and doneness when preparing larger batches.",
  recipeServings: (n) => `${n} ${n === 1 ? 'person' : 'people'}`,
  recipesCredits: 'Recipe suggestions are temporarily unavailable. Try again later.',
  recipesLimit: 'Too many requests. Wait 30 seconds; the local limit is 20 requests per day.',
  dateYear: 'Year', dateMonth: 'Month', dateDay: 'Day',
  saveError: 'Could not save the change. Please try again.',
  save: 'Save',
  productEdit: {
    title: 'Edit product', open: (name) => `Edit ${name}`,
    barcode: 'Barcode (optional)', notes: 'Product notes (optional)', missing: 'This product is no longer in your pantry.',
  },
  dietary: {
    defaults: 'Default dietary preferences', defaultsHint: 'Selected preferences are already checked when you open Recipes.',
    add: 'Add a dietary preference', name: 'Preference name', description: 'Describe what to include or avoid',
    usage: 'Suggestions take your selected preferences into account. For allergies, check ingredients and product labels.',
    loadError: 'Dietary preferences could not be loaded. Reopen the app to try again.',
  },
  addProductNoExpiryHint: 'For example: salt, spices or honey',
  scannerSettings: 'Open settings',
  recipesUnavailable: 'Recipe suggestions are not available yet. You can already choose your ingredients and preferences.',
  recipesNetworkError: 'Could not load recipes. Check your connection and try again.',
  tabHome: 'Home', tabPantry: 'Pantry', tabScan: 'Scan', tabCalendar: 'Calendar',
  tabRecipes: 'Recipes', tabSettings: 'Settings', cancel: 'Cancel',
  homeSubtitle: (n) => `${n} item${n !== 1 ? 's' : ''} in pantry`,
  homeExpired: 'Expired', homeExpiringSoon: 'Expiring Soon', homeGood: 'Good',
  homeNeedsAttention: 'Needs Attention', homeAllGood: 'All Good!',
  homeNothingExpiring: 'Nothing expiring in the next 3 days.',
  labelExpiredAgo: (n) => `Expired ${n}d ago`,
  labelExpiresToday: 'Expires today', labelTomorrow: 'Tomorrow',
  labelDaysLeft: (n) => `${n} days left`, labelDays: (n) => `${n} days`,
  pantryTitle: 'My Pantry',
  pantrySubtitle: (n) => `${n} item${n !== 1 ? 's' : ''}`,
  pantryRemoveTitle: 'Remove Item',
  pantryRemoveConfirm: (name) => `Remove "${name}" from your pantry?`,
  pantryRemoveExpired: 'Remove all expired products',
  pantryRemoveExpiredConfirm: (n) => n === 1 ? 'Remove 1 expired product from your pantry?' : `Remove ${n} expired products from your pantry?`,
  pantryRemove: 'Remove', pantryEmptyTitle: 'Your pantry is empty',
  pantryEmptyText: 'Scan a barcode to add your first item.', pantryBestBefore: 'Best before:',
  scannerTitle: 'Scan Barcode', scannerSubtitle: 'Point at a product barcode',
  scannerCameraTitle: 'Camera Access Required',
  scannerCameraText: 'ChefSuggest needs your camera to scan barcodes.',
  scannerGrantAccess: 'Grant Access', scannerLookingUp: 'Looking up product...',
  scannerAlignHint: 'Align barcode within the frame', scannerConfirmTitle: 'Confirm Item',
  scannerBarcodeLabel: 'Barcode:', scannerNameLabel: 'Product Name',
  scannerNamePlaceholder: 'e.g. Organic Whole Milk', scannerExpiryLabel: 'Expiry Date',
  scannerAddBtn: 'Add to Pantry', scannerScanAgain: 'Scan Again',
  scannerSuccess: (name) => `${name} added!`,
  scannerAutoFilled: 'Auto-filled from product data — edit if incorrect.',
  scannerNotFound: 'Not found on barcode — enter manually (YYYY-MM-DD).',
  scannerMissingName: 'Missing name', scannerMissingNameMsg: 'Please enter a product name.',
  scannerInvalidDate: 'Invalid date',
  scannerInvalidDateMsg: 'Please enter the expiry date as YYYY-MM-DD.',
  calendarTitle: 'Expiry Calendar', calendarSubtitle: 'Dots mark items expiring on that day',
  calendarNothingOnDay: 'No items expire on this day.',
  calendarLegendExpired: 'Expired', calendarLegendSoon: 'Expiring soon', calendarLegendGood: 'Good',
  calendarDayItems: (date, n) => `${date} — ${n} item${n !== 1 ? 's' : ''}`,
  calendarDayEmpty: (date) => `${date} — nothing expiring`,
  recipesTitle: 'Recipe Ideas', recipesSubtitle: 'Ideas from what you have at home',
  recipesIntro: 'Find recipes that use the ingredients you need to use up first.',
  recipesGetIdeas: 'Get Recipe Ideas', recipesRefresh: 'Refresh Ideas',
  recipesAsking: 'Looking for recipes…', recipesNoResult: 'No recipes returned. Try again.',
  recipesKeyIngredients: 'Key ingredients',
  recipesEmptyState: "Tap the button above to get personalised recipe suggestions based on what's expiring soonest in your pantry.",
  recipesApiKeyTitle: 'API Key Missing',
  recipesApiKeyMsg: 'Set EXPO_PUBLIC_ANTHROPIC_API_KEY in your .env file to use this feature.',
  recipesEmptyPantryTitle: 'Empty Pantry', recipesEmptyPantryMsg: 'Add some items to your pantry first.',
  recipesErrorTitle: 'Error',
  recipesExpiresIn: (n) => `expires in ${n} days`, recipesExpiresToday: 'expires today', recipesExpired: 'expired',
  recipesModeQuick: 'Quick', recipesModeCustom: 'Custom',
  recipesPantrySection: 'From your pantry', recipesExtraSection: 'Extra ingredients',
  recipesExtraPlaceholder: 'e.g. olive oil, pasta...', recipesExtraAdd: 'Add',
  recipesNotesSection: 'Notes',
  recipesNotesPlaceholder: 'Dietary needs, preferred cuisine, serving size...',
  recipesSelectAll: 'Select all', recipesDeselectAll: 'Deselect all',
  recipesNoPantryItems: 'No items in pantry',
  recipesCustomEmptyState: 'Pick ingredients from your pantry, add extras, and include any notes — then tap Get Recipe Ideas.',
  recipesCustomNoIngredients: 'No ingredients selected. Add at least one to get recipe suggestions.',
  recipesDietarySection: 'Dietary preferences',
  recipesCookingSection: 'How you want to cook',
  recipesQualityError: 'The recipes were incomplete or did not match your filters. Please try again.',
  recipesCookingHint: 'Easy: basic techniques, up to 6 steps. Quick: within 30 min, including prep. You can select both.',
  recipesEasyFilter: 'Easy recipes',
  recipesQuickFilter: 'Quick recipes',
  recipeEstimatedTime: (minutes) => `About ${minutes} min total`,
  recipeEasy: 'Easy',
  recipeStandard: 'Standard',
  dietLabels: {
    vegetarian: 'Vegetarian', vegan: 'Vegan', pescatarian: 'Pescatarian',
    glutenFree: 'Gluten Free', lactoseFree: 'Lactose Free', dairyFree: 'Dairy Free',
    eggFree: 'Egg Free', nutFree: 'Nut Free', lowCarb: 'Low Carb',
    keto: 'Keto', halal: 'Halal', kosher: 'Kosher',
  },
  onboardingTitle: 'Welcome to ChefSuggest!',
  onboardingSubtitle: "Let's stock your pantry to get started",
  onboardingStarterTitle: 'Your starter items',
  onboardingStarterSubtitle: "We'll add these to your pantry automatically",
  onboardingMoreTitle: 'Do you have any of these?',
  onboardingAdd: (n) => `Add ${n} more item${n !== 1 ? 's' : ''}`,
  onboardingDone: 'Get Started',
  onboardingSkip: 'Skip',
  onboardingAddOwn: 'Add Your Own Items',
  onboardingCategorySpices: 'Spices & Herbs',
  onboardingCategoryBaking: 'Baking',
  onboardingCategoryOils: 'Oils & Vinegars',
  onboardingCategoryDryGoods: 'Dry Goods',
  onboardingCategoryCondiments: 'Condiments',
  noExpiryDate: 'No Expiration',
  addProductTitle: 'Add Product',
  addProductNameLabel: 'Product Name',
  addProductNamePlaceholder: 'e.g. Olive Oil',
  addProductExpiryLabel: 'Expiry Date',
  addProductNoExpiry: 'No Expiration Date',
  addProductAddBtn: 'Add to Pantry',
  addProductMissingName: 'Missing name',
  addProductMissingNameMsg: 'Please enter a product name.',
  addProductSuccess: (name) => `${name} added to pantry!`,
  addProductPickDate: 'Select Date',
  addProductConfirm: 'Confirm',
  addProductCancel: 'Cancel',
  settingsNotifications: 'Notifications',
  settingsNotifEnabled: 'Expiry Notifications',
  settingsNotifEnabledSubtitle: 'Get notified before items expire',
  settingsNotifDaysBefore: 'Notify me',
  settingsNotifDay: (n) => `${n} day${n !== 1 ? 's' : ''} before`,
  settingsNotifSummary: 'Daily Summary',
  settingsNotifSummarySubtitle: 'Morning reminder at 9am of items expiring this week',
  settingsTitle: 'Settings', settingsLanguage: 'Language',
  settingsLanguageSubtitle: 'Choose your preferred language', languageName: 'English',
};

const it: Translations = {
  recipesResultCount: (n) => `${n} ricette da provare`,
  recipeOpen: "Apri la ricetta completa",
  recipeClose: "Chiudi ricetta",
  recipeIngredients: "Ingredienti",
  recipePreparation: "Preparazione",
  recipeMore: "Aumenta porzioni",
  recipeFewer: "Diminuisci porzioni",
  recipeToTaste: "q.b.",
  recipeScalingHint: "Le quantità si adattano alle porzioni. Per dosi maggiori controlla i tempi di cottura e la cottura effettiva.",
  recipeServings: (n) => `${n} ${n === 1 ? 'persona' : 'persone'}`,
  recipesCredits: 'I suggerimenti di ricette sono temporaneamente indisponibili. Riprova più tardi.',
  recipesLimit: 'Troppe richieste. Attendi 30 secondi; il limite locale è 20 richieste al giorno.',
  dateYear: 'Anno', dateMonth: 'Mese', dateDay: 'Giorno',
  saveError: 'Non è stato possibile salvare la modifica. Riprova.',
  save: 'Salva',
  productEdit: {
    title: 'Modifica prodotto', open: (name) => `Modifica ${name}`,
    barcode: 'Codice a barre (facoltativo)', notes: 'Note sul prodotto (facoltative)', missing: 'Questo prodotto non è più in dispensa.',
  },
  dietary: {
    defaults: 'Preferenze alimentari predefinite', defaultsHint: 'Le preferenze selezionate sono già attive quando apri Ricette.',
    add: 'Aggiungi una preferenza alimentare', name: 'Nome della preferenza', description: 'Descrivi cosa includere o evitare',
    usage: 'I suggerimenti tengono conto delle tue preferenze. In caso di allergie, controlla ingredienti ed etichette.',
    loadError: 'Non è stato possibile caricare le preferenze alimentari. Riapri l’app per riprovare.',
  },
  addProductNoExpiryHint: 'Per esempio: sale, spezie o miele',
  scannerSettings: 'Apri le impostazioni',
  recipesUnavailable: 'I suggerimenti di ricette non sono ancora disponibili. Puoi già scegliere ingredienti e preferenze.',
  recipesNetworkError: 'Non è stato possibile caricare le ricette. Controlla la connessione e riprova.',
  tabHome: 'Home', tabPantry: 'Dispensa', tabScan: 'Scansiona', tabCalendar: 'Calendario',
  tabRecipes: 'Ricette', tabSettings: 'Impostazioni', cancel: 'Annulla',
  homeSubtitle: (n) => `${n} articol${n !== 1 ? 'i' : 'o'} in dispensa`,
  homeExpired: 'Scaduto', homeExpiringSoon: 'In Scadenza', homeGood: 'Fresco',
  homeNeedsAttention: 'Da Usare Presto', homeAllGood: 'Tutto Bene!',
  homeNothingExpiring: 'Niente in scadenza nei prossimi 3 giorni.',
  labelExpiredAgo: (n) => `Scaduto ${n}g fa`,
  labelExpiresToday: 'Scade oggi', labelTomorrow: 'Domani',
  labelDaysLeft: (n) => `${n} giorni rimasti`, labelDays: (n) => `${n} giorni`,
  pantryTitle: 'La Mia Dispensa',
  pantrySubtitle: (n) => `${n} articol${n !== 1 ? 'i' : 'o'}`,
  pantryRemoveTitle: 'Rimuovi Articolo',
  pantryRemoveConfirm: (name) => `Rimuovere "${name}" dalla dispensa?`,
  pantryRemoveExpired: 'Rimuovi tutti gli scaduti',
  pantryRemoveExpiredConfirm: (n) => n === 1 ? 'Rimuovere 1 prodotto scaduto dalla dispensa?' : `Rimuovere ${n} prodotti scaduti dalla dispensa?`,
  pantryRemove: 'Rimuovi', pantryEmptyTitle: 'La dispensa è vuota',
  pantryEmptyText: 'Scansiona un codice a barre per aggiungere il primo articolo.',
  pantryBestBefore: 'Scadenza:',
  scannerTitle: 'Scansiona Codice', scannerSubtitle: 'Punta il codice a barre del prodotto',
  scannerCameraTitle: 'Accesso Fotocamera Necessario',
  scannerCameraText: 'ChefSuggest ha bisogno della fotocamera per scansionare i codici a barre.',
  scannerGrantAccess: 'Consenti Accesso', scannerLookingUp: 'Ricerca prodotto...',
  scannerAlignHint: 'Allinea il codice a barre nel riquadro', scannerConfirmTitle: 'Conferma Articolo',
  scannerBarcodeLabel: 'Codice a barre:', scannerNameLabel: 'Nome Prodotto',
  scannerNamePlaceholder: 'es. Latte Intero Biologico', scannerExpiryLabel: 'Data di Scadenza',
  scannerAddBtn: 'Aggiungi alla Dispensa', scannerScanAgain: 'Scansiona di Nuovo',
  scannerSuccess: (name) => `${name} aggiunto!`,
  scannerAutoFilled: 'Compilato automaticamente — modifica se necessario.',
  scannerNotFound: 'Non trovato — inserisci manualmente (AAAA-MM-GG).',
  scannerMissingName: 'Nome mancante', scannerMissingNameMsg: 'Inserisci il nome del prodotto.',
  scannerInvalidDate: 'Data non valida',
  scannerInvalidDateMsg: 'Inserisci la data nel formato AAAA-MM-GG.',
  calendarTitle: 'Calendario Scadenze', calendarSubtitle: 'I punti indicano gli articoli in scadenza',
  calendarNothingOnDay: 'Nessun articolo scade in questo giorno.',
  calendarLegendExpired: 'Scaduto', calendarLegendSoon: 'In scadenza', calendarLegendGood: 'Fresco',
  calendarDayItems: (date, n) => `${date} — ${n} articol${n !== 1 ? 'i' : 'o'}`,
  calendarDayEmpty: (date) => `${date} — nessuna scadenza`,
  recipesTitle: 'Idee Ricette', recipesSubtitle: 'Idee con quello che hai in casa',
  recipesIntro: 'Trova ricette per usare prima gli ingredienti che stanno per scadere.',
  recipesGetIdeas: 'Trova Ricette', recipesRefresh: 'Aggiorna Idee',
  recipesAsking: 'Cerco ricette…', recipesNoResult: 'Nessuna ricetta trovata. Riprova.',
  recipesKeyIngredients: 'Ingredienti chiave',
  recipesEmptyState: 'Tocca il pulsante sopra per ottenere suggerimenti di ricette personalizzati.',
  recipesApiKeyTitle: 'Chiave API Mancante',
  recipesApiKeyMsg: 'Imposta EXPO_PUBLIC_ANTHROPIC_API_KEY nel file .env.',
  recipesEmptyPantryTitle: 'Dispensa Vuota', recipesEmptyPantryMsg: 'Aggiungi prima alcuni articoli alla dispensa.',
  recipesErrorTitle: 'Errore',
  recipesExpiresIn: (n) => `scade tra ${n} giorni`, recipesExpiresToday: 'scade oggi', recipesExpired: 'scaduto',
  recipesModeQuick: 'Veloce', recipesModeCustom: 'Personalizzato',
  recipesPantrySection: 'Dalla tua dispensa', recipesExtraSection: 'Ingredienti extra',
  recipesExtraPlaceholder: "es. olio d'oliva, pasta...", recipesExtraAdd: 'Aggiungi',
  recipesNotesSection: 'Note',
  recipesNotesPlaceholder: 'Esigenze dietetiche, cucina preferita, porzioni...',
  recipesSelectAll: 'Seleziona tutto', recipesDeselectAll: 'Deseleziona tutto',
  recipesNoPantryItems: 'Nessun articolo in dispensa',
  recipesCustomEmptyState: 'Scegli ingredienti dalla dispensa, aggiungine altri e inserisci note — poi tocca Trova Ricette.',
  recipesCustomNoIngredients: 'Nessun ingrediente selezionato. Aggiungine almeno uno per ottenere suggerimenti.',
  recipesDietarySection: 'Preferenze alimentari',
  recipesCookingSection: 'Come vuoi cucinare',
  recipesQualityError: 'Le ricette erano incomplete o non rispettavano i filtri. Riprova.',
  recipesCookingHint: 'Facili: tecniche di base, fino a 6 passaggi. Veloci: entro 30 min, preparazione inclusa. Puoi scegliere entrambe.',
  recipesEasyFilter: 'Ricette facili',
  recipesQuickFilter: 'Ricette veloci',
  recipeEstimatedTime: (minutes) => `Circa ${minutes} min totali`,
  recipeEasy: 'Facile',
  recipeStandard: 'Standard',
  dietLabels: {
    vegetarian: 'Vegetariano', vegan: 'Vegano', pescatarian: 'Pescatariano',
    glutenFree: 'Senza Glutine', lactoseFree: 'Senza Lattosio', dairyFree: 'Senza Latticini',
    eggFree: 'Senza Uova', nutFree: 'Senza Frutta Secca', lowCarb: 'Low Carb',
    keto: 'Keto', halal: 'Halal', kosher: 'Kosher',
  },
  onboardingTitle: 'Benvenuto in ChefSuggest!',
  onboardingSubtitle: 'Riforniamo la tua dispensa per iniziare',
  onboardingStarterTitle: 'I tuoi articoli di base',
  onboardingStarterSubtitle: 'Li aggiungeremo automaticamente alla tua dispensa',
  onboardingMoreTitle: 'Hai già qualcuno di questi?',
  onboardingAdd: (n) => `Aggiungi altri ${n} element${n !== 1 ? 'i' : 'o'}`,
  onboardingDone: 'Inizia',
  onboardingSkip: 'Salta',
  onboardingAddOwn: 'Aggiungi i Tuoi Prodotti',
  onboardingCategorySpices: 'Spezie ed Erbe',
  onboardingCategoryBaking: 'Prodotti da Forno',
  onboardingCategoryOils: 'Oli e Aceti',
  onboardingCategoryDryGoods: 'Prodotti Secchi',
  onboardingCategoryCondiments: 'Condimenti',
  noExpiryDate: 'Senza Scadenza',
  addProductTitle: 'Aggiungi Prodotto',
  addProductNameLabel: 'Nome Prodotto',
  addProductNamePlaceholder: 'es. Olio d\'Oliva',
  addProductExpiryLabel: 'Data di Scadenza',
  addProductNoExpiry: 'Senza Data di Scadenza',
  addProductAddBtn: 'Aggiungi alla Dispensa',
  addProductMissingName: 'Nome mancante',
  addProductMissingNameMsg: 'Inserisci il nome del prodotto.',
  addProductSuccess: (name) => `${name} aggiunto alla dispensa!`,
  addProductPickDate: 'Seleziona Data',
  addProductConfirm: 'Conferma',
  addProductCancel: 'Annulla',
  settingsNotifications: 'Notifiche',
  settingsNotifEnabled: 'Notifiche di Scadenza',
  settingsNotifEnabledSubtitle: 'Ricevi notifiche prima che gli articoli scadano',
  settingsNotifDaysBefore: 'Avvisami',
  settingsNotifDay: (n) => `${n} giorn${n !== 1 ? 'i' : 'o'} prima`,
  settingsNotifSummary: 'Riepilogo Giornaliero',
  settingsNotifSummarySubtitle: 'Promemoria mattutino alle 9 degli articoli in scadenza questa settimana',
  settingsTitle: 'Impostazioni', settingsLanguage: 'Lingua',
  settingsLanguageSubtitle: 'Scegli la lingua preferita', languageName: 'Italian',
};

const fr: Translations = {
  recipesResultCount: (n) => `${n} recettes à essayer`,
  recipeOpen: "Ouvrir la recette complète",
  recipeClose: "Fermer la recette",
  recipeIngredients: "Ingrédients",
  recipePreparation: "Préparation",
  recipeMore: "Plus de portions",
  recipeFewer: "Moins de portions",
  recipeToTaste: "au goût",
  recipeScalingHint: "Les quantités suivent les portions. Pour des quantités plus grandes, vérifiez le temps de cuisson et la cuisson.",
  recipeServings: (n) => `${n} ${n === 1 ? 'personne' : 'personnes'}`,
  recipesCredits: 'Les suggestions de recettes sont temporairement indisponibles. Réessayez plus tard.',
  recipesLimit: 'Trop de demandes. Attendez 30 secondes ; la limite locale est de 20 demandes par jour.',
  dateYear: 'Année', dateMonth: 'Mois', dateDay: 'Jour',
  saveError: 'Impossible d’enregistrer la modification. Réessayez.',
  save: 'Enregistrer',
  productEdit: {
    title: 'Modifier le produit', open: (name) => `Modifier ${name}`,
    barcode: 'Code-barres (facultatif)', notes: 'Notes sur le produit (facultatif)', missing: 'Ce produit n’est plus dans le garde-manger.',
  },
  dietary: {
    defaults: 'Préférences alimentaires par défaut', defaultsHint: 'Les préférences sélectionnées sont actives à l’ouverture des Recettes.',
    add: 'Ajouter une préférence alimentaire', name: 'Nom de la préférence', description: 'Décrivez ce qu’il faut inclure ou éviter',
    usage: 'Les suggestions tiennent compte de vos préférences. En cas d’allergie, vérifiez les ingrédients et les étiquettes.',
    loadError: 'Impossible de charger les préférences alimentaires. Rouvrez l’application pour réessayer.',
  },
  addProductNoExpiryHint: 'Par exemple : sel, épices ou miel',
  scannerSettings: 'Ouvrir les réglages',
  recipesUnavailable: 'Les suggestions de recettes ne sont pas encore disponibles. Vous pouvez déjà choisir vos ingrédients et préférences.',
  recipesNetworkError: 'Impossible de charger les recettes. Vérifiez votre connexion et réessayez.',
  tabHome: 'Accueil', tabPantry: 'Garde-manger', tabScan: 'Scanner', tabCalendar: 'Calendrier',
  tabRecipes: 'Recettes', tabSettings: 'Paramètres', cancel: 'Annuler',
  homeSubtitle: (n) => `${n} article${n !== 1 ? 's' : ''} dans le garde-manger`,
  homeExpired: 'Expiré', homeExpiringSoon: 'Expire Bientôt', homeGood: 'Frais',
  homeNeedsAttention: 'À Utiliser', homeAllGood: 'Tout va bien !',
  homeNothingExpiring: "Rien n'expire dans les 3 prochains jours.",
  labelExpiredAgo: (n) => `Expiré il y a ${n}j`,
  labelExpiresToday: "Expire aujourd'hui", labelTomorrow: 'Demain',
  labelDaysLeft: (n) => `${n} jour${n !== 1 ? 's' : ''} restant${n !== 1 ? 's' : ''}`,
  labelDays: (n) => `${n} jour${n !== 1 ? 's' : ''}`,
  pantryTitle: 'Mon Garde-manger',
  pantrySubtitle: (n) => `${n} article${n !== 1 ? 's' : ''}`,
  pantryRemoveTitle: "Supprimer l'article",
  pantryRemoveConfirm: (name) => `Supprimer "${name}" du garde-manger ?`,
  pantryRemoveExpired: 'Supprimer tous les produits périmés',
  pantryRemoveExpiredConfirm: (n) => n === 1 ? 'Supprimer 1 produit périmé du garde-manger ?' : `Supprimer ${n} produits périmés du garde-manger ?`,
  pantryRemove: 'Supprimer', pantryEmptyTitle: 'Le garde-manger est vide',
  pantryEmptyText: 'Scannez un code-barres pour ajouter votre premier article.',
  pantryBestBefore: 'À consommer avant :',
  scannerTitle: 'Scanner un Code-barres', scannerSubtitle: 'Pointez vers le code-barres du produit',
  scannerCameraTitle: 'Accès à la Caméra Requis',
  scannerCameraText: 'ChefSuggest a besoin de la caméra pour scanner les codes-barres.',
  scannerGrantAccess: "Autoriser l'Accès", scannerLookingUp: 'Recherche du produit...',
  scannerAlignHint: 'Alignez le code-barres dans le cadre', scannerConfirmTitle: "Confirmer l'Article",
  scannerBarcodeLabel: 'Code-barres :', scannerNameLabel: 'Nom du produit',
  scannerNamePlaceholder: 'ex. Lait entier bio', scannerExpiryLabel: "Date d'expiration",
  scannerAddBtn: 'Ajouter au Garde-manger', scannerScanAgain: 'Scanner à Nouveau',
  scannerSuccess: (name) => `${name} ajouté !`,
  scannerAutoFilled: 'Rempli automatiquement — modifiez si nécessaire.',
  scannerNotFound: 'Non trouvé — saisir manuellement (AAAA-MM-JJ).',
  scannerMissingName: 'Nom manquant', scannerMissingNameMsg: 'Veuillez saisir un nom de produit.',
  scannerInvalidDate: 'Date invalide',
  scannerInvalidDateMsg: 'Veuillez saisir la date au format AAAA-MM-JJ.',
  calendarTitle: 'Calendrier des Expirations', calendarSubtitle: 'Les points indiquent les articles expirant ce jour',
  calendarNothingOnDay: "Aucun article n'expire ce jour.",
  calendarLegendExpired: 'Expiré', calendarLegendSoon: 'Expire bientôt', calendarLegendGood: 'Frais',
  calendarDayItems: (date, n) => `${date} — ${n} article${n !== 1 ? 's' : ''}`,
  calendarDayEmpty: (date) => `${date} — aucune expiration`,
  recipesTitle: 'Idées Recettes', recipesSubtitle: 'Des idées avec ce que vous avez chez vous',
  recipesIntro: 'Trouvez des recettes pour utiliser en priorité les ingrédients qui arrivent à expiration.',
  recipesGetIdeas: 'Obtenir des Idées', recipesRefresh: 'Actualiser les Idées',
  recipesAsking: 'Recherche de recettes…', recipesNoResult: 'Aucune recette retournée. Réessayez.',
  recipesKeyIngredients: 'Ingrédients clés',
  recipesEmptyState: 'Appuyez sur le bouton ci-dessus pour obtenir des suggestions de recettes personnalisées.',
  recipesApiKeyTitle: 'Clé API Manquante',
  recipesApiKeyMsg: 'Définissez EXPO_PUBLIC_ANTHROPIC_API_KEY dans votre fichier .env.',
  recipesEmptyPantryTitle: 'Garde-manger Vide', recipesEmptyPantryMsg: "Ajoutez d'abord des articles à votre garde-manger.",
  recipesErrorTitle: 'Erreur',
  recipesExpiresIn: (n) => `expire dans ${n} jour${n !== 1 ? 's' : ''}`,
  recipesExpiresToday: "expire aujourd'hui", recipesExpired: 'expiré',
  recipesModeQuick: 'Rapide', recipesModeCustom: 'Personnalisé',
  recipesPantrySection: 'De votre garde-manger', recipesExtraSection: 'Ingrédients supplémentaires',
  recipesExtraPlaceholder: "ex. huile d'olive, pâtes...", recipesExtraAdd: 'Ajouter',
  recipesNotesSection: 'Notes',
  recipesNotesPlaceholder: 'Restrictions alimentaires, cuisine préférée, nombre de portions...',
  recipesSelectAll: 'Tout sélectionner', recipesDeselectAll: 'Tout désélectionner',
  recipesNoPantryItems: 'Aucun article dans le garde-manger',
  recipesCustomEmptyState: "Sélectionnez des ingrédients de votre garde-manger, ajoutez des extras et des notes — puis appuyez sur Obtenir des Idées.",
  recipesCustomNoIngredients: 'Aucun ingrédient sélectionné. Ajoutez-en au moins un pour obtenir des suggestions.',
  recipesDietarySection: 'Préférences alimentaires',
  recipesCookingSection: 'Votre façon de cuisiner',
  recipesQualityError: 'Les recettes étaient incomplètes ou ne correspondaient pas aux filtres. Réessayez.',
  recipesCookingHint: 'Faciles : techniques simples, 6 étapes maximum. Rapides : 30 min maximum, préparation comprise. Les deux sont possibles.',
  recipesEasyFilter: 'Recettes faciles',
  recipesQuickFilter: 'Recettes rapides',
  recipeEstimatedTime: (minutes) => `Environ ${minutes} min au total`,
  recipeEasy: 'Facile',
  recipeStandard: 'Standard',
  dietLabels: {
    vegetarian: 'Végétarien', vegan: 'Végane', pescatarian: 'Pescatarien',
    glutenFree: 'Sans Gluten', lactoseFree: 'Sans Lactose', dairyFree: 'Sans Produits Laitiers',
    eggFree: 'Sans Œufs', nutFree: 'Sans Noix', lowCarb: 'Faible en Glucides',
    keto: 'Keto', halal: 'Halal', kosher: 'Casher',
  },
  onboardingTitle: 'Bienvenue dans ChefSuggest !',
  onboardingSubtitle: 'Remplissons votre garde-manger pour commencer',
  onboardingStarterTitle: 'Vos articles de départ',
  onboardingStarterSubtitle: 'Nous les ajouterons automatiquement à votre garde-manger',
  onboardingMoreTitle: 'Avez-vous déjà certains de ces produits ?',
  onboardingAdd: (n) => `Ajouter ${n} autre${n !== 1 ? 's' : ''} article${n !== 1 ? 's' : ''}`,
  onboardingDone: 'Commencer',
  onboardingSkip: 'Passer',
  onboardingAddOwn: 'Ajouter Vos Propres Produits',
  onboardingCategorySpices: 'Épices et Herbes',
  onboardingCategoryBaking: 'Pâtisserie',
  onboardingCategoryOils: 'Huiles et Vinaigres',
  onboardingCategoryDryGoods: 'Produits Secs',
  onboardingCategoryCondiments: 'Condiments',
  noExpiryDate: 'Sans Expiration',
  addProductTitle: 'Ajouter un Produit',
  addProductNameLabel: 'Nom du produit',
  addProductNamePlaceholder: "ex. Huile d'Olive",
  addProductExpiryLabel: "Date d'expiration",
  addProductNoExpiry: "Pas de Date d'Expiration",
  addProductAddBtn: 'Ajouter au Garde-manger',
  addProductMissingName: 'Nom manquant',
  addProductMissingNameMsg: 'Veuillez saisir un nom de produit.',
  addProductSuccess: (name) => `${name} ajouté au garde-manger !`,
  addProductPickDate: 'Sélectionner une Date',
  addProductConfirm: 'Confirmer',
  addProductCancel: 'Annuler',
  settingsNotifications: 'Notifications',
  settingsNotifEnabled: "Notifications d'Expiration",
  settingsNotifEnabledSubtitle: 'Recevez des alertes avant que les articles expirent',
  settingsNotifDaysBefore: 'Me notifier',
  settingsNotifDay: (n) => `${n} jour${n !== 1 ? 's' : ''} avant`,
  settingsNotifSummary: 'Résumé Quotidien',
  settingsNotifSummarySubtitle: 'Rappel matinal à 9h des articles expirant cette semaine',
  settingsTitle: 'Paramètres', settingsLanguage: 'Langue',
  settingsLanguageSubtitle: 'Choisissez votre langue préférée', languageName: 'French',
};

const de: Translations = {
  recipesResultCount: (n) => `${n} Rezepte zum Ausprobieren`,
  recipeOpen: "Vollständiges Rezept öffnen",
  recipeClose: "Rezept schließen",
  recipeIngredients: "Zutaten",
  recipePreparation: "Zubereitung",
  recipeMore: "Mehr Portionen",
  recipeFewer: "Weniger Portionen",
  recipeToTaste: "nach Geschmack",
  recipeScalingHint: "Die Mengen passen sich den Portionen an. Bei größeren Mengen Garzeiten und Garzustand prüfen.",
  recipeServings: (n) => `${n} ${n === 1 ? 'Person' : 'Personen'}`,
  recipesCredits: 'Rezeptvorschläge sind vorübergehend nicht verfügbar. Versuche es später erneut.',
  recipesLimit: 'Zu viele Anfragen. Bitte 30 Sekunden warten; das lokale Limit beträgt 20 Anfragen pro Tag.',
  dateYear: 'Jahr', dateMonth: 'Monat', dateDay: 'Tag',
  saveError: 'Die Änderung konnte nicht gespeichert werden. Bitte erneut versuchen.',
  save: 'Speichern',
  productEdit: {
    title: 'Produkt bearbeiten', open: (name) => `${name} bearbeiten`,
    barcode: 'Strichcode (optional)', notes: 'Notizen zum Produkt (optional)', missing: 'Dieses Produkt ist nicht mehr im Vorrat.',
  },
  dietary: {
    defaults: 'Standard-Ernährungsvorgaben', defaultsHint: 'Die ausgewählten Vorgaben sind beim Öffnen der Rezepte bereits aktiv.',
    add: 'Ernährungsvorgabe hinzufügen', name: 'Name der Vorgabe', description: 'Beschreibe, was enthalten oder vermieden werden soll',
    usage: 'Die Vorschläge berücksichtigen deine Vorlieben. Prüfe bei Allergien die Zutaten und Produktetiketten.',
    loadError: 'Die Ernährungsvorgaben konnten nicht geladen werden. Öffne die App erneut.',
  },
  addProductNoExpiryHint: 'Zum Beispiel: Salz, Gewürze oder Honig',
  scannerSettings: 'Einstellungen öffnen',
  recipesUnavailable: 'Rezeptvorschläge sind noch nicht verfügbar. Zutaten und Vorlieben können bereits ausgewählt werden.',
  recipesNetworkError: 'Rezepte konnten nicht geladen werden. Verbindung prüfen und erneut versuchen.',
  tabHome: 'Start', tabPantry: 'Vorrat', tabScan: 'Scannen', tabCalendar: 'Kalender',
  tabRecipes: 'Rezepte', tabSettings: 'Einstellungen', cancel: 'Abbrechen',
  homeSubtitle: (n) => `${n} Artikel im Vorrat`,
  homeExpired: 'Abgelaufen', homeExpiringSoon: 'Läuft ab', homeGood: 'Frisch',
  homeNeedsAttention: 'Bald aufbrauchen', homeAllGood: 'Alles gut!',
  homeNothingExpiring: 'In den nächsten 3 Tagen läuft nichts ab.',
  labelExpiredAgo: (n) => `Vor ${n}T abgelaufen`,
  labelExpiresToday: 'Läuft heute ab', labelTomorrow: 'Morgen',
  labelDaysLeft: (n) => `Noch ${n} Tag${n !== 1 ? 'e' : ''}`,
  labelDays: (n) => `${n} Tag${n !== 1 ? 'e' : ''}`,
  pantryTitle: 'Mein Vorrat',
  pantrySubtitle: (n) => `${n} Artikel`,
  pantryRemoveTitle: 'Artikel entfernen',
  pantryRemoveConfirm: (name) => `"${name}" aus dem Vorrat entfernen?`,
  pantryRemoveExpired: 'Alle abgelaufenen Produkte entfernen',
  pantryRemoveExpiredConfirm: (n) => n === 1 ? '1 abgelaufenes Produkt aus dem Vorrat entfernen?' : `${n} abgelaufene Produkte aus dem Vorrat entfernen?`,
  pantryRemove: 'Entfernen', pantryEmptyTitle: 'Der Vorrat ist leer',
  pantryEmptyText: 'Scannen Sie einen Barcode, um den ersten Artikel hinzuzufügen.',
  pantryBestBefore: 'Mindesthaltbar bis:',
  scannerTitle: 'Barcode Scannen', scannerSubtitle: 'Richten Sie die Kamera auf den Barcode',
  scannerCameraTitle: 'Kamerazugriff Erforderlich',
  scannerCameraText: 'ChefSuggest benötigt die Kamera zum Scannen von Barcodes.',
  scannerGrantAccess: 'Zugriff Gewähren', scannerLookingUp: 'Produkt wird gesucht...',
  scannerAlignHint: 'Barcode im Rahmen ausrichten', scannerConfirmTitle: 'Artikel Bestätigen',
  scannerBarcodeLabel: 'Barcode:', scannerNameLabel: 'Produktname',
  scannerNamePlaceholder: 'z.B. Bio-Vollmilch', scannerExpiryLabel: 'Ablaufdatum',
  scannerAddBtn: 'Zum Vorrat hinzufügen', scannerScanAgain: 'Erneut Scannen',
  scannerSuccess: (name) => `${name} hinzugefügt!`,
  scannerAutoFilled: 'Automatisch ausgefüllt — bei Bedarf bearbeiten.',
  scannerNotFound: 'Nicht gefunden — manuell eingeben (JJJJ-MM-TT).',
  scannerMissingName: 'Name fehlt', scannerMissingNameMsg: 'Bitte geben Sie einen Produktnamen ein.',
  scannerInvalidDate: 'Ungültiges Datum',
  scannerInvalidDateMsg: 'Bitte geben Sie das Datum im Format JJJJ-MM-TT ein.',
  calendarTitle: 'Ablaufdatum-Kalender', calendarSubtitle: 'Punkte markieren ablaufende Artikel',
  calendarNothingOnDay: 'An diesem Tag läuft kein Artikel ab.',
  calendarLegendExpired: 'Abgelaufen', calendarLegendSoon: 'Läuft bald ab', calendarLegendGood: 'Frisch',
  calendarDayItems: (date, n) => `${date} — ${n} Artikel`,
  calendarDayEmpty: (date) => `${date} — keine Ablaufdaten`,
  recipesTitle: 'Rezeptideen', recipesSubtitle: 'Ideen mit dem, was du zu Hause hast',
  recipesIntro: 'Finde Rezepte für die Zutaten, die du zuerst aufbrauchen möchtest.',
  recipesGetIdeas: 'Rezeptideen Holen', recipesRefresh: 'Ideen Aktualisieren',
  recipesAsking: 'Rezepte werden gesucht…', recipesNoResult: 'Keine Rezepte zurückgegeben. Erneut versuchen.',
  recipesKeyIngredients: 'Hauptzutaten',
  recipesEmptyState: 'Tippen Sie oben auf die Schaltfläche, um personalisierte Rezeptvorschläge zu erhalten.',
  recipesApiKeyTitle: 'API-Schlüssel Fehlt',
  recipesApiKeyMsg: 'Setzen Sie EXPO_PUBLIC_ANTHROPIC_API_KEY in Ihrer .env-Datei.',
  recipesEmptyPantryTitle: 'Vorrat Leer', recipesEmptyPantryMsg: 'Fügen Sie zuerst einige Artikel zum Vorrat hinzu.',
  recipesErrorTitle: 'Fehler',
  recipesExpiresIn: (n) => `läuft in ${n} Tag${n !== 1 ? 'en' : ''} ab`,
  recipesExpiresToday: 'läuft heute ab', recipesExpired: 'abgelaufen',
  recipesModeQuick: 'Schnell', recipesModeCustom: 'Angepasst',
  recipesPantrySection: 'Aus Ihrem Vorrat', recipesExtraSection: 'Weitere Zutaten',
  recipesExtraPlaceholder: 'z.B. Olivenöl, Nudeln...', recipesExtraAdd: 'Hinzufügen',
  recipesNotesSection: 'Notizen',
  recipesNotesPlaceholder: 'Ernährungsbedürfnisse, bevorzugte Küche, Portionen...',
  recipesSelectAll: 'Alle auswählen', recipesDeselectAll: 'Alle abwählen',
  recipesNoPantryItems: 'Keine Artikel im Vorrat',
  recipesCustomEmptyState: 'Wählen Sie Zutaten aus Ihrem Vorrat, fügen Sie weitere hinzu und geben Sie Notizen ein — dann auf Rezeptideen Holen tippen.',
  recipesCustomNoIngredients: 'Keine Zutaten ausgewählt. Fügen Sie mindestens eine Zutat hinzu, um Vorschläge zu erhalten.',
  recipesDietarySection: 'Ernährungspräferenzen',
  recipesCookingSection: 'So möchtest du kochen',
  recipesQualityError: 'Die Rezepte waren unvollständig oder entsprachen nicht den Filtern. Bitte versuche es erneut.',
  recipesCookingHint: 'Einfach: Grundtechniken, bis zu 6 Schritte. Schnell: höchstens 30 Min., inklusive Vorbereitung. Beides ist möglich.',
  recipesEasyFilter: 'Einfache Rezepte',
  recipesQuickFilter: 'Schnelle Rezepte',
  recipeEstimatedTime: (minutes) => `Ca. ${minutes} Min. insgesamt`,
  recipeEasy: 'Einfach',
  recipeStandard: 'Standard',
  dietLabels: {
    vegetarian: 'Vegetarisch', vegan: 'Vegan', pescatarian: 'Pescatarisch',
    glutenFree: 'Glutenfrei', lactoseFree: 'Laktosefrei', dairyFree: 'Milchfrei',
    eggFree: 'Eierfrei', nutFree: 'Nussfrei', lowCarb: 'Low Carb',
    keto: 'Keto', halal: 'Halal', kosher: 'Koscher',
  },
  onboardingTitle: 'Willkommen bei ChefSuggest!',
  onboardingSubtitle: 'Lassen Sie uns Ihren Vorrat auffüllen',
  onboardingStarterTitle: 'Ihre Starterartikel',
  onboardingStarterSubtitle: 'Diese werden automatisch zu Ihrem Vorrat hinzugefügt',
  onboardingMoreTitle: 'Haben Sie bereits einige dieser Produkte?',
  onboardingAdd: (n) => `${n} weitere Artikel hinzufügen`,
  onboardingDone: 'Loslegen',
  onboardingSkip: 'Überspringen',
  onboardingAddOwn: 'Eigene Produkte Hinzufügen',
  onboardingCategorySpices: 'Gewürze & Kräuter',
  onboardingCategoryBaking: 'Backen',
  onboardingCategoryOils: 'Öle & Essig',
  onboardingCategoryDryGoods: 'Trockenprodukte',
  onboardingCategoryCondiments: 'Würzmittel',
  noExpiryDate: 'Kein Ablaufdatum',
  addProductTitle: 'Produkt Hinzufügen',
  addProductNameLabel: 'Produktname',
  addProductNamePlaceholder: 'z.B. Olivenöl',
  addProductExpiryLabel: 'Ablaufdatum',
  addProductNoExpiry: 'Kein Ablaufdatum',
  addProductAddBtn: 'Zum Vorrat hinzufügen',
  addProductMissingName: 'Name fehlt',
  addProductMissingNameMsg: 'Bitte geben Sie einen Produktnamen ein.',
  addProductSuccess: (name) => `${name} zum Vorrat hinzugefügt!`,
  addProductPickDate: 'Datum auswählen',
  addProductConfirm: 'Bestätigen',
  addProductCancel: 'Abbrechen',
  settingsNotifications: 'Benachrichtigungen',
  settingsNotifEnabled: 'Ablauf-Benachrichtigungen',
  settingsNotifEnabledSubtitle: 'Erhalten Sie Benachrichtigungen vor dem Ablaufdatum',
  settingsNotifDaysBefore: 'Erinnere mich',
  settingsNotifDay: (n) => `${n} Tag${n !== 1 ? 'e' : ''} vorher`,
  settingsNotifSummary: 'Tägliche Zusammenfassung',
  settingsNotifSummarySubtitle: 'Morgendliche Erinnerung um 9 Uhr für ablaufende Artikel',
  settingsTitle: 'Einstellungen', settingsLanguage: 'Sprache',
  settingsLanguageSubtitle: 'Wählen Sie Ihre bevorzugte Sprache', languageName: 'German',
};

const TRANSLATIONS: Record<Language, Translations> = { en, it, fr, de };

export const LANGUAGE_OPTIONS: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: Translations;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY).then((stored) => {
      if (stored && stored in TRANSLATIONS) {
        setLanguageState(stored as Language);
      }
    });
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  }, []);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t: TRANSLATIONS[language] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
