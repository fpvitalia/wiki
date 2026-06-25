// Configurazione pubblica del sito. Usata dai componenti .astro e dal plugin
// rehype-adsense. Gli annunci e GA si attivano solo nelle build di produzione.

// --- AdSense ---
// ID publisher. Vuoto = AdSense disattivato.
export const ADSENSE_CLIENT = 'ca-pub-6316772204446641';

// Unità annuncio in-article (inserimento automatico). Vuoto = nessun annuncio.
export const ADSENSE_SLOT_INARTICLE = '9655356256';

// Unità annuncio a fine articolo. Vuoto = nessun annuncio.
export const ADSENSE_SLOT_FOOTER = '4826030088';

// --- Google Analytics 4 ---
// Measurement ID GA4 (G-XXXXXXXXXX). Vuoto = GA disattivato.
export const GA4_ID = 'G-0XR79GCPCF';
