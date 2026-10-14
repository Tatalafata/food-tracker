# Promemoria ChefSuggest

Aggiornato il 15 ottobre 2026. Questo file permette alle nuove chat di riprendere il lavoro senza dipendere dalla memoria della conversazione. Non inserire credenziali o dati personali.

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

- La generazione ricette usa ora un servizio OpenAI locale con chiave privata lato server. Per telefoni e distribuzione occorre ancora un backend HTTPS autenticato (vedi sezione Integrazione OpenAI).
- Fotocamera, notifiche, permessi e tastiera richiedono prove su Android e iPhone. In questa configurazione non sono stati usati dispositivi reali: non considerare l'app certificata per entrambi.
- Il salvataggio su GitHub non distribuisce l'app sugli store e non sincronizza la dispensa tra dispositivi.
- `npm run check`: superato, nessun errore o avviso del codice. I tre avvisi iniziali in ricette/impostazioni sono stati corretti senza cambiare il comportamento.
- Anteprima riusata correttamente con `npm run preview -- --no-open`. Verificate home, impostazioni, modalita ricette e selezione ingredienti nel browser a 390 x 844; nessuna chiamata al servizio ricette.
- Export di produzione Expo per Android e iOS con bytecode Hermes: riuscito per entrambe le piattaforme. Su questo PC il compilatore Hermes ha richiesto esecuzione fuori dal sandbox. L'export verifica la preparazione del codice, non l'installazione o il comportamento su telefoni reali.
- `npm ci --dry-run --ignore-scripts --offline --no-audit --no-fund`: riuscito; verificata la coerenza tra package e lockfile senza reinstallare o aggiornare le librerie locali. Alcune versioni installate localmente differiscono dal lockfile; non e stata simulata un'installazione completa su un nuovo computer.

## Integrazione OpenAI

- Chiave inserita dal proprietario e caricata nel servizio. Primo tentativo bloccato per credito esaurito; dopo la ricarica, prova reale riuscita: due suggerimenti in italiano ricevuti tramite il servizio locale con pasta, pomodori, olio e ceci. I suggerimenti erano molto simili: qualita e varieta richiedono altre valutazioni; non considerare questa prova una validazione delle restrizioni alimentari. Aggiunto messaggio dedicato al credito esaurito nelle quattro lingue. Il server deve partire fuori dal sandbox per raggiungere OpenAI su questo PC (altrimenti EACCES).

- Ricette migrate al servizio locale `server/recipes.mjs` con GPT-4.1 nano. Chiave privata `OPENAI_API_KEY` in `.env`, nessuna chiave nel client. Avvio con `npm run api`; guida in `OPENAI-SETUP.md`.
- Cinque ricette complete, massimo 5.000 token in uscita, cache giornaliera, 20 tentativi/giorno e intervallo 30 secondi. Limiti in memoria, azzerati al riavvio: non costituiscono un limite di spesa persistente.
- Il server ascolta solo su loopback. Per telefoni e distribuzione resta necessario un backend HTTPS autenticato con limiti persistenti. Configurazione client tramite `EXPO_PUBLIC_RECIPES_API_URL`.
- Test automatici con risposte simulate superati; collegamento reale OpenAI verificato dopo la ricarica. Il servizio rimane attivo sul PC. Qualita delle ricette ancora da valutare con altri ingredienti e preferenze.
- `npm run check` e `npm run test:api` superati. In anteprima verificata la chiamata al servizio e il messaggio senza chiave. Creato `.env` locale con soli segnaposto, escluso da Git; servizio locale avviato senza credenziali.

## Prossima richiesta

### Ricette complete e porzioni

- Proposte toccabili: aprono una finestra con ingredienti quantificati per una persona e preparazione numerata. Pulsanti +/meno da 1 a 12 persone; dosi calcolate sul dispositivo senza ulteriori chiamate OpenAI. Le dosi citate nei passaggi usano riferimenti agli ingredienti e si aggiornano; temperature e tempi restano invariati.
- Formato OpenAI aggiornato con ingredienti strutturati e passaggi, validazione condivisa fra server e client. Il server richiede quantita numeriche anche per condimenti. Modello GPT-4.1 nano conservato; limite risposta portato da 800 a 2.200 token. Stima aggiornata in OPENAI-SETUP.md.
- Controlli TypeScript/lint e quattro test automatici superati, inclusi moltiplicazione, frazioni, limiti porzioni e rifiuto di ricette incomplete/riferimenti non validi. Export Android/iOS riuscito. Prove native sul telefono ancora necessarie.
- Anteprima Expo riavviata fuori dal sandbox dopo un errore di rete all'avvio. Server locale OpenAI riavviato con il nuovo schema; chiave privata mai esposta.
- Prova reale nel browser: ricette con salmone, spinaci, olio e patate; apertura/chiusura, ritorno a una porzione alla riapertura, moltiplicazione 1/2 persone e blocco ai limiti 1/12 verificati. Dati della dispensa conservati. I riferimenti alle dosi ripartiscono proporzionalmente l'ingrediente se il modello assegna quote complessive superiori al totale; controllata la pulizia delle unita duplicate. Qualita culinaria ancora da valutare; nessun test su telefoni reali.

Ricette complete con porzioni concordate e implementate. Seguire le prossime richieste della product manager, con priorita all'uso sul cellulare.

### Cinque proposte per richiesta

- Il precedente numero di due ricette era un limite esplicito del codice, non un effetto dei troppi ingredienti. Su richiesta della product manager, generazione portata a cinque ricette complete in una sola chiamata, con combinazioni e preparazioni diverse.
- Numero condiviso fra client e server, validazione di cinque ricette complete con titoli diversi. Il client e il server rifiutano risposte incomplete; cache, limite di 20 richieste/giorno e 30 secondi fra chiamate conservati. Il modello resta GPT-4.1 nano. Budget risposta 5.000 token e timeout adattati al testo piu lungo; stima dei costi aggiornata in OPENAI-SETUP.md.
- Mostrato il numero delle proposte sopra l'elenco nelle quattro lingue. Quantita, preparazione completa e ricalcolo porzioni conservati.
- Sei test automatici superati: batch di cinque, rifiuto batch da due/quattro/sei o incompleti/duplicati, cache completa, limiti, errori credito/chiave e calcolo porzioni. Prova reale in anteprima con cinque risultati; quinta ricetta aperta e dosi raddoppiate da una a due persone. Nessuna modifica alla dispensa o alle preferenze salvate. Test su telefoni reali ancora da fare.

### Ricette facili, veloci e accenti avocado/lime — 15 ottobre

- Product manager ha confermato due filtri funzionanti e piccoli ritocchi di colore. Sezione Come vuoi cucinare vicina alle preferenze alimentari, presente in entrambe le modalita. Facili richiede tecniche di base e 4-6 passaggi; Veloci richiede tempo totale stimato entro 30 minuti, preparazione e preriscaldamento inclusi. Opzioni combinabili, disabilitate durante la richiesta. Cambiando filtri o preferenze alimentari si cancellano i risultati precedenti.
- Accenti avocado/lime pastello su filtri, pulsante, schede e dettaglio, con piccolo accento caldo sulla difficolta. Nessuna dipendenza aggiunta. Componenti React Native e pulsanti di almeno 48 punti.
- Schede e dettaglio mostrano difficolta e tempo stimato. Schema OpenAI impone esattamente cinque ricette, intervalli di passi/tempi e difficolta secondo i filtri; validazione aggiuntiva sul server e nel client. Il tempo reale e la semplicita culinaria non sono verificabili con questi controlli automatici.
- Richieste piu esplicite su pesi per una persona, calore, durata delle fasi, tagli, segni di cottura, ingredienti e restrizioni. Dosi dei passaggi ricevute come riferimenti strutturati: server/recipe-output.mjs le converte nel formato ricalcolabile gia usato dal dettaglio. Evita di dipendere dalla scrittura dei segnaposto da parte del modello. Cache distingue le due nuove preferenze; stesso GPT-4.1 nano, una chiamata per cinque ricette, massimo 5.000 token, limiti esistenti. Nessuna revisione aggiuntiva a pagamento o tentativo automatico.
- Risposte incomplete o fuori dai filtri mostrano un messaggio specifico nelle quattro lingue, distinto da problemi di connessione. Una risposta rifiutata puo comunque consumare una chiamata OpenAI; il modello puo ancora produrre dati non validi.
- Valutazione qualitativa: base utile per trovare idee, ancora inferiore a un ricettario collaudato. Nelle prove salmone/spinaci/patate restano proposte simili, istruzioni talvolta generiche, condimenti ripetuti e ingredienti extra non richiesti (es. uova). La normalizzazione preesistente delle quote delle dosi resta una correzione matematica, non una verifica della correttezza culinaria. Per ulteriore qualita servono campioni diversi, valutazioni in cucina e, se richiesto, ricette di riferimento curate; non aumentare automaticamente il costo del modello.
- Controlli TypeScript/lint e 12 test automatici superati: filtri, schema, cache, rifiuto dati incoerenti, conversione delle dosi, porzioni e precedenti casi errore. Prova reale in anteprima riuscita con cinque ricette facili/veloci e dosi da 150 a 300 g di salmone e da 200 a 400 g di patate per due persone; tempi e temperatura conservati. Cache e cancellazione risultati al cambio filtro verificate nel browser. Dati della dispensa conservati.
- Prove Android/iOS reali ancora necessarie: la vista stretta del browser non equivale a una prova su telefono. Nessuna certificazione della qualita delle ricette o di tutte le restrizioni alimentari.
- Browser a 390 x 844 e 320 x 700: controllati filtri combinati in Veloce/Personalizzato, attivazione/disattivazione, tempi/difficolta nelle schede e nel dettaglio, ricalcolo dosi, cache e assenza di scorrimento orizzontale. Etichette nuove verificate in italiano, inglese, francese e tedesco. Lingua inglese originale ripristinata, extra e selezioni delle prove rimossi, una sola scheda lasciata aperta sulla schermata Ricette; server mantenuti attivi.
- Seconda prova reale: filtri Facili + Veloci + Vegano con ceci cotti/riso/pomodori/zucchine/olio e uova/latte tra gli ingredienti disponibili. Una risposta rifiutata ha mostrato il messaggio dedicato; ripetendo, cinque proposte con ingredienti dichiarati vegani e tempi stimati 15-30 minuti. Uova e latte vaccino esclusi nelle liste, ma il modello ha aggiunto latte di soia non disponibile: coerenza con la dispensa e qualita culinaria richiedono ulteriori miglioramenti. Non equivale a validare tutte le restrizioni o allergie.
