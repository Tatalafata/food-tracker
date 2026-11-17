# Attivare le ricette OpenAI sul PC

1. Copia `.env.example` in `.env` nella cartella del progetto. Se `.env` esiste gia, aggiungi le due variabili senza cancellare le altre.
2. Sostituisci `your_openai_api_key_here` con la tua chiave nel campo `OPENAI_API_KEY`. Non incollarla nella chat. `.env` e escluso da Git.
3. Apri l'anteprima con `npm run preview` oppure con `Avvia-app.cmd`. L'anteprima avvia o riusa il servizio ricette locale sulla porta 3001. Per avviare solo il servizio usa `npm run api`. Dopo una modifica della chiave, riavvia il processo del servizio.
4. Entra in Ricette e premi Trova Ricette. La modalità Veloce usa i prodotti disponibili in dispensa e ignora quelli scaduti. In Personalizzato puoi digitare ingredienti anche se la dispensa è vuota.

Il modello è GPT-5.6 Luna, il sostituto indicato da OpenAI dopo il ritiro di GPT-4.1 nano. Il servizio usa una richiesta senza strumenti aggiuntivi, con ragionamento disattivato e massimo 5.000 token in uscita per cinque ricette. Le richieste identiche riusano il risultato fino al cambio del giorno UTC. Sono consentite al massimo 20 chiamate al giorno e una ogni 30 secondi, contando anche i tentativi falliti. Limiti e cache sono in memoria e si azzerano riavviando il servizio.

Tariffe verificate il 17 novembre 2026: $0,20 per milione di token in ingresso e $1,20 in uscita. Una richiesta da 1.000 token in ingresso e 5.000 in uscita costa circa $0,0062. Il prezzo effettivo dipende dai token utilizzati.

Fonti: [GPT-5.6 Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna), [modelli ritirati](https://developers.openai.com/api/docs/deprecations).

Questo servizio ascolta solo sul PC (127.0.0.1). Prima dell'uso su Android/iPhone o della pubblicazione serve un backend HTTPS con autenticazione degli utenti e limiti persistenti; non esporre questo server locale su Internet. Nel telefono localhost indica il telefono, non il PC. L'app riceve soltanto l'indirizzo del backend, mai la chiave OpenAI.

Tocca una proposta per aprire la ricetta completa. Le dosi partono da una persona e i pulsanti +/− permettono da 1 a 12 porzioni. Quantità numeriche e riferimenti alle dosi nei passaggi si ricalcolano sul dispositivo. Con **Aggiungi al calendario** puoi conservare la ricetta e le porzioni per un giorno a scelta e impostare un promemoria. Dal calendario riapri ingredienti e preparazione anche quando il servizio OpenAI è spento. Il promemoria viene consegnato dall'app sul telefono se le notifiche sono consentite.

## Preferenze di cucina

Vicino alle preferenze alimentari trovi due opzioni, disponibili sia in Veloce sia in Personalizzato e selezionabili insieme:

- **Ricette facili**: tecniche di base e da 4 a 6 passaggi.
- **Ricette veloci**: tempo totale stimato entro 30 minuti, preparazione e preriscaldamento compresi.

Le schede e il dettaglio mostrano tempo totale stimato e difficolta. Il server impone numero di ricette, intervallo dei tempi e difficolta nello schema della risposta, e controlla anche il risultato ricevuto. Questi controlli verificano i dati dichiarati dal modello: non misurano la durata reale in cucina o la difficolta di una tecnica. Le istruzioni richiedono dosi per una persona, tagli, calore, minuti di cottura, segnali di cottura e ingredienti coerenti con le esclusioni.

Le dosi usate nei singoli passaggi arrivano come riferimenti strutturati agli ingredienti; il servizio li converte nei riferimenti ricalcolabili dall'app. I filtri fanno parte della chiave di cache: cambiandoli non vengono riutilizzate ricette generate con preferenze diverse. Cambiare un filtro cancella le proposte precedenti; occorre premere Trova Ricette per generarne altre.

Il calcolo delle porzioni e il salvataggio nel calendario avvengono sul dispositivo. Ogni nuova generazione richiede una sola chiamata per cinque ricette, con cache e limiti descritti sopra.
