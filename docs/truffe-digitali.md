# Landing Truffe Digitali

Pagina statica pronta per GitHub Pages, all'indirizzo previsto:
https://ggarofalo-dev.github.io/truffe-digitali/

## File e materiali

- `truffe-digitali/index.html`: contenuti, SEO, Open Graph, Twitter Card e Schema.org.
- `truffe-digitali/style.css`: layout responsive, accessibilità e stampa.
- `truffe-digitali/guide.js`: condivisione, clipboard e analytics.
- `truffe-digitali/assets/`: due anteprime WebP del PDF, sei illustrazioni estratte, QR SVG e immagine social JPEG 1200 × 630.
- `Truffe_Digitali_Flyer.pdf`: originale di due pagine, servito senza modifiche.
- `trfimg/Truffe_Digitali_01.jpg`: immagine originale del libro, utilizzata integralmente.
- `index.html`: aggiunto un solo richiamo al documento, con CSS circoscritto.
- `privacy.html`: descrizione delle azioni aggregate e dell'attribuzione UTM.
- `sitemap.xml` e `robots.txt`: aggiunti perché prima assenti.
- `scripts/check-guide.cjs`: verifiche senza dipendenze, eseguibili con Node.js 18 o successivo.

Non sono richiesti build, pacchetti frontend, chiavi o servizi aggiuntivi. Gli strumenti temporanei `.tools/` sono esclusi da Git; non vanno caricati manualmente su Pages.

## Statistiche

Riutilizzato l'account GoatCounter già presente nel sito: `ggarofalo.goatcounter.com`.
Si inviano una visita a `/truffe-digitali/` e l'evento `guide_page_view`.
Gli altri eventi sono `guide_download`, `amazon_book_click`, `share_whatsapp`,
`share_facebook`, `share_linkedin`, `share_telegram`, `share_email`, `copy_link`.
È aggiunto `share_native` sui dispositivi che supportano la Web Share API.
Gli eventi misurano l'azione sul pulsante: un click social non dimostra che il post
sia stato pubblicato; il download misura la richiesta, non la lettura del documento.

Gli eventi restano aggregati per nome; il campo provenienza di GoatCounter conserva
le etichette `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` e `utm_term`
in un valore `campaign:utm_source=...&utm_medium=...&utm_campaign=...`.
Le etichette sono limitate a 80 caratteri ciascuna e a lettere, numeri, spazi,
punti, trattini e underscore. Non inserire dati personali nei parametri UTM.
I parametri non UTM non vengono inoltrati. Senza UTM viene usata soltanto
l'origine del referrer, senza percorso o query. Non si salva nulla in localStorage,
sessionStorage o cookie per questa funzionalità.

Esempio per una campagna:
`https://ggarofalo-dev.github.io/truffe-digitali/?utm_source=biblioteca&utm_medium=qr&utm_campaign=decalogo`

I pulsanti di condivisione, la copia del link e il QR fornito contengono invece
l'indirizzo canonico pulito. Nessun UTM di un visitatore viene propagato ad altri.
Le funzioni di condivisione continuano a funzionare se analytics è bloccato.
I link al PDF e ai social restano utilizzabili anche senza JavaScript.

Configurazione implementata secondo le API ufficiali:
https://www.goatcounter.com/help/js e https://www.goatcounter.com/help/events

## Verifiche effettuate

Eseguire dalla radice: `node scripts/check-guide.cjs`.

Verificati: esistenza degli asset e dei link locali, firma PDF, Schema.org,
canonico e sitemap, tutti gli eventi, attribuzione UTM, caricamento ritardato
del tracker, URL di condivisione, copia riuscita e fallback con permesso negato,
Web Share API presente/assente, decodifica indipendente del contenuto del QR SVG.
Il codice JavaScript supera anche `node --check truffe-digitali/guide.js`.

Il server locale restituisce HTTP 200 per homepage, pagine esistenti, landing,
sitemap e robots. Il PDF scaricato via HTTP è identico all'originale:
2.419.854 byte; SHA-256
`aa534ab5b82c3c84bc6946770634feae9d6fbb5e08f09c73d104db815b3dd4b3`.
Le immagini estratte e la scheda social sono state ispezionate come file.
Le sezioni preesistenti della homepage sono state confrontate con l'originale
e risultano identiche. I contrasti principali verificati vanno da 6,38:1
(testo secondario sul fondo chiaro) a 16,34:1 (bianco su blu scuro),
superando la soglia AA per il testo normale. Questo controllo cromatico
non equivale a una certificazione completa WCAG.

Limite dell'ambiente: l'avvio di Chrome automatico è bloccato con `spawn EPERM`
e il browser integrato segnala che l'host di accesso non è disponibile.
Restano quindi da eseguire nel browser reale: controllo visivo desktop/mobile,
assenza di overflow, ordine del focus, console, download tramite pulsante e
apertura delle finestre social. I servizi social possono richiedere l'accesso
per completare la condivisione. L'effettiva ricezione dei dati nel pannello
GoatCounter va controllata dopo la pubblicazione autorizzata; durante i test
non sono stati inviati eventi di prova al servizio.

## Pubblicazione

Non sono stati eseguiti commit, push o pubblicazioni. Al momento di pubblicare,
includere landing, asset, PDF e immagine `trfimg/Truffe_Digitali_01.jpg`, oltre
ai file della homepage, privacy, sitemap e robots. Il percorso con directory e
`index.html` non richiede redirect o configurazioni server su GitHub Pages.
L'URL pubblico funzionerà quando questi file saranno pubblicati.

## Revisione della comunicazione

La pagina presenta il PDF come un documento di due pagine con dieci regole.
Hero, pulsanti, testi alternativi, metadati, messaggi di condivisione e anteprima
social adottano questa terminologia. Aggiornati anche il richiamo in homepage
e il riferimento nell'informativa privacy. La sezione del libro è invariata.
I nomi dei file, gli URL, gli identificativi analytics e il CSS responsive
sono stati mantenuti; il PDF conserva lo stesso SHA-256 riportato sopra.

Ripetuti con esito positivo i test disponibili e il controllo di sintassi
JavaScript. Verificate anche l'identità della sezione libro, la conservazione
dei collegamenti e l'uniformità dei tre pulsanti del PDF. L'immagine social
1200 × 630 è stata ispezionata dopo l'aggiornamento dei testi.
Il nuovo tentativo di verifica desktop/mobile nel browser automatico è ancora
bloccato da `spawn EPERM`; la verifica visiva delle pagine resta da completare.
Il progetto statico non prevede un comando di build.

## Struttura compatta a tre sezioni

La pagina comprende ora presentazione del PDF e del libro, condivisione e
distribuzione tramite enti. Il primo blocco usa colonne 60/40 su desktop;
sotto 901 px segue l'ordine documento, libro, anteprime. Il pulsante del PDF
è blu, quello Amazon ambra. La barra persistente è stata rimossa per evitare
sovrapposizioni. Restano due pulsanti di download, entrambi tracciati con
`guide_download`; il controllo automatico è stato aggiornato di conseguenza.

Le schede e le introduzioni intermedie sono eliminate. Gli asset originali,
i collegamenti, i metadati e il codice analytics/condivisione sono mantenuti.
Verificati struttura a tre sezioni, ordine di lettura, hash del PDF, percorsi,
eventi, UTM e decodifica QR. Il tentativo di acquisire screenshot a
1920 × 1080, 1366 × 768, 768 × 1024 e 390 × 844 si arresta all'avvio del
browser con `spawn EPERM`: le quattro rese non sono quindi verificate
visivamente in questo ambiente.

## Condivisione a icone e due sezioni

Rimossa la sezione per enti e associazioni, compreso il secondo pulsante del PDF.
La pagina comprende soltanto presentazione e condivisione. Il testo sulla
distribuzione integra è ora nella seconda sezione.

Gli otto controlli di condivisione usano SVG inline, senza dipendenze: WhatsApp,
Facebook, LinkedIn, Telegram, X, email, copia e condivisione nativa (quando
supportata). Le icone circolari hanno un'area interattiva di 48 × 48 px,
etichette accessibili, tooltip nativi e indicatore di focus. La copia riuscita
mostra una spunta e un messaggio annunciato tramite il live region esistente;
il fallback manuale resta disponibile in caso di permesso negato.

Gli identificativi analytics esistenti sono invariati; aggiunto `share_x`.
Il QR resta laterale su desktop e sotto i controlli su mobile, con download SVG.
Test aggiornati e superati per due sezioni, un download del PDF, otto controlli
accessibili, eventi, UTM, feedback copia e decodifica QR. Il tentativo di
verifica visuale a 1366 × 768 e 390 × 844 resta bloccato da `spawn EPERM`.
