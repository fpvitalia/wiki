// Scarica e ridimensiona le immagini prodotto dagli store Shopify (drone24hours,
// geprc, sub250, chinahobbyline, stonehobby) partendo dai link in prodotti.yaml.
// Idempotente: salta i prodotti che hanno già l'immagine locale. Non fa nulla per
// i prodotti senza un link a uno store supportato (es. solo Amazon).
//
// Uso:  node scripts/fetch-product-images.mjs   (anche come `npm run fetch-images`)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import sharp from 'sharp';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT_DIR = path.join(ROOT, 'public/images/prodotti');
const WIDTH = 500; // larghezza target (px); l'altezza resta proporzionale

// Domini Shopify da cui sappiamo estrarre l'immagine.
const SHOPIFY = ['drone24hours.com', 'geprc.com', 'sub250.com', 'chinahobbyline.com', 'stonehobby.com'];

function shopifyJsonUrl(rawUrl) {
  const u = new URL(rawUrl);
  if (!SHOPIFY.some((d) => u.hostname.includes(d))) return null;
  // estrae /products/<slug> anche da /collections/x/products/<slug>
  const m = u.pathname.match(/\/products\/([^/]+)/);
  if (!m) return null;
  return `${u.origin}/products/${m[1]}.json`;
}

async function imageUrlFor(product) {
  const candidates = [product.amazon_it, product.aliexpress, ...Object.values(product.negozi ?? {})].filter(Boolean);
  for (const url of candidates) {
    const jsonUrl = shopifyJsonUrl(url);
    if (!jsonUrl) continue;
    try {
      const res = await fetch(jsonUrl);
      if (!res.ok) continue;
      const data = await res.json();
      const src = data?.product?.image?.src || data?.product?.images?.[0]?.src;
      if (src) return src;
    } catch {
      /* prova il prossimo */
    }
  }
  return null;
}

async function main() {
  const file = path.join(ROOT, 'src/data/prodotti.yaml');
  const data = parse(fs.readFileSync(file, 'utf-8'));
  const prodotti = Object.assign({}, ...Object.values(data));
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let done = 0;
  let skipped = 0;
  for (const [id, product] of Object.entries(prodotti)) {
    const target = path.join(OUT_DIR, `${id}.webp`);
    if (fs.existsSync(target)) {
      skipped++;
      continue;
    }
    const src = await imageUrlFor(product);
    if (!src) continue;
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await sharp(buf).resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: 80 }).toFile(target);
      console.log(`✓ ${id}  <-  ${src.split('?')[0]}`);
      done++;
    } catch (err) {
      console.warn(`✗ ${id}: ${err.message}`);
    }
  }
  console.log(`\nFatto: ${done} scaricate, ${skipped} già presenti.`);
}

main();
