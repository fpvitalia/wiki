// Animazione hero "droni": ogni punto è la testa di un drone che si muove su
// una traiettoria sinuosa in uno spazio 3D; dietro lascia una scia che SEGUE
// il percorso reale (storico delle posizioni) e si rastrema a punta verso la
// coda, come la traccia di un drone in un videogioco. Disegnata su canvas.

/* ============================================================================
 *  PARAMETRI EFFETTO: modifica solo questi valori per regolare l'animazione.
 *  (i campi *Min/*Max definiscono un intervallo casuale per ogni drone)
 * ========================================================================== */
export const CONFIG = {
  // DENSITÀ: 1 drone ogni ~N pixel d'area (più basso = più droni)
  areaPerPoint: 9000,
  minCount: 20,
  maxCount: 20,

  // VELOCITÀ verso lo spettatore (riferita a 1/60s; l'animazione è time-based
  // quindi la velocità reale è identica su qualsiasi refresh dello schermo)
  speedMin: 0.0016,
  speedMax: 0.0046,

  // CURVATURA sinuosa della traiettoria
  curveAmpMin: 1, // ampiezza (più alto = curve più larghe)
  curveAmpMax: 2,
  curveFreqMin: 0.3, // frequenza (più alto = curve più strette)
  curveFreqMax: 1.1,

  // PROFONDITÀ del "tunnel"
  near: 0.16, // punto più vicino prima del reset
  far: 1.7, // punto più lontano (spawn)
  focal: 0.9, // "lunghezza focale": più alto = punti più sparsi/zoomati

  // ASPETTO scia / testa
  opacityBase: 0.08, // opacità dei droni lontani
  opacityGain: 0.5, // opacità extra per i droni vicini
  widthBase: 3, // spessore della scia sulla testa
  widthGain: 2.4, // spessore extra per i droni vicini
  tailWidth: 0.15, // spessore alla coda (→ punta)
  trailLength: 65, // NUMERO di punti della scia (più alto = scia più lunga)
  headSize: 1.2, // raggio extra della "testa" (il drone)

  // RESA / TOGGLE (prova on/off)
  smoothTrail: true, // true = scia liscia (forma piena rastremata) · false = segmenti (mostra i "pallini")
  headGlow: true, // true = bagliore sulla testa · false = testa piatta
  headGlowBlur: 35, // intensità del bagliore (px, scala con la vicinanza)
  droneHeads: true, // true = testa a forma di drone (quad top-down) · false = pallino
  droneSize: 1.9, // dimensione del drone (× rispetto al raggio della "testa")
  droneBank: true, // true = il drone si inclina (rolla) in virata
  bankGain: 26, // quanto rolla in base alla velocità di virata
  maxBank: 1.3, // inclinazione massima (rad, ~74°)

  // VELOCITÀ globale del tempo (oscillazione delle curve)
  timeStep: 0.016,

  // COLORE (RGB) per tema (usato quando multiColor = false)
  colorDark: "120,178,255",
  colorLight: "13,86,200",

  // COLORI per drone (toggle): ogni drone un colore diverso, stile team.
  // Due palette (stessi "slot", stessa lunghezza): chiare per il tema scuro,
  // più sature/scure per il tema chiaro (così restano leggibili sul bianco).
  multiColor: true, // false = colore unico del tema
  paletteDark: [
    "120,178,255", // azzurro
    "255,107,107", // rosso
    "120,224,143", // verde
    "255,209,102", // giallo
    "199,146,255", // viola
    "100,223,223", // ciano
    "255,159,90", // arancione
    "255,138,200", // rosa
  ],
  paletteLight: [
    "21,101,216", // azzurro
    "214,40,40", // rosso
    "23,158,80", // verde
    "224,150,0", // ambra
    "124,58,209", // viola
    "13,148,154", // teal
    "214,99,20", // arancione
    "199,42,138", // magenta
  ],
};
/* ========================================================================== */

interface Trail {
  x: number; // posizione "mondo" -1..1
  y: number;
  z: number; // profondità (grande = lontano)
  vz: number; // velocità verso lo spettatore
  ph: number; // fase curva (1ª armonica)
  ph2: number; // fase curva (2ª armonica, per traiettorie meno periodiche)
  sp: number; // frequenza curva
  amp: number; // ampiezza curva
  hist: { x: number; y: number }[]; // storico posizioni proiettate (la scia)
  fresh: boolean; // appena (ri)nato: azzera la scia per evitare salti
  colorIdx: number; // "slot" colore del drone (indice nelle palette)
  prevAng: number; // heading del frame precedente (per calcolare la virata)
  bank: number; // inclinazione corrente (rollio), smussata
}

export function initHeroTrails(root: HTMLElement): void {
  // Guard anti-doppio-init: se lo script viene rieseguito sullo stesso nodo
  // (HMR in dev, view transitions, doppio import) NON creiamo un secondo loop
  // che si sommerebbe al primo (→ animazione accelerata).
  if (root.dataset.heroTrailsInit) return;
  root.dataset.heroTrailsInit = "1";

  const C = CONFIG;
  const canvas = root.querySelector<HTMLCanvasElement>(".fpv-hero__canvas");
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w = 0;
  let h = 0;
  let cx = 0;
  let cy = 0;
  let focal = 1;
  let raf = 0;
  let running = false;
  let t = 0;
  let lastTime = 0; // timestamp rAF precedente (per il delta-time)
  let parts: Trail[] = [];

  const isLight = () => document.documentElement.dataset.theme === "light";

  function reset(p: Trail, seed: boolean): void {
    p.x = Math.random() * 2 - 1;
    p.y = Math.random() * 2 - 1;
    p.z = seed ? C.near + Math.random() * (C.far - C.near) : C.far;
    p.vz = C.speedMin + Math.random() * (C.speedMax - C.speedMin);
    p.ph = Math.random() * Math.PI * 2;
    p.ph2 = Math.random() * Math.PI * 2;
    p.sp = C.curveFreqMin + Math.random() * (C.curveFreqMax - C.curveFreqMin);
    p.amp = C.curveAmpMin + Math.random() * (C.curveAmpMax - C.curveAmpMin);
    p.hist = [];
    p.fresh = true;
    p.colorIdx = (Math.random() * C.paletteDark.length) | 0;
    p.prevAng = 0;
    p.bank = 0;
  }

  function rebuild(): void {
    const count = Math.round(
      Math.min(C.maxCount, Math.max(C.minCount, (w * h) / C.areaPerPoint)),
    );
    parts = Array.from({ length: count }, () => {
      const p = {} as Trail;
      reset(p, true);
      return p;
    });
  }

  function size(): void {
    const r = root.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width));
    h = Math.max(1, Math.round(r.height));
    cx = w / 2;
    cy = h / 2;
    focal = Math.min(w, h) * C.focal;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    rebuild();
  }

  function project(
    p: Trail,
    time: number,
  ): { X: number; Y: number; near: number } {
    // traiettoria = base + due armoniche sfasate (curve più organiche)
    const sx =
      p.x +
      Math.sin(time * p.sp + p.ph) * p.amp +
      Math.sin(time * p.sp * 2.7 + p.ph2) * p.amp * 0.35;
    const sy =
      p.y +
      Math.cos(time * p.sp * 0.8 + p.ph) * p.amp +
      Math.cos(time * p.sp * 1.9 + p.ph2) * p.amp * 0.35;
    const f = focal / p.z;
    const near = 1 - (p.z - C.near) / (C.far - C.near); // 0 lontano .. 1 vicino
    return { X: cx + sx * f, Y: cy + sy * f, near };
  }

  // Disegna la scia come UN'UNICA forma piena rastremata (nessun cap tondo
  // per-segmento -> niente "pallini"). I bordi seguono la traiettoria e la
  // larghezza va da ~0 (coda, a punta) alla testa; il gradiente sfuma l'opacità.
  function ribbon(
    pts: { x: number; y: number }[],
    n: number,
    headW: number,
    headA: number,
    c: string,
  ): void {
    const left: { x: number; y: number }[] = [];
    const right: { x: number; y: number }[] = [];
    for (let i = 0; i < n; i++) {
      const prev = pts[i > 0 ? i - 1 : 0];
      const next = pts[i < n - 1 ? i + 1 : n - 1];
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len; // normale alla traiettoria
      const ny = dx / len;
      const f1 = i / (n - 1); // 0 coda .. 1 testa
      const hw = (C.tailWidth + (headW - C.tailWidth) * f1) / 2;
      left.push({ x: pts[i].x + nx * hw, y: pts[i].y + ny * hw });
      right.push({ x: pts[i].x - nx * hw, y: pts[i].y - ny * hw });
    }
    ctx!.beginPath();
    ctx!.moveTo(left[0].x, left[0].y);
    for (let i = 1; i < n; i++) ctx!.lineTo(left[i].x, left[i].y);
    for (let i = n - 1; i >= 0; i--) ctx!.lineTo(right[i].x, right[i].y);
    ctx!.closePath();
    const tail = pts[0];
    const head = pts[n - 1];
    const g = ctx!.createLinearGradient(tail.x, tail.y, head.x, head.y);
    g.addColorStop(0, `rgba(${c},0)`);
    g.addColorStop(1, `rgba(${c},${headA})`);
    ctx!.fillStyle = g;
    ctx!.fill();
  }

  // Disegna un piccolo quad (top-down) orientato lungo `angle`: bracci a X,
  // 4 rotori (anelli) e corpo centrale. Il glow è applicato SOLO al corpo
  // (una sola operazione ombreggiata) per non pesare sulle perf.
  function drawDrone(
    x: number,
    y: number,
    s: number,
    angle: number,
    c: string,
    alpha: number,
    glow: boolean,
    glowBlur: number,
    bank: number,
  ): void {
    const g = ctx!;
    g.save();
    g.translate(x, y);
    g.rotate(angle);
    // rollio: lean verso l'interno della virata + eliche "accorciate"
    // prospetticamente (scala sull'asse perpendicolare al moto = cos(bank)).
    if (bank) {
      g.translate(0, Math.sin(bank) * s * 0.5);
      g.scale(1, Math.cos(bank));
    }
    g.shadowBlur = 0; // bracci/rotori senza ombra (perf)
    const d = s * 0.707; // rotori sulle diagonali, a distanza ~s dal centro
    const rot = s * 0.42; // raggio rotore
    g.lineCap = "round";
    g.lineJoin = "round";
    g.strokeStyle = `rgba(${c},${alpha})`;
    g.lineWidth = Math.max(0.8, s * 0.16);
    // bracci a X
    g.beginPath();
    g.moveTo(-d, -d);
    g.lineTo(d, d);
    g.moveTo(-d, d);
    g.lineTo(d, -d);
    g.stroke();
    // muso = indicatore di direzione (tenue)
    g.globalAlpha = 0.6;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(s * 1.05, 0);
    g.stroke();
    g.globalAlpha = 1;
    // 4 rotori (anelli) ai capi dei bracci
    for (let i = 0; i < 4; i++) {
      const rx = i < 2 ? -d : d;
      const ry = i % 2 === 0 ? -d : d;
      g.beginPath();
      g.arc(rx, ry, rot, 0, Math.PI * 2);
      g.stroke();
    }
    // corpo centrale (con eventuale bagliore)
    if (glow) {
      g.shadowColor = `rgba(${c},${Math.min(1, alpha + 0.3)})`;
      g.shadowBlur = glowBlur;
    }
    g.fillStyle = `rgba(${c},${Math.min(1, alpha + 0.15)})`;
    g.beginPath();
    g.arc(0, 0, s * 0.4, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  function frame(now: number): void {
    if (!running) return; // evita loop rAF "orfani" (es. dopo scroll fuori/dentro)
    // Delta-time: la simulazione avanza in base al TEMPO trascorso, non al
    // numero di frame → velocità identica a 60/120/144 Hz. `k` = 1 a 60fps
    // (così la calibrazione dei parametri resta invariata).
    if (!lastTime) lastTime = now;
    let dt = (now - lastTime) / 1000; // secondi
    lastTime = now;
    if (dt > 0.05) dt = 0.05; // clamp: niente salti dopo pause/scroll/tab nascosta
    const k = dt * 60;

    t += C.timeStep * k;
    ctx!.clearRect(0, 0, w, h);
    ctx!.shadowBlur = 0;
    const light = isLight();
    const themeColor = light ? C.colorLight : C.colorDark;
    const palette = light ? C.paletteLight : C.paletteDark;
    ctx!.lineCap = "round";
    ctx!.lineJoin = "round";

    for (const p of parts) {
      p.z -= p.vz * k;
      if (p.z <= C.near) reset(p, false);
      const pr = project(p, t);
      if (p.fresh) {
        p.hist.length = 0;
        p.fresh = false;
      }
      p.hist.push({ x: pr.X, y: pr.Y });
      if (p.hist.length > C.trailLength) p.hist.shift();

      const headW = C.widthBase + pr.near * C.widthGain;
      const headA = C.opacityBase + pr.near * C.opacityGain;
      const c = C.multiColor
        ? palette[p.colorIdx % palette.length]
        : themeColor;
      const pts = p.hist;
      const n = pts.length;

      // scia rastremata: coda (a punta, trasparente) → testa (larga, opaca).
      if (n >= 2) {
        if (C.smoothTrail) {
          // forma piena unica: liscia, senza pallini
          ribbon(pts, n, headW, headA, c);
        } else {
          // legacy a segmenti (con cap tondo -> mostra i pallini)
          for (let i = 1; i < n; i++) {
            const f1 = i / (n - 1);
            ctx!.strokeStyle = `rgba(${c},${headA * f1})`;
            ctx!.lineWidth = C.tailWidth + (headW - C.tailWidth) * f1;
            ctx!.beginPath();
            ctx!.moveTo(pts[i - 1].x, pts[i - 1].y);
            ctx!.lineTo(pts[i].x, pts[i].y);
            ctx!.stroke();
          }
        }
      }

      // testa: piccolo drone orientato lungo la traiettoria (o pallino classico)
      const head = pts[n - 1];
      const glowBlur = C.headGlowBlur * (0.4 + pr.near);
      const headA2 = Math.min(1, headA + 0.2);
      if (C.droneHeads) {
        let ang = 0;
        if (n >= 2) {
          const prev = pts[n - 2];
          ang = Math.atan2(head.y - prev.y, head.x - prev.x);
        }
        // rollio: differenza di heading (wrappata in [-π,π]) → bank target, smussato
        let dA = ang - p.prevAng;
        dA = Math.atan2(Math.sin(dA), Math.cos(dA));
        p.prevAng = ang;
        if (C.droneBank) {
          const target = Math.max(
            -C.maxBank,
            Math.min(C.maxBank, dA * C.bankGain),
          );
          p.bank += (target - p.bank) * 0.15;
        }
        const s = (headW * 0.5 + C.headSize) * C.droneSize;
        drawDrone(
          head.x,
          head.y,
          s,
          ang,
          c,
          headA2,
          C.headGlow,
          glowBlur,
          p.bank,
        );
      } else {
        if (C.headGlow) {
          ctx!.shadowColor = `rgba(${c},${Math.min(1, headA + 0.3)})`;
          ctx!.shadowBlur = glowBlur;
        }
        ctx!.fillStyle = `rgba(${c},${headA2})`;
        ctx!.beginPath();
        ctx!.arc(head.x, head.y, headW * 0.5 + C.headSize, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.shadowBlur = 0; // reset: la scia del prossimo drone non dev'essere sfocata
    }
    raf = requestAnimationFrame(frame);
  }

  function paintStatic(): void {
    ctx!.clearRect(0, 0, w, h);
    ctx!.shadowBlur = 0;
    const light = isLight();
    const themeColor = light ? C.colorLight : C.colorDark;
    const palette = light ? C.paletteLight : C.paletteDark;
    for (const p of parts) {
      const pr = project(p, 0);
      const headW = C.widthBase + pr.near * C.widthGain;
      const a = C.opacityBase + pr.near * C.opacityGain;
      const c = C.multiColor
        ? palette[p.colorIdx % palette.length]
        : themeColor;
      const glowBlur = C.headGlowBlur * (0.4 + pr.near);
      if (C.droneHeads) {
        const s = (headW * 0.5 + C.headSize) * C.droneSize;
        drawDrone(pr.X, pr.Y, s, 0, c, a, C.headGlow, glowBlur, 0);
      } else {
        if (C.headGlow) {
          ctx!.shadowColor = `rgba(${c},${Math.min(1, a + 0.3)})`;
          ctx!.shadowBlur = glowBlur;
        }
        ctx!.fillStyle = `rgba(${c},${a})`;
        ctx!.beginPath();
        ctx!.arc(pr.X, pr.Y, headW * 0.5 + C.headSize, 0, Math.PI * 2);
        ctx!.fill();
      }
    }
    ctx!.shadowBlur = 0;
  }

  function start(): void {
    if (running) return;
    running = true;
    if (reduce) {
      paintStatic();
      return;
    }
    lastTime = 0; // primo frame dopo il (ri)avvio: dt=0 → nessun salto al rientro
    cancelAnimationFrame(raf); // garantisce un solo loop attivo
    raf = requestAnimationFrame(frame);
  }
  function stop(): void {
    running = false;
    cancelAnimationFrame(raf);
  }

  size();

  new ResizeObserver(() => {
    size();
    if (reduce && running) paintStatic();
  }).observe(root);

  new IntersectionObserver((entries) => {
    for (const e of entries) (e.isIntersecting ? start : stop)();
  }).observe(root);

  new MutationObserver(() => {
    if (reduce && running) paintStatic();
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
}
