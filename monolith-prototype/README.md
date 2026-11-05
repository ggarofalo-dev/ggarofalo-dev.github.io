# MONOLITH

Una vertical slice tridimensionale per il futuro sito di Gianluca Garofalo. Una sala brutalista, un monolite meccanico e una trasformazione in tempo reale. Nessuna landing page, video preregistrato o immagine usata come ambiente.

Il prototipo vive interamente in questa cartella. Il sito personale e `.github/workflows/pages.yml` non sono stati modificati. Nessun commit, push o deploy eseguito.

## Avvio immediato, anche senza rete

È inclusa una distribuzione statica funzionante come artefatto di build in `dist/`, con Three.js r180 e font locali. Richiede Node.js **22.18+**; verifiche eseguite con Node 24.18.

Da questa cartella:

```powershell
npm run dev:offline
```

Aprire **http://127.0.0.1:5173**. Questo comando ricostruisce `dist/` con lo stripper TypeScript nativo di Node e avvia un server locale. Non scarica dipendenze. Non è Vite, non esegue un typecheck e non offre HMR: dopo una modifica fermarlo con Ctrl+C e riavviarlo.

Non aprire `index.html` direttamente con `file://`: moduli, font e pointer lock richiedono un server. In altri hosting il pointer lock richiede un contesto sicuro; localhost è il percorso previsto per la revisione.

## Sviluppo principale: Vite + TypeScript + Three.js

Quando il registro npm è raggiungibile:

```powershell
npm install
npm run dev
```

```powershell
npm run build
npm run preview
```

Il progetto usa Three.js **0.180.0**, TypeScript e Vite. Nessun framework UI, physics engine, libreria di animazione o post-processing esterna. Il build Vite usa percorsi relativi (`base: './'`), quindi l’output è distribuibile anche in una sottocartella di GitHub Pages. Non è stato aggiunto alcun workflow di pubblicazione.

**Limite di questa consegna:** npm è bloccato dal proxy dell’ambiente (`ECONNREFUSED 127.0.0.1:9`). L’installazione non è stata completata, `tsc` non è disponibile e il build Vite non è stato eseguito con successo. Il percorso offline esiste per rendere il prototipo avviabile e consegnare `dist/` senza fingere un build Vite o un controllo dei tipi. Il lockfile dovrà essere generato dalla prima installazione riuscita.

## Dentro lo spazio

Il prologo dura dieci secondi: l’immagine emerge dal nero e la camera avanza nella navata. È interamente renderizzato dalla scena. **Salta il prologo**, Escape o H portano alla posizione di esplorazione. Dopo il prologo premere **Entra nello spazio** per catturare il mouse; non viene chiesto pointer lock senza un gesto.

| Comando | Azione |
| --- | --- |
| WASD | Movimento con accelerazione e decelerazione |
| Mouse | Rotazione con smorzamento |
| Shift | Movimento più rapido |
| Escape | Libera il puntatore e mette in pausa |
| E | Attiva il monolite dal fronte, entro circa 30 unità |
| R | Ripristina l’ambiente e ripete il prologo |
| H | Mostra comandi/pausa; riprende con un nuovo gesto |
| F3 | FPS misurati, draw call, triangoli, preset, DPR e memoria |

L’overlay iniziale scompare iniziando a camminare. I piccoli comandi audio/qualità restano disponibili con il puntatore libero. L’audio è disattivato per impostazione predefinita: il pulsante AUDIO crea e avvia Web Audio solo in seguito a un clic. Nessuna risorsa audio esterna.

Avvicinandosi al monolite si attivano emissione, sottilissima vibrazione e risonanza spaziale, se l’audio è stato abilitato. E avvia una sequenza di **13 secondi**. La camera si riposiziona nel corridoio libero, i sei pannelli si aprono in successione, il nucleo si rivela, gli otto diaframmi sospesi ruotano, i circuiti luminosi aumentano di intensità e la nebbia cambia. La scritta **THE HUMAN VARIABLE** compare su una superficie dentro il mondo 3D. Alla fine il controllo ritorna al giocatore.

Il fronte è il punto di attivazione per garantire una traiettoria cinematografica libera da ostacoli. Il monolite non viene attraversato dalla camera provenendo dal retro.

## Movimento ridotto e touch

La preferenza `prefers-reduced-motion` evita il prologo e il movimento della camera nelle sequenze, elimina il movimento della testa e permette di passare direttamente allo stato trasformato. È disponibile anche un interruttore manuale. La navigazione del giocatore resta attiva.

È implementato un percorso touch supplementare: joystick sinistro, trascinamento a destra per guardare, E per interagire. Il target principale rimane un browser desktop con GPU dedicata; smartphone e touch non sono stati provati su un dispositivo fisico.

## Architettura e rendering

- Sala nominale **240 × 100 × 400** unità, 32 pilastri articolati, pavimentazione modulare, basi e capitelli, costole metalliche, recessi, aperture reali e diaframmi sospesi. I limiti di movimento sono interni ai muri.
- Monolite alto circa **76 unità**, sei pannelli frontali indipendenti con smussi, strati, scanalature, bulloni e giunti incassati. Nucleo prismatico, telaio e luce interna sono geometrie distinte.
- Geometrie smussate procedurali. Elementi ripetuti disegnati con `InstancedMesh`; culling Three.js e bounding sphere dei batch calcolate.
- Pietra, calcestruzzo e metallo PBR, con mappe deterministiche di colore, normali e roughness. Pavimento centrale con clearcoat e riflesso planare reale nei preset Cinematica e Ultra.
- Ambiente procedurale convoluto con PMREM. Nessun HDRI scaricato. Una luce direzionale principale con ombre PCF, illuminazione di riempimento e occlusione di contatto approssimata con decal locali.
- Nebbia esponenziale per profondità atmosferica. Pochi piani di scattering additivo approssimano la luce nelle aperture: non sono volumetria fisicamente accurata né ray marching.
- Render target HDR se il dispositivo supporta `EXT_color_buffer_float`; fallback a colore a 8 bit. Bloom selezionato per luminanza e limitato alle sorgenti energetiche, filtro a un quarto di risoluzione, curva filmica ACES approssimata e vignetta contenuta. Nessuna aberrazione cromatica, motion blur o DOF durante il gioco.
- Una sola timeline governa camera, pannelli, architettura, atmosfera e titolo. Audio meccanico e impatto sono agganciati ai suoi cue.

## Qualità e prestazioni

| Preset | DPR massimo* | Ombra | Riflesso planare | Bloom | Fasci |
| --- | --- | --- | --- | --- | --- |
| Essenziale | 0,85 | 1024 | Disattivato; resta PMREM | No | 2 |
| Cinematica | 1,25 | 2048 | 512 px di larghezza | Sì | 4 |
| Ultra | 1,65 | 2048 | 1024 px di larghezza | Sì | 6 |

*Limitato anche dal DPR del dispositivo. Il rapporto viene adattato entro un minimo di 0,65 in base al tempo dei frame. Il preset non viene cambiato di nascosto. F3 mostra il valore effettivo.

La riflessione si aggiorna ogni due frame durante l’esplorazione e ogni frame nelle sequenze. Le ombre restano ferme durante l’esplorazione e si aggiornano quando l’architettura cambia. Il loop si ferma con la scheda nascosta. Render target, geometrie, materiali, texture, eventi e audio vengono rilasciati all’uscita.

Le texture sono generate localmente a 512²; non vi sono grandi download di texture da comprimere. Questa vertical slice non usa KTX2, SSR o SSAO a schermo intero. Non è dichiarato alcun FPS raggiunto: manca una misurazione su GPU.

## Verifiche

```powershell
npm test
npm run validate
npm run build:offline
```

**12 test superati:** collisioni e tunnelling, scorrimento, confini, smorzamento, timeline completa, stagger, reset, limiti del DPR, dimensioni delle geometrie smussate e montaggio/trasformazione del vero grafo Three.js. Il test del grafo non rasterizza le texture e non crea un contesto WebGL.

Il validatore costruisce tutti gli otto moduli TypeScript, controlla import, disponibilità HTTP di moduli/asset/font/licenze e ID dell’HTML. I risultati sono in `validation/static-report.json`.

Con Playwright opzionale disponibile:

```powershell
npm install --no-save playwright
npm run test:browser
```

`CHROME_PATH` permette di indicare Chrome/Chromium. La suite prova avvio, prologo, pointer lock, avvicinamento con WASD/Shift, E, trasformazione, ritorno del controllo, qualità e reset; raccoglie screenshot e dati F3. **Qui l’avvio di Chrome è bloccato con `spawn EPERM`.** Il rapporto registra il blocco, senza screenshot o misure inventate.

Computer Use ha inoltre interrotto l’accesso alla finestra Chrome perché non poteva determinare con sufficiente certezza l’URL corrente. Non sono state tentate altre interazioni UI dopo l’interruzione.

## Gate artistico e limiti noti

La scena è implementata, ma il gate artistico **non è certificato**: nessun frame WebGL è stato renderizzato e ispezionato in questo ambiente. Non sono verificati su GPU esposizione, qualità dei riflessi, shader, shader compilation, scorrimento della camera, audio spaziale e prestazioni a 1080p. Non attribuire alla scena un giudizio di qualità AAA sulla base dei soli test di codice.

Altri limiti deliberati: collisioni orizzontali contro le strutture principali e altezza di gioco fissa; nessun salto o piattaforma percorribile, personaggio animato o simulazione fisica dei pannelli. Il menu è accessibile da tastiera, ma l’esperienza 3D non costituisce un’alternativa testuale completa o una certificazione WCAG. Vite e typecheck restano da verificare dopo l’installazione.

Prima di considerare concluso il prototipo: aprire l’esperienza su una GPU reale, ispezionare immagini prima/durante/dopo l’attivazione, regolare luce e materiali su quanto osservato, eseguire la suite browser e misurare F3 a 1080p. Vedere `ART-DIRECTION.md` e `validation/VERIFICATION.md`.

## Sorgenti e licenze

`src/world.ts` costruisce il luogo; `materials.ts` genera la materia; `rendering.ts` gestisce riflessione e post; `controller.ts` e `physics.ts` gestiscono il movimento; `timeline.ts` dirige la sequenza; `audio.ts` sintetizza il suono; `main.ts` coordina il runtime e l’interfaccia di gioco.

Asset e licenze sono in `public/` e nella build. Three.js: MIT; Space Grotesk: SIL OFL 1.1. Geometrie, texture procedurali e audio sono originali di questo prototipo. Provenienza in `public/licenses/ASSETS.md`.
