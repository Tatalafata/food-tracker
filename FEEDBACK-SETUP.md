# Ricevere il feedback di ChefSuggest

**Impostazioni → Feedback** permette agli utenti di scrivere un messaggio senza account. I messaggi arrivano nella sezione **Submissions → Inbox** del tuo modulo Formspree. Puoi anche ricevere un avviso alla tua email. Il modulo dell’app invia solo il testo, fino a 2.000 caratteri.

1. Accedi a [Formspree](https://formspree.io/) con un account che gestisci e verifica la tua email. Dal pannello scegli **New Form** e chiamalo «ChefSuggest – Feedback».
2. Nelle impostazioni del modulo controlla il **Target Email**. Il modulo dell’app invia solamente il campo `message`: non impostare altri campi obbligatori.
3. Copia dalla scheda **Integration** l’indirizzo del modulo, nel formato `https://formspree.io/f/…`. Aggiungilo al file `.env` come valore di `EXPO_PUBLIC_FEEDBACK_URL`. Per le build distribuite imposta la stessa variabile nell’ambiente di compilazione. L’indirizzo del modulo è pubblico; password e chiavi private non servono.
4. Riavvia Expo per rileggere la configurazione. In **Impostazioni → Feedback**, invia un messaggio di prova e controlla che sia nella scheda **Submissions**. Ripeti una volta su un telefono prima di distribuire l’app.

Finché il collegamento non è impostato, il pulsante **Invia feedback** resta disattivato. L’app cancella il testo solo dopo una risposta di conferma; se l’invio non è confermato, il testo resta nel modulo.

[Guida di Formspree alla creazione di un modulo](https://help.formspree.io/articles/building-your-form/building-an-html-form)
