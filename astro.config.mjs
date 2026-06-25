// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightUiTweaks from 'starlight-ui-tweaks';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import rehypeAdsense from './src/plugins/rehype-adsense.mjs';
import remarkGfm from 'remark-gfm';

// https://astro.build/config
export default defineConfig({
  site: 'https://fpvitalia.com',

  integrations: [
    starlight({
      title: 'FPV Italia',
      description: 'Il punto di riferimento italiano per i droni FPV',

      // Sito monolingua italiano: locale "root" = nessun prefisso /it/ negli URL
      defaultLocale: 'root',
      locales: {
        root: { label: 'Italiano', lang: 'it' },
      },

      logo: {
        light: './src/assets/logos/fpvitalia-wiki-blue.svg', // su sfondo chiaro (#0b5cd6)
        dark: './src/assets/logos/fpvitalia-wiki-white.svg', // su sfondo scuro (bianco)
        replacesTitle: true, // il logo contiene già "FPVItalia Wiki": nasconde il titolo
        alt: 'FPVItalia Wiki',
      },
      favicon: '/favicon.svg',
      customCss: ['./src/styles/custom.css'],

      components: {
        // Override dell'hero della splash: sfondo animato "droni"
        Hero: './src/components/Hero.astro',
        // Footer con disclosure affiliati globale (obbligo Amazon Associates/AGCM)
        Footer: './src/components/Footer.astro',
        // Head: inietta lo script AdSense solo se PUBLIC_ADSENSE_CLIENT è impostato
        Head: './src/components/Head.astro',
        // PageFrame: aggiunge il toggle desktop per chiudere/riaprire la sidebar
        PageFrame: './src/components/PageFrame.astro',
        // starlight-ui-tweaks sovrascrive ThemeSelect (toggle), TableOfContents e
        // MarkdownContent (riquadro Ad vuoto): li riportiamo ai default di Starlight
        // perché a noi serve SOLO la navbar (resa dal suo SocialIcons).
        ThemeSelect: '@astrojs/starlight/components/ThemeSelect.astro',
        TableOfContents: '@astrojs/starlight/components/TableOfContents.astro',
        MarkdownContent: '@astrojs/starlight/components/MarkdownContent.astro',
      },

      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/fpvitalia/wiki' },
      ],

      editLink: {
        baseUrl: 'https://github.com/fpvitalia/wiki/edit/main/',
      },

      plugins: [
        // Link di navigazione nell'header (Forum esterno + pagina Contribuisci)
        starlightUiTweaks({
          navbarLinks: [
            { label: 'Forum', href: 'https://forum.fpvitalia.com' },
            { label: 'Contribuisci', href: '/contribuisci/' },
            { label: 'Contatti', href: '/contatti/' },
          ],
        }),
      ],

      sidebar: [
        {
          label: 'Guide',
          // Tutte le guide vivono in sottocartelle-sezione (niente file sciolti in
          // guide/): le NUOVE guide dentro una sezione compaiono da sole (autogenerate).
          // L'unica riga manuale serve quando si crea una NUOVA sezione, per darle
          // l'etichetta giusta (l'autogenerate di una sottocartella userebbe il nome
          // minuscolo, es. "frsky" invece di "FrSky").
          items: [
            {
              label: 'Primi passi',
              collapsed: true,
              items: [{ autogenerate: { directory: 'guide/primi-passi', collapsed: true } }],
            },
            {
              label: 'Componenti',
              collapsed: true,
              items: [{ autogenerate: { directory: 'guide/componenti', collapsed: true } }],
            },
            {
              label: 'Configurazione',
              collapsed: true,
              items: [{ autogenerate: { directory: 'guide/configurazione', collapsed: true } }],
            },
            {
              label: 'ELRS',
              collapsed: true,
              items: [{ autogenerate: { directory: 'guide/elrs', collapsed: true } }],
            },
            {
              label: 'FrSky',
              collapsed: true,
              items: [{ autogenerate: { directory: 'guide/frsky', collapsed: true } }],
            },
            {
              label: 'Officina',
              collapsed: true,
              items: [{ autogenerate: { directory: 'guide/officina', collapsed: true } }],
            },
          ],
          collapsed: true,
        },
        { label: 'Community', link: '/community-droni-fpv-italia/' },
        {
          label: 'Recensioni',
          collapsed: true,
          items: [{ autogenerate: { directory: 'recensioni', collapsed: true } }],
        },
        {
          label: 'Normativa',
          collapsed: true,
          items: [{ autogenerate: { directory: 'normativa', collapsed: true } }],
        },
        {
          label: 'Dove comprare',
          collapsed: true,
          items: [{ autogenerate: { directory: 'dove-comprare', collapsed: true } }],
        },
        { label: 'Contatti', link: '/contatti/' },
      ],
    }),
    react(),
    sitemap(),
  ],

  // Inserimento automatico degli annunci nel contenuto degli articoli:
  // primo annuncio prima della 2ª sezione, poi ogni `everyHeadings`, + in fondo.
  markdown: {
    // remark-gfm esplicito: abilita le TABELLE (e altre estensioni GFM) anche
    // nei file .mdx, dove di default non venivano processate.
    remarkPlugins: [remarkGfm],
    rehypePlugins: [[rehypeAdsense, { everyHeadings: 3, headingLevel: 2 }]],
  },

  // Redirects per retrocompatibilità con i vecchi URL del sito (aggiungi qui)
  redirects: {
    '/come-iniziare-droni-fpv': '/guide/primi-passi/come-iniziare-droni-fpv/',
    '/cosa-significa-fpv': '/guide/primi-passi/fpv-significato/',
    '/guide/come-iniziare-droni-fpv': '/guide/primi-passi/come-iniziare-droni-fpv/',
    // ELRS spostata nella sua sezione
    '/guide/configurare-elrs-betaflight': '/guide/elrs/configurare-elrs-betaflight/',
    // Sezione FrSky (migrata dal vecchio sito)
    '/come-bindare-frsky': '/guide/frsky/come-bindare-frsky/',
    '/binding-riceventi-accst': '/guide/frsky/binding-riceventi-accst/',
    '/binding-riceventi-access': '/guide/frsky/binding-riceventi-access/',
    '/come-fare-il-binding-con-x8r': '/guide/frsky/binding-ricevente-x8r/',
    // Guide migrate dal vecchio sito (giugno 2026)
    '/come-scegliere-esc-droni': '/guide/componenti/come-scegliere-gli-esc/',
    '/guida-alla-cli-di-betaflight': '/guide/configurazione/guida-cli-betaflight/',
    '/dove-scaricare-i-software-di-configurazione-dei-droni-fpv':
      '/guide/configurazione/software-configurazione-droni/',
    '/come-utillizare-batterie-6s-con-motori-4s': '/guide/configurazione/batterie-6s-motori-4s/',
    '/drone-in-acqua-cosa-fare': '/guide/officina/drone-in-acqua-cosa-fare/',
    '/guida-acquisto-attrezzatura-da-laboratorio': '/guide/officina/attrezzatura-da-laboratorio/',
  },
});
