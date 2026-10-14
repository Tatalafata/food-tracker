# Lavorare su Food Tracker / ChefSuggest

## Collaborazione con la product manager
- Comunica in italiano, in modo comprensibile a chi non conosce il codice. Spiega il risultato e come provarlo; traduci gli errori tecnici in conseguenze e soluzioni pratiche.
- Una richiesta di modifica autorizza a realizzarla e verificarla. Risolvi autonomamente i problemi ordinari. Chiedi chiarimenti solo per decisioni di prodotto determinanti o impedimenti reali; proponi una scelta semplice.
- Se l'utente dice soltanto "iniziamo una sessione", controlla il progetto, apri l'anteprima e chiedi quale risultato desidera. Non inventare funzionalita.
- All'inizio di una nuova sessione consulta `STATO-PROGETTO.md` per conoscere limiti e verifiche precedenti. Per cambiamenti importanti aggiorna questo promemoria con controlli e prove ancora necessarie.

## Priorita: app Android e iPhone
- Il prodotto e un'app per cellulare Android e iOS. L'anteprima web serve a vedere rapidamente il lavoro.
- Progetta prima per schermi piccoli: contenuti leggibili, pulsanti facili da toccare (almeno 48 x 48 punti quando possibile), aree sicure, scorrimento e tastiera che non copra i campi.
- Mantieni la compatibilita con entrambe le piattaforme. Usa componenti React Native e dipendenze compatibili con Expo SDK 54; evita soluzioni solo browser per le funzioni dell'app.
- Gestisci permessi concessi e negati, caricamenti, errori di rete e stati vuoti. Non introdurre regressioni nei dati salvati sul dispositivo o nelle traduzioni.
- Per modifiche visive controlla l'anteprima anche a larghezza telefono. Per fotocamera, notifiche, permessi e tastiera verifica su Android/iOS se disponibili; altrimenti indica le prove ancora da fare. Non dichiarare test mobile eseguiti basandoti sul browser.

## Anteprima automatica nelle chat di lavoro
- Quando l'utente chiede nuove funzionalita, correzioni, modifiche a interfaccia/impostazioni o l'avvio di una sessione, apri subito l'anteprima accanto alla chat, senza attendere una richiesta separata.
- Esegui `npm run preview -- --no-open`. Il comando riusa il server di questa cartella se gia attivo e stampa l'indirizzo; altrimenti avvia Expo su una porta libera tra 8081 e 8090. Mantieni vivo il processo durante il lavoro.
- Attendi che l'indirizzo risponda e usa `open_in_codex` con destinazione browser e quell'URL. Se disponibile, usa il controllo browser per provare il flusso e mantenere la scheda come risultato visibile. La semplice apertura non costituisce una verifica.
- Le modifiche si aggiornano tramite Expo Fast Refresh; ricarica se necessario. Riusa scheda e server esistenti, senza duplicarli a ogni messaggio. Non interrompere server di altri progetti.
- Se gli strumenti per aprire il pannello mancano, fornisci il link locale cliccabile e continua con quelli disponibili. Le istruzioni della repository non possono garantire funzioni assenti dalla sessione.
- Su Windows si puo anche fare doppio clic su `Avvia-app.cmd`. Per un telefono usa `npm start`, computer e telefono sulla stessa rete e un client compatibile con SDK 54; usa una development build per le funzioni che la richiedono.

## GitHub: flusso autorizzato dal proprietario
- Lavora direttamente su `main` di `Tatalafata/food-tracker`. Non creare branch, fork o pull request senza una nuova richiesta esplicita.
- Il proprietario autorizza gia commit e push su `origin/main` al completamento di ogni funzionalita significativa, modifica di interfaccia/impostazioni, correzione o miglioramento della configurazione. Non richiedere una conferma separata per ogni salvataggio. Proposte e lavori incompleti non vanno pubblicati come funzionalita finite.
- Prima di modificare controlla branch, stato Git e aggiornamenti remoti (`git fetch origin`). Conserva il lavoro locale esistente. Se il progetto e pulito e solo indietro, sincronizza con `git merge --ff-only origin/main`. Se il remoto non e raggiungibile puoi proseguire localmente, segnalando il limite.
- Prima di salvare esegui `npm run check`, prova il flusso interessato e rivedi il diff. Correggi i problemi introdotti; distingui eventuali problemi gia presenti e verifiche native non disponibili.
- Aggiungi soltanto percorsi espliciti pertinenti con `git add -- <file...>`. Non usare `git add .`, `git add -A` o commit che includano modifiche altrui per errore. Per file con lavoro preesistente includi soltanto le modifiche della richiesta.
- Non includere chiavi API, `.env`, librerie locali, log o output di compilazione. `node_modules` e i file generati devono restare esclusi da Git.
- Crea un commit descrittivo e invialo con `git push origin main`. Verifica che GitHub abbia ricevuto il commit e comunicalo in parole semplici con un link.
- Se il push viene rifiutato, conserva il commit e controlla gli aggiornamenti: risolvi solo conflitti di cui conosci il risultato corretto. Non usare force push, reset distruttivi, cancellazioni di lavoro o modifiche alle protezioni del repository. Se manca l'accesso GitHub guida l'utente nel login senza chiedere password o token in chat. Non dichiarare il lavoro salvato online finche il push non riesce.

## Progetto e comandi
- Expo SDK 54, React Native, TypeScript, Expo Router. Schermate in `app/`, componenti in `components/`, stato e traduzioni in `store/`, colori in `constants/theme.ts`.
- `npm ci`: installazione riproducibile delle dipendenze; `npm run preview`: anteprima web; `npm start`: sviluppo mobile; `npm run check`: TypeScript e lint. Non serve reinstallare le dipendenze a ogni sessione.
- Su questo PC Node.js e Git sono in `C:\Program Files\nodejs` e `C:\Program Files\Git\cmd`. Se mancano dal PATH, aggiungili al PATH della sessione.
- Non eseguire `scripts/reset-project.js`: e lo script distruttivo dello starter Expo, non serve a questa app.
- Le ricette leggono `EXPO_PUBLIC_ANTHROPIC_API_KEY`. Le variabili `EXPO_PUBLIC_*` sono incluse nel client: non inserire una chiave privata reale per setup o commit. L'uso reale richiede gestione dei segreti lato server; non configurarla implicitamente.
