# Attivare le ricette OpenAI sul PC

1. Copia `.env.example` in `.env` nella cartella del progetto. Se `.env` esiste gia, aggiungi le due variabili senza cancellare le altre.
2. Sostituisci `your_openai_api_key_here` con la tua chiave nel campo `OPENAI_API_KEY`. Non incollarla nella chat. `.env` e escluso da Git.
3. Avvia `npm run api` in un terminale e lascialo aperto. Riavvialo dopo ogni modifica alla chiave.
4. Apri l'anteprima, entra in Ricette e premi Trova Ricette.

Il modello e GPT-4.1 nano, senza strumenti aggiuntivi: massimo 800 token di risposta, due ricette. Le richieste identiche riusano il risultato fino al cambio del giorno UTC. Sono consentite al massimo 20 chiamate al giorno e una ogni 30 secondi, contando anche i tentativi falliti. Limiti e cache sono in memoria: si azzerano riavviando il servizio. Non sono un tetto di spesa dell'account OpenAI.

Prezzi verificati: $0,10 per milione di token in ingresso e $0,40 in uscita. Esempio indicativo: 1.000 token in ingresso e 800 in uscita costano $0,00042; 1.000 richieste simili circa $0,42, esclusi imposte e hosting. La qualita va verificata con prove reali delle preferenze alimentari; il prezzo effettivo dipende dai token utilizzati.

Fonte: https://developers.openai.com/api/docs/models/gpt-4.1-nano

Questo servizio ascolta solo sul PC (127.0.0.1). Prima dell'uso su Android/iPhone o della pubblicazione serve un backend HTTPS con autenticazione degli utenti e limiti persistenti; non esporre questo server locale su Internet. Nel telefono localhost indica il telefono, non il PC. L'app riceve soltanto l'indirizzo del backend, mai la chiave OpenAI.
