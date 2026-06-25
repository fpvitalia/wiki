// Cerca i prodotti di prodotti.yaml sugli store Shopify e stampa i CANDIDATI
// (titolo + URL) da confermare a mano. NON modifica prodotti.yaml.
//
// Uso:  node scripts/search-product-links.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const data = parse(fs.readFileSync(path.join(ROOT, 'src/data/prodotti.yaml'), 'utf-8'));
const prodotti = Object.assign({}, ...Object.values(data));

const BROAD = ['drone24hours.com', 'stonehobby.com'];
// store di marca: usati solo se il nome contiene la keyword
const BRAND = [
  { kw: ['geprc'], store: 'geprc.com' },
  { kw: ['cnhl', 'china hobby'], store: 'chinahobbyline.com' },
  { kw: ['sub250', 'sub 250'], store: 'sub250.com' },
];

async function search(store, q) {
  const url = `https://${store}/search/suggest.json?q=${encodeURIComponent(q)}&resources%5Btype%5D=product&resources%5Blimit%5D=3`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const j = await res.json();
    return (j?.resources?.results?.products ?? []).map((p) => ({
      title: p.title,
      url: `https://${store}${p.url.split('?')[0]}`,
    }));
  } catch {
    return [];
  }
}

function hasStoreLink(p) {
  return p.negozi && Object.keys(p.negozi).length > 0;
}

// query "ripulita": primi termini del nome, senza parentesi
function queryFor(nome) {
  return nome.replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();
}

const targets = process.argv.slice(2); // opzionale: id specifici

for (const [id, p] of Object.entries(prodotti)) {
  if (targets.length && !targets.includes(id)) continue;
  if (!targets.length && hasStoreLink(p)) continue; // salta quelli già fatti
  const q = queryFor(p.nome);
  const stores = [...BROAD];
  for (const b of BRAND) if (b.kw.some((k) => p.nome.toLowerCase().includes(k))) stores.push(b.store);

  console.log(`\n### ${id},  ${p.nome}   (query: "${q}")`);
  let any = false;
  for (const store of stores) {
    const hits = await search(store, q);
    for (const h of hits) {
      console.log(`  [${store}] ${h.title}\n      ${h.url}`);
      any = true;
    }
  }
  if (!any) console.log('  (nessun candidato trovato)');
}
