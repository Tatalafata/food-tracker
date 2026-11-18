import type { Language } from '@/store/i18n';

interface PlanningCopy {
  sameDay: string;
  never: string;
  expiryHint: string;
  webReminders: string;
  enableNotifications: string;
  permissionDenied: string;
  deviceSettings: string;
  expiryAlert: (name: string, days: number) => string;
  summaryAlert: string;
  plan: string;
  planned: string;
  saved: string;
  nothingOnDay: string;
  calendarTitle: string;
  calendarSubtitle: string;
  openCalendar: string;
  reminder: string;
  reminderTime: string;
  invalidTime: string;
  selectDay: string;
  selectedDay: string;
  savePlan: string;
  removePlan: string;
  confirmRemove: (name: string) => string;
  remove: string;
  apiOffline: string;
  apiKey: string;
  apiModel: string;
  usableIngredients: string;
  noUsableItems: string;
}

export const planningCopy: Record<Language, PlanningCopy> = {
  en: {
    sameDay: 'On the day', never: 'Never', expiryHint: 'Choose one or more reminders. Alerts are scheduled for 9:00 am.',
    webReminders: 'Reminders are delivered by the Android and iPhone apps.',
    enableNotifications: 'Enable device notifications',
    permissionDenied: 'Allow notifications in your device settings to receive reminders.',
    deviceSettings: 'Open device settings',
    expiryAlert: (name, days) => days === 0 ? `${name} expires today.` : `${name} expires in ${days} ${days === 1 ? 'day' : 'days'}.`,
    summaryAlert: 'Check your pantry for items expiring this week.',
    plan: 'Add to calendar', planned: 'Planned recipes', saved: 'Recipe added to the calendar',
    nothingOnDay: 'No expiries or recipes planned for this day.', calendarTitle: 'Calendar',
    calendarSubtitle: 'Food expiry dates and recipes you plan to cook', openCalendar: 'View in calendar',
    reminder: 'Cooking reminder', reminderTime: 'Reminder time (HH:MM)',
    invalidTime: 'Enter a future time in 24-hour format, for example 18:00.',
    selectDay: 'Choose a day to cook', selectedDay: 'Selected day', savePlan: 'Save to calendar',
    removePlan: 'Remove from calendar', confirmRemove: (name) => `Remove “${name}” from this day?`, remove: 'Remove',
    apiOffline: 'The recipe service on this PC is not responding. Restart the app preview and try again.',
    apiKey: 'The recipe service could not connect. Try again later.',
    apiModel: 'Recipe suggestions are temporarily unavailable. Try again later.',
    usableIngredients: 'Add a food that is still in date, or enter ingredients in Custom mode.',
    noUsableItems: 'No usable ingredients in your pantry.',
  },
  it: {
    sameDay: 'Il giorno stesso', never: 'Mai', expiryHint: 'Puoi scegliere più avvisi. I promemoria sono programmati alle 9:00.',
    webReminders: 'Gli avvisi arrivano nell’app per Android e iPhone.',
    enableNotifications: 'Attiva le notifiche sul telefono',
    permissionDenied: 'Consenti le notifiche nelle impostazioni del telefono per ricevere i promemoria.',
    deviceSettings: 'Apri le impostazioni del telefono',
    expiryAlert: (name, days) => days === 0 ? `${name} scade oggi.` : `${name} scade tra ${days} ${days === 1 ? 'giorno' : 'giorni'}.`,
    summaryAlert: 'Controlla gli alimenti in scadenza questa settimana.',
    plan: 'Aggiungi al calendario', planned: 'Ricette in programma', saved: 'Ricetta aggiunta al calendario',
    nothingOnDay: 'Nessuna scadenza o ricetta in programma per questo giorno.', calendarTitle: 'Calendario',
    calendarSubtitle: 'Scadenze degli alimenti e ricette da cucinare', openCalendar: 'Vedi nel calendario',
    reminder: 'Promemoria per cucinare', reminderTime: 'Ora del promemoria (HH:MM)',
    invalidTime: 'Inserisci un orario futuro nel formato 24 ore, per esempio 18:00.',
    selectDay: 'Scegli il giorno in cui cucinare', selectedDay: 'Giorno selezionato', savePlan: 'Salva nel calendario',
    removePlan: 'Rimuovi dal calendario', confirmRemove: (name) => `Vuoi rimuovere «${name}» da questo giorno?`, remove: 'Rimuovi',
    apiOffline: 'Il servizio ricette su questo PC non risponde. Riavvia l’anteprima e riprova.',
    apiKey: 'Il servizio ricette non riesce a connettersi. Riprova più tardi.',
    apiModel: 'I suggerimenti di ricette sono temporaneamente indisponibili. Riprova più tardi.',
    usableIngredients: 'Aggiungi un alimento ancora utilizzabile oppure inserisci gli ingredienti in modalità Personalizzata.',
    noUsableItems: 'Nessun ingrediente utilizzabile in dispensa.',
  },
  fr: {
    sameDay: 'Le jour même', never: 'Jamais', expiryHint: 'Choisissez un ou plusieurs rappels. Les alertes sont prévues à 9 h.',
    webReminders: 'Les rappels sont envoyés par les applications Android et iPhone.',
    enableNotifications: 'Activer les notifications sur le téléphone',
    permissionDenied: 'Autorisez les notifications dans les réglages du téléphone pour recevoir les rappels.',
    deviceSettings: 'Ouvrir les réglages du téléphone',
    expiryAlert: (name, days) => days === 0 ? `${name} expire aujourd’hui.` : `${name} expire dans ${days} jour${days === 1 ? '' : 's'}.`,
    summaryAlert: 'Vérifiez les aliments qui expirent cette semaine.',
    plan: 'Ajouter au calendrier', planned: 'Recettes prévues', saved: 'Recette ajoutée au calendrier',
    nothingOnDay: 'Aucune péremption ni recette prévue pour ce jour.', calendarTitle: 'Calendrier',
    calendarSubtitle: 'Dates de péremption et recettes à cuisiner', openCalendar: 'Voir dans le calendrier',
    reminder: 'Rappel de cuisine', reminderTime: 'Heure du rappel (HH:MM)',
    invalidTime: 'Saisissez une heure à venir au format 24 heures, par exemple 18:00.',
    selectDay: 'Choisissez le jour pour cuisiner', selectedDay: 'Jour sélectionné', savePlan: 'Enregistrer dans le calendrier',
    removePlan: 'Retirer du calendrier', confirmRemove: (name) => `Retirer « ${name} » de ce jour ?`, remove: 'Retirer',
    apiOffline: 'Le service de recettes sur ce PC ne répond pas. Relancez l’aperçu et réessayez.',
    apiKey: 'Le service de recettes n’a pas réussi à se connecter. Réessayez plus tard.',
    apiModel: 'Les suggestions de recettes sont temporairement indisponibles. Réessayez plus tard.',
    usableIngredients: 'Ajoutez un aliment encore valable ou saisissez des ingrédients en mode Personnalisé.',
    noUsableItems: 'Aucun ingrédient utilisable dans votre garde-manger.',
  },
  de: {
    sameDay: 'Am selben Tag', never: 'Nie', expiryHint: 'Wähle eine oder mehrere Erinnerungen. Die Hinweise sind für 9:00 Uhr geplant.',
    webReminders: 'Erinnerungen werden über die Android- und iPhone-App zugestellt.',
    enableNotifications: 'Benachrichtigungen auf dem Handy aktivieren',
    permissionDenied: 'Erlaube Benachrichtigungen in den Geräteeinstellungen, um Erinnerungen zu erhalten.',
    deviceSettings: 'Geräteeinstellungen öffnen',
    expiryAlert: (name, days) => days === 0 ? `${name} läuft heute ab.` : `${name} läuft in ${days} ${days === 1 ? 'Tag' : 'Tagen'} ab.`,
    summaryAlert: 'Prüfe, welche Lebensmittel diese Woche ablaufen.',
    plan: 'Zum Kalender hinzufügen', planned: 'Geplante Rezepte', saved: 'Rezept zum Kalender hinzugefügt',
    nothingOnDay: 'Keine Ablaufdaten oder Rezepte für diesen Tag geplant.', calendarTitle: 'Kalender',
    calendarSubtitle: 'Ablaufdaten und geplante Rezepte', openCalendar: 'Im Kalender ansehen',
    reminder: 'Kocherinnerung', reminderTime: 'Uhrzeit der Erinnerung (HH:MM)',
    invalidTime: 'Gib eine zukünftige Uhrzeit im 24-Stunden-Format ein, zum Beispiel 18:00.',
    selectDay: 'Wähle einen Tag zum Kochen', selectedDay: 'Ausgewählter Tag', savePlan: 'Im Kalender speichern',
    removePlan: 'Aus dem Kalender entfernen', confirmRemove: (name) => `„${name}“ von diesem Tag entfernen?`, remove: 'Entfernen',
    apiOffline: 'Der Rezeptdienst auf diesem PC antwortet nicht. Starte die App-Vorschau neu und versuche es erneut.',
    apiKey: 'Der Rezeptdienst konnte keine Verbindung herstellen. Versuche es später erneut.',
    apiModel: 'Rezeptvorschläge sind vorübergehend nicht verfügbar. Versuche es später erneut.',
    usableIngredients: 'Füge ein haltbares Lebensmittel hinzu oder gib Zutaten im Modus Angepasst ein.',
    noUsableItems: 'Keine verwendbaren Zutaten im Vorrat.',
  },
};
