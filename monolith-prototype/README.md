# MONOLITH / Navigazione guidata

Versione aggiornata: il visitatore sceglie la destinazione; la camera segue un percorso diretto. Il mouse rimane libero. Non servono WASD, joystick o pointer lock.

## Provala

Il server locale è http://127.0.0.1:5173. Ricaricare con Ctrl+F5 dopo un aggiornamento.

1. Terminato il caricamento, la camera va direttamente verso il monolite: il prologo è stato eliminato.
2. Il monolite si attiva automaticamente, senza clic.
3. Il monolite si apre e la camera arretra per rivelare i quattro territori.
4. Soltanto ora compaiono i controlli: scegliere BUILD, THINK, SPEAK o WRITE.
5. All’arrivo la camera si ferma e apre il pannello di lettura.

Non occorre premere Entra, E o Risveglia. Il salto dei trasferimenti e del risveglio rimane facoltativo. Con movimento ridotto si arriva direttamente alla scelta dei territori.

L’altezza di esplorazione e dei trasferimenti rimane **10 unità**, come richiesto. I percorsi passano nei corridoi liberi e non attraverso il monolite. Quattro stazioni architettoniche reali portano i nomi dei territori e si illuminano dopo il risveglio.

## Contenuti

- **BUILD:** percorso IT, competenze e racconto del videogioco costruito con il figlio.
- **THINK:** giudizio, delega, contesto e articoli sul pensiero critico.
- **SPEAK:** divulgazione, CTS ENIA e tutte le sei registrazioni dell’archivio originale.
- **WRITE:** i due libri e gli otto articoli originali.

`public/content.json` conserva le 14 pubblicazioni del sito esistente. Titoli, date di pubblicazione, descrizioni e link provengono dal suo inventario. Le date dei video non sono presentate come date evento. Gli approfondimenti esterni si aprono su richiesta in un’altra scheda, mentre il punto di vista rimane fermo.

## Comandi

| Comando | Azione |
| --- | --- |
| Clic o tocco | Scegli una destinazione, apri un contenuto |
| 1–4 | BUILD / THINK / SPEAK / WRITE |
| 0 | Torna al monolite |
| Risveglio | Automatico, senza input |
| Escape | Chiudi la lettura o salta la sequenza in corso |
| R | Ripristina l’ambiente e ricomincia |
| H | Guida alla navigazione |
| F3 | Diagnostica prestazionale |

Movimento ridotto elimina i trasferimenti e porta direttamente alla destinazione. È rispettata anche la preferenza del sistema. Audio abilitato di default, con drone, meccanismi e impatto più presenti e compressore sul mix. Se il browser blocca l’autoplay, il primo clic, tocco o tasto sblocca il suono senza fermare l’animazione. Il pulsante audio è sempre disponibile per avviare o silenziare.

## Avvio senza dipendenze da installare

Node.js 22.18 o successivo, verifiche eseguite con Node 24.18:

```powershell
npm run dev:offline
```

Il comando costruisce `dist/` e serve http://127.0.0.1:5173. Non usa la rete, non è Vite e non offre HMR: dopo una modifica ricostruire o riavviare. Il server legge i file correnti in dist, quindi una build aggiornata viene servita anche senza riavvio.

Non aprire la pagina con file://: i moduli e l’archivio richiedono HTTP.

## Configurazione principale Vite / TypeScript

```powershell
npm install
npm run dev
npm run build
npm run preview
```

Three.js 0.180.0, TypeScript, Vite con `base: './'`. Nessun framework UI o libreria di animazione aggiuntiva. La build offline usa lo stripper TypeScript nativo di Node e una distribuzione locale ufficiale di Three.js r180. Non costituisce typecheck o build Vite.

Il registro npm di questo ambiente è bloccato dal proxy, `ECONNREFUSED 127.0.0.1:9`. Non è stato possibile installare le dipendenze o completare `tsc` e Vite. Il primo npm install riuscito genererà il lockfile.

## Rendering

Sala nominale 240 × 100 × 400, 32 pilastri modulari, dettagli e smussi procedurali, sei pannelli indipendenti del monolite, otto diaframmi sospesi. Materiali PBR con mappe locali procedurali di colore, normali e roughness; ambiente PMREM, pavimento a riflessione planare, ombre direzionali selettive, contatti approssimati, nebbia e fasci di luce economici.

Post-processing originale: HDR dove supportato, bloom a luminanza controllata e un quarto di risoluzione, curva filmica ACES approssimata e vignetta. Il risveglio mantiene la timeline di 13 secondi che sincronizza geometria, luce, atmosfera e titolo dentro la scena.

| Preset | DPR massimo* | Ombra | Riflessione | Bloom | Fasci |
| --- | --- | --- | --- | --- | --- |
| Essenziale | 0,85 | 1024 | Solo ambiente PMREM | No | 2 |
| Cinematica | 1,25 | 2048 | Planare 512 px | Sì | 4 |
| Ultra | 1,65 | 2048 | Planare 1024 px | Sì | 6 |

*Limitato anche dal dispositivo e adattato al tempo dei frame, minimo 0,65. F3 mostra FPS misurati, draw call, triangoli e DPR effettivo. Non è dichiarato un FPS raggiunto. Il loop si ferma nelle schede nascoste; risorse ed eventi vengono rilasciati all’uscita.

## Verifiche e limiti

```powershell
npm test
npm run validate
npm run build:offline
npm run test:browser
```

**14 test superati**, inclusi tutti i 25 collegamenti tra centro e territori, campionati lungo la curva per verificare altezza, estremi e distanza da architettura e stazioni. I test del grafo verificano le trasformazioni reali Three.js, senza creare un contesto WebGL. Il validatore controlla sintassi dei dieci moduli, import, nodi UI, assenza di pointer lock nel runtime guidato, archivio e risposte HTTP.

La suite browser è aggiornata al percorso guidato: approccio, risveglio, visite ai territori, contenuti, salto, movimento ridotto, ritorno al centro e reset. Richiede Playwright opzionale; CHROME_PATH può indicare il browser. Nell’ambiente l’avvio Chrome è bloccato con spawn EPERM; l’accesso UI è stato interrotto perché non era verificabile l’URL corrente. Non si dichiarano screenshot ispezionati o prestazioni GPU misurate.

Il gate artistico resta da valutare su immagini renderizzate. Il comportamento visuale del nuovo viaggio, il bilanciamento dei pannelli, la leggibilità delle iscrizioni e touch non sono stati osservati qui. Il pannello mostra testi e collegamenti originali; non importa il testo integrale degli articoli esterni.

## Sorgenti e sicurezza

`src/tour.ts`: destinazioni e percorsi. `src/stations.ts`: stazioni fisiche. `src/main.ts`: regia e lettura. `world.ts`, `materials.ts`, `rendering.ts`, `audio.ts`, `timeline.ts`: ambiente e sistemi. Il precedente controller libero è conservato come sorgente ma non importato dal runtime guidato.

Licenze e provenienza in `public/licenses/`: Three.js MIT, Space Grotesk SIL OFL, asset e audio procedurali originali. Il sito personale e il deployment di produzione non sono stati modificati. Nessun push o deploy.
