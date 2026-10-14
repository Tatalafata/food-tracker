# Attivare le ricette OpenAI sul PC

1. Copia `.env.example` in `.env` nella cartella del progetto. Se `.env` esiste gia, aggiungi le due variabili senza cancellare le altre.
2. Sostituisci `your_openai_api_key_here` con la tua chiave nel campo `OPENAI_API_KEY`. Non incollarla nella chat. `.env` e escluso da Git.
3. Avvia `npm run api` in un terminale e lascialo aperto. Riavvialo dopo ogni modifica alla chiave.
4. Apri l'anteprima, entra in Ricette e premi Trova Ricette.

Il modello e GPT-4.1 nano, senza strumenti aggiuntivi: massimo 5.000 token di risposta per includere ingredienti e preparazione completa di cinque ricette. Le richieste identiche riusano il risultato fino al cambio del giorno UTC. Sono consentite al massimo 20 chiamate al giorno e una ogni 30 secondi, contando anche i tentativi falliti. Limiti e cache sono in memoria: si azzerano riavviando il servizio. Non sono un tetto di spesa dell'account OpenAI.

Prezzi verificati: $0,10 per milione di token in ingresso e $0,40 in uscita. Esempio indicativo: 1.000 token in ingresso e 5.000 in uscita costano $0,0021 per una richiesta con cinque ricette; 1.000 richieste simili circa $2,10, esclusi imposte e hosting. Il limite di risposta non implica che tutti i token vengano usati. La qualita va verificata con prove reali delle preferenze alimentari; il prezzo effettivo dipende dai token utilizzati.

Fonte: https://developers.openai.com/api/docs/models/gpt-4.1-nano

Questo servizio ascolta solo sul PC (127.0.0.1). Prima dell'uso su Android/iPhone o della pubblicazione serve un backend HTTPS con autenticazione degli utenti e limiti persistenti; non esporre questo server locale su Internet. Nel telefono localhost indica il telefono, non il PC. L'app riceve soltanto l'indirizzo del backend, mai la chiave OpenAI.

Tocca una proposta per aprire la ricetta completa. Le dosi partono da una persona e i pulsanti +/− permettono da 1 a 12 porzioni. Quantita numeriche e riferimenti alle dosi nei passaggi si ricalcolano sul dispositivo, senza altre chiamate OpenAI; condimenti q.b., temperature e tempi non si moltiplicano. La qualita delle istruzioni generate va comunque valutata.
