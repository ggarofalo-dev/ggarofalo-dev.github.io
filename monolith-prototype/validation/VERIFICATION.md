> Aggiornamento guidato: aggiunti test su tutti i percorsi tra territori, altezza di 10 unità, margini di sicurezza, archivio originale e nodi UI. Il runtime principale non importa Explorer e non richiede pointer lock. La resa visiva guidata resta non verificata in questo ambiente.

# Verifica effettiva — 5 novembre 2026

## Superato

- 14 test Node nel processo corrente: collisioni, limiti, damping, timeline, stagger, reset, adattamento DPR, smussi e grafo reale Three.js r180.
- Generazione degli dieci moduli browser da TypeScript mediante lo stripper nativo di Node; import relativi risolti.
- Build statica offline in `dist/`, Three.js e font locali, licenze incluse.
- Server HTTP: documento, moduli, CSS, Three.js, font, favicon e licenze rispondono 200; risorsa inesistente risponde 404.
- Test del grafo: 33 ostacoli principali, 6 pannelli, 8 diaframmi, batch istanziati, materiali con mappe, tre reazioni sincronizzate e ripristino. Nessuna immagine è stata prodotta da questo test.

## Bloccato

- `npm install`: registro npm non raggiungibile tramite il proxy configurato, `ECONNREFUSED 127.0.0.1:9`. Nessun pacchetto nuovo installato.
- `npm run build`: `tsc` assente; build Vite e typecheck non completati. `build-info.json` nell’output offline lo dichiara esplicitamente.
- `npm run test:browser`: `browserType.launch: spawn EPERM`. Rapporto in `browser-report.json`, stato blocked-or-failed.
- Browser integrato: host non disponibile. Computer Use trova Chrome, ma interrompe l’accesso prima di qualsiasi input perché non può determinare l’URL corrente con sufficiente certezza. Nessuna ulteriore interazione UI.

## Non verificato

Shader sul driver reale, correttezza visiva del riflesso planare, tone mapping, esposizione, bloom, qualità dei fasci, font nel mondo 3D, movimento del mouse/pointer lock, audio spaziale, touch, qualità su GPU, FPS a 1080p e gate artistico.

Non sono disponibili screenshot del runtime, catture video o misure di frame. Il prototipo è implementato e costruito nel percorso offline; non è presentato come artisticamente validato o esente da errori runtime WebGL non osservabili qui.

Il sito personale e la configurazione di deployment rimangono separati e non sono stati modificati. Nessun push o deploy.
