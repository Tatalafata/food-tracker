# ChefSuggest / Food Tracker

Proof of concept per gestire la dispensa, controllare le scadenze e ottenere idee per ricette. Le destinazioni principali sono **Android e iOS**; l'anteprima web aiuta a vedere subito le modifiche.

## Lavorare con Codex

Apri questa cartella come progetto in Codex e crea una nuova chat **dentro lo stesso progetto**. Descrivi in italiano cosa vuoi cambiare. Le istruzioni in [AGENTS.md](AGENTS.md) prevedono apertura dell'anteprima, spiegazioni semplici, verifiche e salvataggio automatico delle modifiche importanti su `main`.

- [Guida per la product manager](GUIDA-PRODUCT-MANAGER.md): esempi di richieste e prove.
- [Stato del progetto](STATO-PROGETTO.md): verifiche effettuate e limiti conosciuti.

## Avvio

Prerequisito: Node.js compatibile con Expo SDK 54 (su questo PC e gia installato). Per un nuovo clone:

```sh
npm ci
npm run preview
```

Su Windows puoi fare doppio clic su `Avvia-app.cmd`: prepara le librerie se assenti e apre il browser. Lascia aperta la finestra durante l'uso. Se l'app e gia attiva il comando riusa l'anteprima di questa cartella. L'indirizzo, normalmente `http://localhost:8081`, viene mostrato all'avvio.

Per Codex: `npm run preview -- --no-open`, poi apri l'indirizzo nel pannello browser. Per fermare un server appena avviato premi Ctrl+C nella sua finestra.

## Prove su Android e iPhone

```sh
npm start
```

Collega computer e telefono alla stessa rete e usa un client compatibile con SDK 54 oppure una development build. L'anteprima avviata con `preview` e destinata al browser del computer; se e attiva sulla porta 8081, scegli un'altra porta per la sessione mobile, ad esempio `npm start -- --port 8091`.

Verifica su entrambi i sistemi le funzioni interessate: dimensioni dei pulsanti, aree sicure, tastiera, salvataggio dopo la riapertura, fotocamera, permessi e notifiche. Il browser da solo non certifica il funzionamento sul telefono. La pubblicazione sugli store e un passaggio separato dal salvataggio su GitHub.

## Controlli e struttura

```sh
npm run check
```

Esegue TypeScript e lint. Accompagna i controlli automatici con una prova del comportamento modificato.

| Cartella/file | Contenuto |
| --- | --- |
| `app/` | Schermate e navigazione |
| `components/` | Componenti riutilizzabili |
| `store/` | Dispensa, preferenze, notifiche e traduzioni |
| `constants/theme.ts` | Colori e stile di base |
| `assets/` | Immagini e icone |
| `scripts/preview.cjs` | Avvio e riuso dell'anteprima |

Si lavora su `main` di [Tatalafata/food-tracker](https://github.com/Tatalafata/food-tracker), con commit mirati e push dopo la verifica. Le librerie si ricreano con `npm ci`: `node_modules`, file generati e configurazioni segrete non appartengono ai commit.

## Ricette e configurazione

L'interfaccia delle ricette e presente; la generazione dipende da un servizio esterno. La PoC legge `EXPO_PUBLIC_ANTHROPIC_API_KEY`, che sarebbe inclusa nell'app: **non configurare una vera chiave privata nel client**. L'uso reale richiede un servizio lato server. `.env.example` e solo un esempio; i file `.env*` personali restano esclusi da Git.

Non usare `scripts/reset-project.js`: ripristina lo starter Expo eliminando la struttura corrente. Il relativo comando rapido e stato rimosso.
