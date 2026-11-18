# Promemoria Make It Dinner!

Aggiornato il 18 novembre 2026. Questo file permette alle nuove chat di riprendere il lavoro senza dipendere dalla memoria della conversazione. Non inserire credenziali o dati personali.

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

### Palette estesa a tutta l'app — 15 ottobre

- Richiesta di portare lo stile avocado/lime delle Ricette anche a Home, Dispensa, Scansione, Calendario e Impostazioni. Aggiornati pulsanti, schede color crema, bordi lime, selezioni e barra inferiore; dettagli caldi su azioni secondarie e legenda. Anche aggiunta manuale, selettore data e avvio iniziale usano la stessa palette. Colori di scaduto/in scadenza/fresco conservati, nessuna modifica alle funzioni o alle chiavi dei dati.
- Stili condivisi in constants/theme.ts; superficie delle ricette centralizzata mantenendo lo stesso valore. Nessuna nuova dipendenza o chiamata OpenAI.
- npm run check superato. Browser: tutte le sei sezioni a 320 x 700 senza scorrimento orizzontale; Home e Impostazioni anche a 390 x 844. Controllati navigazione, apertura/annullamento conferma rimozione, modulo manuale, interruttore senza scadenza, apertura/annullamento selettore data, selezione giorno del calendario e cambio lingua. Nessun elemento della dispensa aggiunto o rimosso. Lingua inglese originale ripristinata; una sola anteprima aperta sulla Home, dimensioni del browser ripristinate e server mantenuto attivo.
- Le prove restano nel browser: fotocamera, permessi, notifiche, tastiera e resa su telefoni Android/iOS reali ancora da verificare. Nessun nuovo export nativo in questa modifica di colori.

### Richiesta di un nome

- L'utente chiede una proposta di nome utilizzabile in Europa, non di cambiare gia il marchio nell'app. Candidato proposto: Dispiva (richiamo a dispensa viva). Ricerca preliminare TMview del 15 ottobre: nome identico senza risultati; ricerca fuzzy con somiglianze, fra cui DISPIVAL registrato in Spagna per vernici e vecchie voci DISTIVA bulgare mostrate come scadute/terminate. Non dichiarare il nome legalmente libero: prima dell'adozione serve verifica professionale dei diritti anteriori e dei mercati di lancio. Domini e disponibilita negli store non verificati direttamente. Nome attuale ChefSuggest conservato.

## Avvisi, ricette nel calendario e ripristino delle ricette — 17 novembre

- In Impostazioni si possono combinare avvisi di scadenza 3, 2 o 1 giorno prima e il giorno stesso. Gli avvisi vengono programmati alle 9:00 locali. Mai annulla gli avvisi di scadenza e il riepilogo giornaliero. Le vecchie preferenze attive mantengono il proprio anticipo, compresi i 2 giorni. Le scadenze già salvate restano nella dispensa. Su Android e iPhone serve il permesso per consegnare gli avvisi.
- Dal dettaglio di una ricetta si può scegliere un giorno e, facoltativamente, l'ora del promemoria. Il calendario evidenzia le ricette e le scadenze anche quando coincidono. La ricetta intera e le porzioni sono salvate sul dispositivo e riapribili senza chiamare OpenAI. I promemoria delle ricette sono indipendenti dagli avvisi di scadenza.
- L'anteprima avvia o riusa anche il servizio locale delle ricette. GPT-4.1 nano era stato ritirato, confermato dal rifiuto di OpenAI. Il servizio usa ora GPT-5.6 Luna, sostituto indicato dalla documentazione, con una chiamata per cinque ricette, limite di 5.000 token in uscita, cache e limiti giornalieri esistenti. Tariffe ed esempio aggiornati in OPENAI-SETUP.md. I prodotti scaduti sono esclusi dalla selezione e dalle richieste ricette.
- Nel browser a 390 e 320 punti: combinazione 3 giorni e giorno stesso, persistenza, Mai, quattro lingue, cinque ricette generate con OpenAI, scelta del giorno, rifiuto di un'ora non valida, salvataggio alle 19:15, riapertura con dosi per due dopo ricaricamento e presenza simultanea di ricetta e scadenza. Prove su un indirizzo locale separato dai dati ordinari. Controlli del codice e 12 test del servizio superati. Export Expo per Android e iOS riuscito.
- Restano da provare sui telefoni i permessi e la consegna degli avvisi con app chiusa, la tastiera per l'orario e la cancellazione degli avvisi dopo Mai o rimozione di una ricetta. Per generare nuove ricette dai telefoni serve ancora un servizio HTTPS accessibile e protetto.

### Rimozione in blocco degli scaduti

- In Dispensa, **Rimuovi tutti gli scaduti** compare quando c’è almeno un prodotto con data precedente a oggi. La conferma indica quanti prodotti verranno rimossi. Le date di oggi, quelle future e i prodotti senza scadenza restano in dispensa. È sempre possibile rimuovere un singolo prodotto.
- Controlli del codice superati. Nel browser a 320 punti verificati pulsante, conteggio e annullamento, anche per la rimozione singola. La rimozione in un solo salvataggio, il recupero da un errore di scrittura e la conservazione dei prodotti aggiunti durante la conferma sono stati verificati con dati simulati.

### Preferenze alimentari e modifica della dispensa

- In Ricette, il pulsante **+** accanto alle preferenze alimentari salva nome e descrizione di una preferenza o restrizione e la seleziona per la ricerca corrente. In Impostazioni si possono attivare come predefinite sia le opzioni standard sia quelle personalizzate. Sono salvate sul dispositivo e si applicano all'apertura di Ricette; le modifiche fatte direttamente in Ricette durano fino a quando si lascia la schermata. La richiesta a OpenAI include solo le preferenze attive con le relative descrizioni.
- In Dispensa, toccando un prodotto si possono modificare nome, scadenza, codice a barre e note. Il salvataggio aggiorna la stessa voce, il calendario e i promemoria associati. Le note sono visibili sulla scheda in dispensa e restano sul dispositivo.
- Controlli del codice, 12 test del servizio ed export per entrambi i telefoni riusciti. Browser a 390 e 320 punti: creazione di una preferenza, persistenza dei valori predefiniti, modifica temporanea, aggiornamento di tutti i campi del prodotto, riapertura, annullamento, rimozione della scadenza, calendario e aggiunta manuale. Prova OpenAI riuscita con cinque ricette per la preferenza dimostrativa «solo fornelli». Il rispetto delle allergie non è stato validato. Tastiera e consegna degli avvisi dopo modifica restano da provare sui telefoni reali; aggiornamento dei promemoria verificato con dati simulati.

### Ricettario

- Il libro in alto a destra in Ricette apre Preferiti, Cronologia e Ispirazione. Nel dettaglio la stella salva o rimuove il preferito. **L’ho cucinata** registra la ricetta e la data nella vista Cucinate della Cronologia. Le ricerche effettuate dalla nuova versione restano raggruppate per data e ora. Le schede e le porzioni salvate si riaprono dal dispositivo.
- Ispirazione contiene otto ricette in quattro lingue, filtrabili per Salate, Dolci e Vegane. Sono adattamenti di [Wikibooks Cookbook](https://en.wikibooks.org/wiki/Cookbook:Recipes) con dosi metriche per una persona e passaggi riformulati. Ogni dettaglio rimanda alla fonte e alla licenza [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Le ricette sono incluse nell’app e si possono programmare nel calendario senza generazione OpenAI.
- Browser a 320 e 390 punti. Verificati stato iniziale, filtri, fonti, stella, ricette cucinate, salvataggio delle porzioni e riapertura dopo ricaricamento. Una ricetta del catalogo è stata programmata e riaperta dal calendario. Una ricerca reale di cinque ricette è stata ritrovata, con tutte le schede, nella Cronologia dopo il ricaricamento. Controlli del codice e 12 test del servizio superati. Restano da provare il flusso sui telefoni reali e le preparazioni in cucina.

### Ricerca in Ispirazione e timer di cucina

- Ispirazione cerca in 1.281 schede, fra cui più di 700 ricette in italiano. La ricerca ignora accenti e maiuscole e si combina con i filtri Salate, Dolci e Vegane. Le schede online aprono Wikibooks nella lingua indicata. Nel catalogo ci sono 572 foto Wikimedia Commons con autore e licenza verificabili; le schede senza una foto verificata mostrano un'icona. Le otto ricette già integrate conservano porzioni, preferiti e calendario. Il catalogo non usa OpenAI; `node scripts/update-inspiration.mjs` aggiorna il suo indice.
- In Home si avviano più timer con nome, minuti e secondi. Si possono mettere in pausa, riprendere, riavviare o eliminare singolarmente. Il riquadro compatto rimane consultabile nelle altre schermate, anche durante la lettura di una ricetta. La croce nasconde il riquadro e lascia i timer in funzione; dalla Home si può mostrare di nuovo. I timer e la scelta di nascondere il riquadro persistono dopo la riapertura. Gli avvisi di fine timer usano le notifiche locali quando autorizzate.
- Browser a 320 e 390 punti: ricerca per nome, risultato senza corrispondenze, filtri, caricamento di foto, dettaglio di una ricetta integrata, due timer contemporanei, scadenza, pausa e ripresa, riquadro in altre schermate, chiusura e persistenza dopo ricaricamento. Verificare sui telefoni reali il suono e la consegna degli avvisi con app in secondo piano o chiusa e l'inserimento dei tempi con la tastiera nativa.

### Foto selezionate e filtri di Ispirazione

- **Filtri** accanto alla ricerca apre un pannello con tipo di piatto, tempo totale, difficoltà, preferenze alimentari e una scelta per le schede con foto. Le scelte si combinano e il pulsante mostra il numero di risultati prima di applicarle. Tempo e difficoltà usano i dati dichiarati dalle ricette. Le preferenze alimentari disponibili dipendono dalle categorie del catalogo e non sostituiscono la verifica degli ingredienti.
- Il catalogo cerca sempre in 1.281 schede. Una selezione di 68 foto reali illustra 77 ricette. Le immagini sono state scelte per inquadratura e pertinenza. La griglia mostra titolo, tempo e difficoltà quando disponibili. Le attribuzioni previste dalle licenze sono in **Impostazioni → Crediti fotografici**. L'indice dei tempi e delle categorie si aggiorna con `node scripts/update-inspiration-facts.mjs` dopo l'aggiornamento del catalogo.
- Nel browser a 320 e 390 punti sono stati verificati caricamento delle foto, filtri combinati, conteggio, annullamento, azzeramento, ricerca, dettaglio di una ricetta e apertura dei crediti con due timer nel riquadro. Resta da verificare il pannello sui telefoni reali.

### Lista della spesa e attrezzatura da cucina

- La Home apre la lista della spesa e mostra quante voci sono da comprare. Si possono aggiungere prodotti con una quantità facoltativa, spuntarli e rimuoverli. La lista si salva sul dispositivo. La spunta indica un acquisto e non modifica la dispensa.
- Il dettaglio delle ricette nell'app aggiunge gli ingredienti mancanti con le quantità delle porzioni selezionate. Il confronto usa il nome (con equivalenze alimentari comuni nelle quattro lingue) e ignora i prodotti scaduti. La dispensa non tiene le quantità. Gli ingredienti ancora da comprare non vengono duplicati e una voce già spuntata può tornare tra quelle da comprare.
- In Impostazioni → Attrezzatura da cucina si possono spuntare 30 apparecchi e utensili divisi per uso. La selezione si salva sul dispositivo e si applica ai nuovi suggerimenti in modalità Veloce e Personalizzato. Se l'elenco è vuoto la richiesta non impone limiti sulle attrezzature.
- Verificati nel browser a 320 e 390 punti aggiunta manuale, spunta, rimozione, persistenza, dosi per due, confronto con un ingrediente in dispensa e uno scaduto, assenza di doppioni, navigazione dalla ricetta e salvataggio delle attrezzature. Una richiesta reale con la sola friggitrice ad aria ha prodotto cinque ricette che la usano. Controlli del codice, 12 test del servizio ed export Android e iOS riusciti. Tastiera e navigazione restano da provare sui telefoni reali.

### Cronologia delle ricette e feedback

- La Cronologia mostra soltanto le ricette segnate con **L’ho cucinata**, a partire dalla più recente. Le ricerche passate non vengono più caricate e le nuove generazioni non vengono registrate automaticamente. Le ricette già segnate e i preferiti conservano porzioni e date.
- **Impostazioni → Feedback** apre un campo di testo di 2.000 caratteri. Quando è collegato un modulo Formspree, l’app invia il testo e mostra la conferma dopo la risposta del servizio. La casella privata del progetto non è ancora collegata. Vedi [FEEDBACK-SETUP.md](FEEDBACK-SETUP.md) per collegarla e provare la ricezione.
- Nel browser a larghezza telefono sono stati verificati esclusione delle ricette soltanto aperte o generate, spunta e rimozione dalla Cronologia, persistenza, preferiti e apertura del modulo senza casella. Invio, limite e risposta di errore sono stati verificati con risposte simulate. Restano da provare la consegna alla casella reale e la tastiera sui telefoni.

### Testi delle ricette, zona e profilo facoltativo

- I testi pubblici del servizio ricette descrivono gli ingredienti, le preferenze e gli stati di caricamento o errore nelle quattro lingue. Da **Impostazioni → Profilo e zona** si può aggiungere o rimuovere una zona a mano, anche come ospite. La zona orienta la scelta di ingredienti comuni nei nuovi suggerimenti in entrambe le modalità.
- La copia online si salva e si ripristina su richiesta con accesso via codice email. Include dispensa, spesa, ricettario, calendario e preferenze. L’app chiede conferma prima di sostituire una copia o i dati del dispositivo. L’accesso reale richiede un progetto Supabase e le relative impostazioni email. I passaggi sono in [PROFILE-SETUP.md](PROFILE-SETUP.md).
- Provati nel browser a larghezza telefono i testi delle due modalità Ricette e il salvataggio, la persistenza e la rimozione della zona senza account. Provati con risposte simulate accesso, copia, conflitto di scrittura e recupero di un ripristino interrotto. In PostgreSQL locale verificato che due account vedano soltanto le proprie copie. Restano da provare la consegna dei codici e il passaggio fra due telefoni su un progetto Supabase configurato.

### Lettura delle ricette e tutorial iniziale

- Le schede di Ispirazione aprono il dettaglio nell’app. Per le schede del catalogo Wikibooks, il lettore carica il testo online nella lingua della fonte e mostra ingredienti, passaggi e attribuzione. Chiudendo il dettaglio si ritrovano ricerca e filtri. In caso di problemi di connessione si può riprovare.
- Al primo avvio il tutorial di quattro schermate precede la scelta degli ingredienti della dispensa. La croce mostra dove rivederlo. **Impostazioni → Tutorial** lo riapre anche per chi aveva già configurato la dispensa.
- Browser a 320 × 700: verificati il primo avvio con tutorial completato e saltato, il passaggio alla dispensa, la persistenza dopo la ricarica e la riapertura dalle Impostazioni in italiano. Tiramisù e Apple Pie I hanno mostrato ingredienti e preparazione nell’app. La ricerca è rimasta disponibile alla chiusura del dettaglio. `npm run check` ed export Android e iOS riusciti. La navigazione e la resa su telefoni reali restano da verificare.

### Beta Android, catalogo offline, timer e profilo — 18 novembre

- Il primo APK è stato installato dalla product manager e ha evidenziato che la lettura di Ispirazione poteva essere bloccata da Wikibooks. Verificato che le richieste con il solo header del browser potevano essere rifiutate, mentre con un User-Agent appropriato funzionavano. I 1.276 testi Wikibooks dell’indice sono ora inclusi nell’app, con collegamento alla revisione originaria. Rimangono i dettagli delle ricette curate e il caricamento online per eventuali aggiunte prive di copia locale. Le foto di catalogo restano da scaricare.
- Un timer può partire con la sola durata e riceve un nome predefinito nella lingua dell’app. Da **Impostazioni → Profilo e zona** si possono salvare nome, cognome e zona facoltativi, anche come ospite. Nome e cognome entrano nella copia online su richiesta e non vengono inviati al servizio ricette. Il backup accetta ancora copie precedenti senza questi campi.
- Nel browser verificati due timer simultanei con e senza nome, il salvataggio e la rimozione del cognome, la persistenza di nome e zona dopo la ricarica e la resa a 360 punti. Verificate le sezioni di Apple Pie I e Tiramisù e il mantenimento della ricerca. Controllata la presenza di tutti i testi pubblicati.
- Il motore locale ha prodotto cinque ricette in una prova reale su ingredienti dimostrativi. L’APK continua a richiedere un servizio HTTPS per generare ricette fuori dal computer. Anche la copia online richiede l’attivazione del progetto Supabase e della consegna dei codici email. Nessuna chiave privata va inclusa negli APK.
- La versione Android di prova è compilata da una copia separata dei sorgenti sotto `tatalafata/chefsuggest` su Expo. Il repository conserva il collegamento Expo precedente. Nelle versioni di prova riusare il progetto, la firma e l’identificativo Android già usati per installare l’aggiornamento sopra la prima beta.

### Opzioni per il nome

- Il controllo preliminare in Swissreg e TMview ha esaminato **Dispiva**, **Pantravia** e **Cucinido**. Nessuna corrispondenza identica trovata. Dispiva ricorda «dispensa viva» ed è la prima scelta per il Ticino. Pantravia è più internazionale. Cucinido evoca la cucina di casa, con vicinanza a CUCININO nel settore alimentare e della ristorazione. Risultati da approfondire con ricerca di similitudine professionale nei territori di lancio, in particolare per il software e i servizi online. Nessun cambio del nome della beta.

### Servizio ricette fuori dal PC — 18 novembre

- Collegato e riattivato il progetto Supabase **food app**. Pubblicata la funzione `recipes`, che riusa il generatore del PC. L’app può creare una sessione ospite e conserva il token di rinnovo in SecureStore. La beta usa soltanto l’URL della funzione e la chiave Publishable del progetto.
- Il database riserva una quota prima della chiamata a OpenAI. Verificati permessi, intervallo di 30 secondi per ospite, cinque richieste per ospite e 20 globali al giorno UTC in una transazione annullata. Verificati il rifiuto senza sessione, l’accesso ospite e l’arrivo della prova a OpenAI. Verifiche locali, 13 test del servizio ed export Android e iOS riusciti.
- Dopo l’autorizzazione della product manager, la chiave OpenAI del PC è stata salvata nel segreto dedicato `CHEFSUGGEST_OPENAI_API_KEY` di Supabase. Una sessione ospite ha ricevuto cinque ricette valide con entrambi i filtri Facili e Veloci attivi. L’aggiornamento Android con il collegamento online è in preparazione insieme ad altre modifiche richieste dalla product manager. La prova sul telefono resta da fare.

### Make It Dinner! 1.0.3 — nome, note e scanner

- Il nome scelto dalla product manager è **Make It Dinner!**. Aggiornati il nome del pacchetto visibile sul dispositivo, la Home, il tutorial e i promemoria. Gli identificativi tecnici e le chiavi dei dati locali mantengono la compatibilità con la beta precedente.
- Il dettaglio di una ricetta contiene **Note personali**. **Ricettario → Note** riapre le ricette con appunti anche dopo aver generato un nuovo gruppo. Le note si modificano oppure si cancellano svuotando il campo e salvando. Vengono salvate sul dispositivo e sono compatibili con il formato di backup. La copia online tramite codice email richiede ancora configurazione e una prova su due telefoni.
- Lo scanner cerca il nome del prodotto in dispensa e su Open Food Facts, con digitazione del codice come alternativa alla fotocamera. Per l’inserimento manuale o tramite scanner, la scadenza rimane vuota finché non viene confermata la data stampata sulla confezione. Da Dispensa si possono modificare o rimuovere date già salvate.
- Nel browser a 360 × 760 verificati salvataggio di note distinte in due tipi di ricette di Ispirazione, recupero dopo ricarica e rimozione di una nota. Provati un codice riconosciuto e uno assente dal catalogo, la conferma di una data, la sua rimozione e la riapertura di un prodotto senza data. Fotocamera, promemoria e aggiornamento sopra la versione precedente restano da provare su telefono.
