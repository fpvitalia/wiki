# Contribuire a FPV Italia

Grazie per voler contribuire a FPV Italia! Questo sito è costruito dalla community italiana FPV e ogni contributo è benvenuto.

## Come contribuire

Tutti i contenuti del sito sono **file Markdown** nel repository GitHub: per
contribuire ti basta un account GitHub, **non devi installare niente** né saper
usare Git da terminale. Si fa tutto dal browser.

### Correggere o migliorare una pagina esistente (il modo più veloce)

1. Apri la pagina sul sito e clicca **"Modifica questa pagina"** in fondo:
   ti porta direttamente all'editor di GitHub, sul file giusto.
2. Modifica il testo.
3. In fondo alla pagina di GitHub scegli **"Create a new branch... and start a
   pull request"** e clicca **Propose changes**.
4. Un membro del team revisiona e pubblica.

### Scrivere un nuovo articolo (dal browser)

1. Sul repository apri la cartella della categoria giusta:
   - Guide → `src/content/docs/guide/`
   - Recensioni → `src/content/docs/recensioni/`
   - Normativa → `src/content/docs/normativa/`
   - Dove comprare → `src/content/docs/dove-comprare/`
2. Clicca **Add file → Create new file**.
3. Dai un nome al file: tutto **minuscolo**, parole separate da **trattini**,
   con estensione `.md` (es. `come-scegliere-le-eliche.md`). Il nome del file
   diventa l'indirizzo (URL) dell'articolo.
4. Incolla il **template** qui sotto e scrivi il tuo contenuto.
5. In fondo clicca **Commit changes...** e scegli **Create a new branch and
   start a pull request**.

> Usa `.md` per il testo normale. Serve `.mdx` **solo** se inserisci le schede
> prodotto `<ProductCard>` / `<ProductLink>` (vedi sezione _Consigliare prodotti_).

## Template articolo

```mdx
---
title: "Titolo della guida"
description: "Descrizione breve (max 160 caratteri) per SEO"
author: "tuo-username-github"
date: 2026-01-01
tags: ["tag1", "tag2", "tag3"]
category: "guide"                     # guide | recensioni | normativa | dove-comprare
difficulty: "intermedio"              # principiante | intermedio | avanzato
readingTime: 10                       # minuti stimati di lettura
image: "/images/guide/nome-articolo/cover.jpg"
draft: false
---

Testo dell'articolo qui...

## Primo capitolo

Contenuto...

## Secondo capitolo

Contenuto...
```

## Immagini: dove metterle e come inserirle

Questa è la parte che genera più dubbi, quindi spieghiamola con calma.

### Dove vanno le immagini

Le immagini stanno in **`public/images/`** e, per non fare confusione, **ogni
articolo ha la sua cartella**, dentro la categoria, con lo **stesso nome del file
dell'articolo** (lo "slug"):

```
public/images/
├── guide/
│   ├── come-scegliere-le-eliche/        ← cartella di QUESTO articolo
│   │   ├── cover.jpg
│   │   ├── elica-tripala.jpg
│   │   └── confronto-misure.jpg
│   └── come-iniziare-droni-fpv/
│       └── cover.jpg
├── recensioni/
│   └── dji-goggles-3/
│       └── cover.jpg
└── prodotti/                            ← foto prodotti (le gestisce il team)
```

Regola semplice: se il tuo articolo è `guide/come-scegliere-le-eliche.md`, le sue
immagini vanno in `public/images/guide/come-scegliere-le-eliche/`.

### Come si linkano nell'articolo

Una volta che l'immagine è nella sua cartella, la richiami con un percorso
**assoluto** che parte da `/images/...` (occhio: **senza** la parte `public/`):

```markdown
![Elica tripala da 5 pollici](/images/guide/come-scegliere-le-eliche/elica-tripala.jpg)
```

Il testo tra parentesi quadre `[...]` è la **descrizione** dell'immagine (per
accessibilità e SEO): scrivila sempre.

Per l'immagine grande di copertina ("hero") in cima all'articolo, invece, va nel
front matter:

```yaml
image: "/images/guide/come-scegliere-le-eliche/cover.jpg"
```

**Nomi dei file:** tutto minuscolo, con i trattini, senza spazi né accenti.
✅ `elica-tripala.jpg`  ❌ `Elica Tripala.JPG`. Il nome nel link deve essere
identico a quello del file caricato (maiuscole/minuscole comprese).

### Come aggiungere le immagini da GitHub (senza installare niente)

Tre modi: i primi due sono i più semplici, il terzo è per chi se la cava.

**1. Trascinale dentro la Pull Request (il più facile)**
Mentre scrivi la **descrizione della PR** (o un commento), **trascina
l'immagine** nel riquadro di testo: GitHub la carica e inserisce un link da sola.
Allegale tutte così, indicando per ognuna dove va, e **ci pensiamo noi** a
sistemarle nella cartella dell'articolo in fase di revisione.

**2. Lascia un promemoria (se non te la senti proprio)**
Nel punto in cui vuoi l'immagine, scrivi solo:

```markdown
<!-- IMMAGINE: foto del Radiomaster Boxer vista dall'alto -->
```

Inseriamo noi l'immagine giusta al momento della revisione. **Meglio un buon
articolo senza immagini che nessun articolo:** non bloccarti su questo.

**3. Caricale tu nella cartella dell'articolo (se sai muoverti su GitHub)**
1. Crea la cartella dell'articolo: _Add file → Create new file_ e come nome
   scrivi il percorso completo, es.
   `public/images/guide/come-scegliere-le-eliche/cover.jpg`… ma poiché non puoi
   trascinare un'immagine in "Create new file", il modo pratico è: prima crei la
   cartella con un file qualsiasi (es. scrivi nel nome
   `public/images/guide/come-scegliere-le-eliche/.gitkeep` e committi).
2. Poi **entra** in quella cartella e usa _Add file → Upload files_: ora i file
   caricati finiscono lì dentro.
3. Linkali nell'articolo con `/images/guide/come-scegliere-le-eliche/nome.jpg`.

> In pratica: se non sei pratico, usa il **metodo 1 o 2** e l'organizzazione in
> cartelle la curiamo noi. Nessuno si aspetta che tu combatta con le cartelle di
> GitHub.

### E le foto dei prodotti?

Per le **schede prodotto** non devi caricare niente: `<ProductCard>` usa
automaticamente le immagini già configurate in `src/data/prodotti.yaml`. Tu
inserisci solo la scheda (vedi _Consigliare prodotti_), all'immagine pensa il sito.

## Linee guida per gli articoli

- Scrivi in italiano
- Usa un tono informale ma tecnico
- Ogni articolo deve avere almeno 800 parole
- Aggiungi immagini dove possibile
- Struttura il contenuto con H2 e H3
- Includi una sezione "Cosa ti serve" all'inizio per le guide pratiche
- Includi una sezione "Risoluzione problemi" alla fine

## Consigliare prodotti

Per citare o consigliare un prodotto non incollare link diretti ai negozi: usa i componenti dedicati, che creano una scheda o un link curato e uniforme (richiede estensione `.mdx`):

```mdx
import ProductCard from '@/components/ProductCard.astro';
import ProductLink from '@/components/ProductLink.astro';

<!-- Card prodotto con immagine e prezzo -->
<ProductCard id="radiomaster_tx15" />

<!-- Link inline nel testo -->
Il <ProductLink id="radiomaster_tx15" /> è perfetto per iniziare.
```

I prodotti disponibili sono elencati in `src/data/prodotti.yaml`. Per proporne uno nuovo, segnalalo nella tua PR.

## Processo di revisione

1. Un membro del team legge la tua PR entro 48 ore
2. Potremmo suggerire modifiche (struttura, SEO, chiarezza)
3. Dopo l'approvazione, l'articolo viene pubblicato automaticamente
4. Il tuo nome appare come autore con link al tuo profilo GitHub

## Cosa NON includere

- Contenuti copiati da altri siti
- Link diretti a negozi (usa i componenti per i prodotti)
- Contenuti promozionali non dichiarati
- Informazioni su come aggirare la normativa sui droni
- Contenuti non correlati al mondo FPV/droni

## Licenza e attribuzione

Contribuendo contenuti a FPV Italia, accetti i seguenti termini:

### Contributor License Agreement (CLA)

1. **Licenza concessa**: concedi a FPV Italia una licenza perpetua, mondiale, non esclusiva, gratuita e irrevocabile di pubblicare, modificare, tradurre, distribuire e sfruttare **anche a fini commerciali** (inclusi pubblicità e link affiliati) il tuo contenuto sul sito fpvitalia.com e sui canali social associati.

2. **Diritti dell'autore**: mantieni tutti i diritti sul tuo contenuto originale. Puoi ripubblicarlo altrove (sul tuo blog, Medium, ecc.) dopo 30 giorni dalla pubblicazione su FPV Italia.

3. **Attribuzione**: ogni articolo include il nome dell'autore, un link al profilo GitHub e (se fornito) un link al canale YouTube/Instagram dell'autore.

4. **Originalità**: dichiari che il contenuto è originale e non viola diritti di terzi.

5. **Modifica ed eliminazione**: FPV Italia si riserva il diritto di modificare il contenuto per ragioni editoriali (errori, SEO, aggiornamenti tecnici). L'autore può **chiedere** la rimozione del proprio contenuto, che FPV Italia valuterà a propria discrezione; la licenza già concessa resta comunque valida sul materiale già pubblicato o distribuito.

Inviando una Pull Request, accetti automaticamente questi termini.

## Riconoscimenti

Tutti i contributori sono elencati automaticamente nella [pagina Contributori del repository](https://github.com/fpvitalia/wiki/graphs/contributors). Inoltre:

- ogni articolo riporta il nome dell'autore con link al suo profilo GitHub;
- se fornito, aggiungiamo il link al tuo canale YouTube/Instagram;
- badge "Contributore" sul [forum](https://forum.fpvitalia.com) FPV Italia.

## Domande?

Apri una [issue su GitHub](https://github.com/fpvitalia/wiki/issues) o scrivici sul [forum](https://forum.fpvitalia.com).
