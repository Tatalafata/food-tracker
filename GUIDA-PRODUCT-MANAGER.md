# Usare ChefSuggest con Codex

## Iniziare una nuova chat

In Codex seleziona il progetto della cartella `applicazione` e apri una nuova chat al suo interno. Scrivi in italiano cosa vuoi ottenere: non serve conoscere comandi o nomi dei file. Le regole del progetto sono salvate in `AGENTS.md`, cosi le nuove chat ritrovano lo stesso modo di lavorare.

Puoi iniziare con:

> Iniziamo una nuova sessione su ChefSuggest.

Oppure descrivi direttamente una modifica:

> Nella dispensa rendi piu visibili i prodotti che scadono nei prossimi tre giorni. Deve essere comodo da usare su Android e iPhone.

Codex controlla il progetto e apre l'anteprima accanto alla chat, realizza la modifica e la verifica. Ti spiega cosa cambia e come provarlo. Se manca una decisione importante, ti aiuta a sceglierla con una domanda semplice.

## Vedere e provare le modifiche

L'anteprima si aggiorna mentre Codex lavora. Se non la vedi, scrivi "Riapri l'anteprima". Puoi anche fare doppio clic su `Avvia-app.cmd`: si apre il browser. Lascia aperta la finestra di avvio; per fermarla premi Ctrl+C. Quando viene riusata un'anteprima gia attiva, il server resta nella finestra che lo aveva avviato.

Il prodotto e pensato soprattutto per **Android e iPhone**. Il browser permette di controllare velocemente schermate e interazioni; per verificare tastiera, fotocamera, notifiche e permessi serve anche il telefono. Scrivi "Aiutami a provare questa modifica sul mio Android/iPhone" e Codex ti guida. Per il collegamento al telefono puo servire un'app di prova compatibile o una versione di sviluppo dedicata.

I prodotti della dispensa sono salvati sul dispositivo/browser usato: non aspettarti di ritrovarli automaticamente su un altro telefono.

## Salvataggio automatico su GitHub

Il proprietario ha gia autorizzato Codex a salvare le modifiche importanti completate direttamente su `main` di [Tatalafata/food-tracker](https://github.com/Tatalafata/food-tracker), dopo i controlli. Non devi chiedere ogni volta "fai il push". Alla fine Codex ti conferma il salvataggio online; se non riesce, te lo dice e conserva il lavoro locale.

Questo salvataggio conserva il codice. Per distribuire una versione sugli store serve un passaggio separato. Puoi chiedere "Annulla l'ultima modifica che abbiamo fatto": Codex verifica come ripristinare il comportamento senza cancellare il resto del lavoro.

## Esempi utili

- "Aggiungi un filtro per vedere solo i prodotti in scadenza."
- "Su iPhone la tastiera copre questo campo: sistemalo."
- "Cambia questo testo in tutte le lingue disponibili: ..."
- "Mostrami quali file riguardano le impostazioni e spiegamelo in parole semplici."
- "Quali prove devo fare sul telefono prima di usare questa funzione?"
- "L'anteprima non si apre: risolvi il problema e riaprila."

Per una richiesta chiara basta indicare la schermata, cosa succede ora e cosa desideri. Non condividere password o chiavi private in chat. Le ricette automatiche richiedono ancora un collegamento sicuro a un servizio esterno: il setup dell'anteprima non basta per attivarle.
