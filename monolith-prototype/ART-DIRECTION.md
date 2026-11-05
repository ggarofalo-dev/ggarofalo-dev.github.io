> Edizione guidata: WASD e pointer lock sono sostituiti da scelte di destinazione, trasferimenti di 2–4 secondi e lettura a camera ferma. L’altezza è di 10 unità. Quattro stazioni vengono rivelate dal risveglio. Vedere README.md per il comportamento corrente.

# MONOLITH / The hall remembers

## Regia implementata

Il punto di vista è quello di un corpo piccolo dentro un’infrastruttura smisurata. La scala si legge attraverso ripetizione dei moduli, pilastri che proseguono oltre il campo visivo, recessi e piani successivi nella nebbia. Le aperture alte illuminano spigoli, non tutta la sala. La fascia riflettente centrale lega il giocatore al monolite senza disegnare una griglia luminosa.

La struttura principale è scura, non nera uniforme: superfici porose, tagli satinati, riflessi metallici e pietra lucida devono produrre letture diverse con la stessa luce. I fasci attraversano aperture della copertura e non sostituiscono l’architettura.

Il monolite occupa il punto di fuga. La separazione in pannelli è visibile prima dell’evento; giunti e luce incassata anticipano una struttura reale. L’apertura non crea oggetti casuali: rivela ciò che era contenuto e modifica il sistema che lo circonda.

## Sequenza, secondi

| Intervallo | Evento |
| --- | --- |
| 0–2,6 | Camera si allinea e arretra nel corridoio libero |
| 1,8–3,8 | Rilascio del sistema, anticipo luminoso |
| 3–7,7 | Sei pannelli si separano con stagger e lieve rotazione |
| 4,5–7,7 | Il nucleo acquisisce energia |
| 5,3–9,8 | Otto diaframmi ruotano, cambia la luce architettonica |
| 5–10,7 | Atmosfera da fredda e opaca a più chiara e minerale |
| 7,2–8,8 | Impatto sonoro contenuto, se abilitato |
| 8,1–10,4 | THE HUMAN VARIABLE emerge come elemento nello spazio |
| 10–13 | La camera si assesta all’altezza del giocatore e restituisce controllo |

## Criteri di revisione su immagini reali

Non sono ancora stati osservati screenshot WebGL. I punti seguenti sono criteri, non risultati raggiunti o certificati.

- L’immagine iniziale deve mostrare una gerarchia chiara: pavimento / pilastri / monolite / apertura di fondo.
- Le facce del monolite devono essere distinguibili pur restando molto scure. Se diventano una silhouette priva di materiale, aumentare il rapporto luce di riempimento/riflessi prima dell’esposizione globale.
- I fasci devono sembrare un effetto della luce e della profondità, non pannelli trasparenti. Ridurne l’opacità prima di aggiungere altri effetti.
- Le giunzioni del pavimento devono suggerire peso e precisione; il riflesso non deve avere l’aspetto di uno specchio perfetto.
- Il nucleo deve essere una sorgente intensa e localizzata. Non deve bruciare tutti i dettagli o trasformare la sala in neon verde.
- I movimenti dei pannelli e dei diaframmi devono apparire causali e pesanti. Non aumentare velocità e oscillazioni per renderli più evidenti.
- Il titolo deve essere leggibile nella composizione 3D, senza richiedere una schermata sovrapposta.
- La qualità deve reggere anche con il suono spento e da una posizione statica.

Solo una revisione delle immagini e una prova del controllo possono chiudere questo gate. I test del grafo della scena verificano l’esistenza e la coerenza della regia, non la sua efficacia visiva.
