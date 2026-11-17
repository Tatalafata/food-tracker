import type { Language } from '@/store/i18n';

interface TimerCopy {
  title: string;
  add: string;
  name: string;
  nameExample: string;
  minutes: string;
  seconds: string;
  start: string;
  pause: string;
  resume: string;
  restart: string;
  remove: string;
  finished: string;
  hide: string;
  show: string;
  open: string;
}

export const timerCopy: Record<Language, TimerCopy> = {
  it: {
    title: 'Timer', add: 'Nuovo timer', name: 'Nome del timer', nameExample: 'Es. Pasta',
    minutes: 'Minuti', seconds: 'Secondi', start: 'Avvia', pause: 'Pausa', resume: 'Riprendi',
    restart: 'Riavvia', remove: 'Elimina timer', finished: 'Tempo scaduto',
    hide: 'Nascondi timer', show: 'Mostra il riquadro dei timer', open: 'Mostra tutti i timer',
  },
  en: {
    title: 'Timers', add: 'New timer', name: 'Timer name', nameExample: 'E.g. Pasta',
    minutes: 'Minutes', seconds: 'Seconds', start: 'Start', pause: 'Pause', resume: 'Resume',
    restart: 'Restart', remove: 'Delete timer', finished: 'Time is up',
    hide: 'Hide timers', show: 'Show the floating timers', open: 'Show all timers',
  },
  fr: {
    title: 'Minuteurs', add: 'Nouveau minuteur', name: 'Nom du minuteur', nameExample: 'Ex. Pâtes',
    minutes: 'Minutes', seconds: 'Secondes', start: 'Démarrer', pause: 'Pause', resume: 'Reprendre',
    restart: 'Redémarrer', remove: 'Supprimer le minuteur', finished: 'Temps écoulé',
    hide: 'Masquer les minuteurs', show: 'Afficher les minuteurs flottants', open: 'Voir tous les minuteurs',
  },
  de: {
    title: 'Timer', add: 'Neuer Timer', name: 'Name des Timers', nameExample: 'Z. B. Nudeln',
    minutes: 'Minuten', seconds: 'Sekunden', start: 'Starten', pause: 'Pause', resume: 'Fortsetzen',
    restart: 'Neu starten', remove: 'Timer löschen', finished: 'Zeit abgelaufen',
    hide: 'Timer ausblenden', show: 'Schwebende Timer anzeigen', open: 'Alle Timer anzeigen',
  },
};
