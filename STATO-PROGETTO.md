# Promemoria ChefSuggest

Aggiornato il 14 ottobre 2026. Questo file permette alle nuove chat di riprendere il lavoro senza dipendere dalla memoria della conversazione. Non inserire credenziali o dati personali.

## Decisioni del proprietario

- Product manager italiana senza esperienza di codice: spiegazioni semplici e supporto operativo.
- Android e iPhone sono le destinazioni principali. Il browser e l'anteprima veloce da aprire automaticamente durante il lavoro.
- Repository `Tatalafata/food-tracker`, lavoro direttamente su `main`, salvataggio automatico delle modifiche importanti completate dopo le verifiche. Nessun branch o fork aggiuntivo.

## Situazione attuale

- PoC Expo SDK 54 con dispensa, scadenze, scanner, calendario, ricette e impostazioni.
- Dati della dispensa e preferenze salvati localmente con AsyncStorage. Traduzioni: italiano, inglese, francese e tedesco.
- `Avvia-app.cmd` e `npm run preview` aprono l'anteprima; `--no-open` permette a Codex di mostrarla nel proprio pannello.
- `npm run check` esegue i controlli del codice. Il comando rapido distruttivo dello starter e stato rimosso.
- Librerie, file generati e collegamento annidato incompleto sono stati esclusi da Git, mantenendo i file locali. Le installazioni future usano `package-lock.json` tramite `npm ci`.

## Rinnovo grafico del 14 ottobre 2026

- Richiesta: interfaccia piu moderna, elegante e minimalista, conservando la famiglia di colori e schiarendo il verde. Tutte le schermate ora usano verde salvia pastello, fondo chiaro, schede con bordi discreti, icone lineari e spazi piu ampi. Il tema delle schermate e della navigazione resta coerentemente chiaro anche quando il dispositivo usa il tema scuro; non esiste un selettore di tema nell'app.
- Home con riepilogo della dispensa e pulsanti espliciti per aggiunta e scanner; navigazione a sei sezioni conservata. Componenti e stile condivisi in `components/ScreenHeader.tsx`, `components/ExpiryBadge.tsx` e `constants/theme.ts`. Nessuna dipendenza aggiunta.
- Pulsanti principali di almeno 48 punti, aree sicure aggiornate con `react-native-safe-area-context`, liste e calendario scorrevoli. Su schermi molto stretti alcune etichette della barra inferiore vengono abbreviate con puntini, mantenendo il nome completo per l'accessibilita.
- Corretti la data manuale che poteva slittare per la conversione UTC e il nome che spariva nella conferma del salvataggio. Il selettore ha colonne etichettate e valori toccabili; annullando e riaprendo si riparte dalla data confermata.
- L'aggiunta manuale e disponibile anche senza accesso alla fotocamera. La rimozione richiede una conferma condivisa fra app e anteprima web. Gli errori di salvataggio e ricette sono spiegati nella lingua scelta; i messaggi ricette appaiono anche vicino al pulsante utilizzato.
- Mesi e giorni del calendario seguono italiano, inglese, francese e tedesco. Preferenze e dati conservano le stesse chiavi di salvataggio.

### Verifiche del rinnovo

- `npm run check`: superato senza errori o avvisi. Diff rivisto e controllo spaziatura Git superato.
- Browser a 390 x 844 e 320 x 700: controllate tutte le sezioni, avvio iniziale con selezione ingredienti, aggiunta con e senza scadenza, conferma e annullamento della data, nome nella conferma, persistenza dopo ricaricamento, rimozione confermata e annullata, stati vuoti, conteggi e calendario con giorni pieni e vuoti.
- Ricette: controllate modalita veloce/personalizzata, selezione singola e globale, preferenze alimentari, ingredienti extra aggiunti e rimossi, note e messaggio per servizio non configurato. Non effettuate chiamate reali al servizio ricette.
- Verificate le quattro lingue e i relativi mesi del calendario. Controllata l'assenza di scorrimento orizzontale anche a 1280 punti.
- Prove con aggiunte e rimozioni eseguite sull'origine separata `127.0.0.1:8081`; la dispensa originale su `localhost:8081` e la lingua precedentemente selezionata sono state conservate. L'anteprima finale torna a `localhost:8081` e il server esistente rimane attivo.
- Export di produzione per Android e iOS con Hermes riuscito anche dopo il rinnovo. Non equivale a una prova su telefono: fotocamera/scansione reale, permessi, notifiche, tastiera, lettori di schermo e aree sicure su dispositivi reali restano da verificare.
- Console dell'anteprima senza errori; rimane l'avviso noto di Expo sulle notifiche non supportate nel browser.

## Limiti conosciuti e prove

- La generazione ricette dipende da un servizio esterno e legge una variabile pubblica nel client. Prima di usare chiavi reali serve una gestione sicura lato server.
- Fotocamera, notifiche, permessi e tastiera richiedono prove su Android e iPhone. In questa configurazione non sono stati usati dispositivi reali: non considerare l'app certificata per entrambi.
- Il salvataggio su GitHub non distribuisce l'app sugli store e non sincronizza la dispensa tra dispositivi.
- `npm run check`: superato, nessun errore o avviso del codice. I tre avvisi iniziali in ricette/impostazioni sono stati corretti senza cambiare il comportamento.
- Anteprima riusata correttamente con `npm run preview -- --no-open`. Verificate home, impostazioni, modalita ricette e selezione ingredienti nel browser a 390 x 844; nessuna chiamata al servizio ricette.
- Export di produzione Expo per Android e iOS con bytecode Hermes: riuscito per entrambe le piattaforme. Su questo PC il compilatore Hermes ha richiesto esecuzione fuori dal sandbox. L'export verifica la preparazione del codice, non l'installazione o il comportamento su telefoni reali.
- `npm ci --dry-run --ignore-scripts --offline --no-audit --no-fund`: riuscito; verificata la coerenza tra package e lockfile senza reinstallare o aggiornare le librerie locali. Alcune versioni installate localmente differiscono dal lockfile; non e stata simulata un'installazione completa su un nuovo computer.

## Prossima richiesta

Nessuna nuova funzionalita di prodotto concordata. Aprire l'anteprima e seguire la richiesta della product manager, con priorita all'uso sul cellulare.
