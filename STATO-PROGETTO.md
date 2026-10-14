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
