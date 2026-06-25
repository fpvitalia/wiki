import { parse } from 'yaml';
// Import via Vite `?raw`: Vite traccia il file come dipendenza, quindi in dev
// l'HMR ricarica automaticamente quando prodotti.yaml cambia (niente riavvio).
import prodottiYaml from '@/data/prodotti.yaml?raw';

export interface Prodotto {
  nome: string;
  descrizione?: string;
  amazon_it?: string; // legacy: link Amazon (resta supportato)
  aliexpress?: string; // legacy: link AliExpress (resta supportato)
  // Link aggiuntivi: chiave negozio -> URL (banggood, ebay, getfpv, ...).
  // amazon_it/aliexpress sopra restano per retrocompatibilità.
  negozi?: Record<string, string>;
  prezzo_indicativo?: number;
  valuta?: string;
  rating?: number;
  immagine?: string;
  tag?: string[];
}

export interface NegozioLink {
  store: string; // chiave (es. "amazon")
  label: string; // etichetta da mostrare (es. "Amazon")
  url: string;
}

// Etichette "belle" per i negozi noti; gli altri vengono capitalizzati.
const STORE_LABELS: Record<string, string> = {
  amazon: 'Amazon',
  aliexpress: 'AliExpress',
  banggood: 'Banggood',
  ebay: 'eBay',
  getfpv: 'GetFPV',
  pyrodrone: 'Pyrodrone',
  droneshop: 'DroneShop',
  drone24hours: 'Drone24Hours',
  chinahobbyline: 'China Hobby Line',
  stonehobby: 'StoneHobby',
  geprc: 'GEPRC',
  sub250: 'SUB250',
};

function storeLabel(store: string): string {
  return STORE_LABELS[store] ?? store.charAt(0).toUpperCase() + store.slice(1);
}

// AFFILIAZIONI: regole per dominio. In prodotti.yaml basta mettere il link
// PULITO al prodotto: in base al dominio aggiungiamo qui i parametri affiliati
// giusti. Se un parametro è già presente nel link, NON lo sovrascriviamo.
const AFFILIATE_RULES: { match: string; params: Record<string, string> }[] = [
  { match: 'amazon.', params: { tag: 'fpvitalia-21' } },
  {
    match: 'drone24hours.com',
    params: {
      sca_ref: '6619445.v3FDBNzpAEXEES',
      utm_source: 'affiliate',
      utm_medium: '180537',
      utm_campaign: 'fpv-italia',
    },
  },
  { match: 'chinahobbyline.com', params: { ref: 'fpvitalia' } },
  { match: 'stonehobby.com', params: { ref: 'fpvitalia' } },
  { match: 'geprc.com', params: { ref: 'fpvitalia' } },
  { match: 'sub250.com', params: { ref: 'fpvitalia' } },
];

// Aggiunge i parametri affiliati al link in base al dominio. Lascia invariati
// i link non riconosciuti e quelli non validi (es. placeholder INSERISCI_QUI).
export function applyAffiliate(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const rule = AFFILIATE_RULES.find((r) => host.includes(r.match));
    if (!rule) return url;
    for (const [key, value] of Object.entries(rule.params)) {
      if (!u.searchParams.has(key)) u.searchParams.set(key, value);
    }
    return u.toString();
  } catch {
    return url;
  }
}

// prodotti.yaml è l'UNICA fonte di verità per i link affiliati.
// Parsed a build time (i componenti Astro girano sul server) e appiattito in una
// mappa id -> prodotto.
const data = parse(prodottiYaml) as Record<string, Record<string, Prodotto>>;

export const prodotti: Record<string, Prodotto> = Object.values(data).reduce(
  (acc, categoria) => Object.assign(acc, categoria),
  {} as Record<string, Prodotto>
);

export function getProdotto(id: string): Prodotto | undefined {
  return prodotti[id];
}

// Lista ordinata e deduplicata dei link-negozio di un prodotto:
// prima i campi storici (amazon_it, aliexpress), poi i `negozi` extra
// nell'ordine in cui compaiono nel YAML. Scarta gli URL vuoti.
export function getNegozi(p: Prodotto): NegozioLink[] {
  const out: NegozioLink[] = [];
  const seen = new Set<string>();
  const add = (store: string, url?: string): void => {
    if (!url || seen.has(store)) return;
    seen.add(store);
    out.push({ store, label: storeLabel(store), url: applyAffiliate(url) });
  };
  add('amazon', p.amazon_it);
  add('aliexpress', p.aliexpress);
  if (p.negozi) for (const [store, url] of Object.entries(p.negozi)) add(store, url);
  return out;
}

// Link "principale" per i contesti a singolo link (es. ProductLink inline).
export function getPrimaryLink(p: Prodotto): string | undefined {
  return getNegozi(p)[0]?.url;
}
