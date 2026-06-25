// rehype-adsense, inserisce automaticamente i blocchi pubblicitari nel
// contenuto degli articoli, senza doverli scrivere a mano negli MDX:
//   • uno ogni N intestazioni di sezione (configurabile)
//   • uno in fondo all'articolo
//
// Modalità:
//   - se publisher + unità non sono configurati → placeholder grigio
//     (come il componente <AdSense>);
//   - se sono configurati (ADSENSE_CLIENT + ADSENSE_SLOT_INARTICLE in src/config.mjs)
//     e non siamo in dev → blocco <ins class="adsbygoogle"> reale.
//
// Posizionamento: il primo annuncio va PRIMA della 2ª intestazione (cioè dopo
// la prima sezione), poi uno ogni `everyHeadings` intestazioni, più quello in
// fondo all'articolo.
//
// Opzioni:
//   everyHeadings  ogni quante sezioni ripetere l'annuncio (default 3)
//   headingLevel   livello dell'intestazione da contare (default 2 → "##")
//   atEnd          inserire un annuncio in fondo all'articolo (default true)
//
// Opt-out per singola pagina: front matter `ads: false`.
// Le pagine `template: splash` (es. homepage) sono sempre escluse.

import {
  ADSENSE_CLIENT as CLIENT,
  ADSENSE_SLOT_INARTICLE,
  ADSENSE_SLOT_FOOTER,
} from '../config.mjs';

const IS_DEV = process.env.NODE_ENV === 'development';
// Slot per posizione: in-article (unità fluid) e footer (unità display separata).
const SLOTS = { 'in-article': ADSENSE_SLOT_INARTICLE, footer: ADSENSE_SLOT_FOOTER };

// Mostra un blocco per `placement` se: in dev (placeholder) oppure in produzione
// con publisher + slot di quella posizione configurati.
function shows(placement) {
  return IS_DEV || (Boolean(CLIENT) && Boolean(SLOTS[placement]));
}

const LABELS = {
  'in-article': 'Annuncio · in articolo',
  footer: 'Annuncio · piè di pagina',
};

function el(tagName, properties = {}, children = []) {
  return { type: 'element', tagName, properties, children };
}
function text(value) {
  return { type: 'text', value };
}

// Costruisce il nodo HAST dell'annuncio (reale in prod con slot, altrimenti
// placeholder solo in dev).
function adNode(placement) {
  const wrapperClass = ['adsense', `adsense--${placement}`, 'not-content'];
  const slot = SLOTS[placement];
  const inArticle = placement === 'in-article';

  if (!IS_DEV && CLIENT && slot) {
    return el('div', { className: wrapperClass }, [
      el('ins', {
        className: ['adsbygoogle'],
        style: 'display:block; text-align:center;',
        dataAdClient: CLIENT,
        dataAdSlot: slot,
        dataAdFormat: inArticle ? 'fluid' : 'auto',
        dataAdLayout: inArticle ? 'in-article' : undefined,
        dataFullWidthResponsive: inArticle ? undefined : 'true',
      }),
      el('script', {}, [
        text('(adsbygoogle = window.adsbygoogle || []).push({});'),
      ]),
    ]);
  }

  return el('div', { className: wrapperClass }, [
    el('div', { className: ['adsense__placeholder'], ariaHidden: 'true' }, [
      el('span', {}, [text(LABELS[placement] ?? 'Spazio pubblicitario')]),
    ]),
  ]);
}

function isAdNode(node) {
  return (
    node?.type === 'element' &&
    Array.isArray(node.properties?.className) &&
    node.properties.className.includes('adsense')
  );
}

export default function rehypeAdsense(options = {}) {
  const everyHeadings = Math.max(1, options.everyHeadings ?? 3);
  const headingTag = `h${options.headingLevel ?? 2}`;
  const atEnd = options.atEnd ?? true;

  return (tree, file) => {
    // Niente da fare se non mostriamo nulla (prod senza publisher/slot e non dev).
    if (!shows('in-article') && !shows('footer')) return;
    const fm = file?.data?.astro?.frontmatter ?? {};
    if (fm.template === 'splash' || fm.ads === false) return;

    const out = [];
    let headingCount = 0;

    for (const node of tree.children) {
      if (node.type === 'element' && node.tagName === headingTag) {
        headingCount += 1;
        // Primo annuncio prima della 2ª intestazione, poi ogni `everyHeadings`:
        // intestazioni 2, 2+every, 2+2·every, …
        if (
          shows('in-article') &&
          headingCount >= 2 &&
          (headingCount - 2) % everyHeadings === 0
        ) {
          out.push(adNode('in-article'));
        }
      }
      out.push(node);
    }

    // Annuncio in fondo, solo su pagine con contenuto reale (≥1 sezione) e se
    // l'ultimo blocco non è già un annuncio (evita doppioni ravvicinati).
    if (atEnd && shows('footer') && headingCount >= 1 && !isAdNode(out[out.length - 1])) {
      out.push(adNode('footer'));
    }

    tree.children = out;
  };
}
