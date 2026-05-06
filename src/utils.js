import { CASTELLS, OPA } from './constants';

// ── Castle helpers ──────────────────────────────────────────────
export function isPilarCastle(nom) {
  return nom.startsWith('pd');
}

const CASTELL_ORDER = CASTELLS.map(c => c.n);
export function castellIndex(nom) { return CASTELL_ORDER.indexOf(nom); }
export function isCastellSuperiorOIgual(fet, apostat) {
  return castellIndex(fet) >= castellIndex(apostat);
}

export function getCollaOptions(collaNom) {
  const opa = OPA[collaNom] || {};
  const castellos = [], pilars = [];
  CASTELLS.forEach(cas => {
    if (opa[cas.n] > 0) {
      if (isPilarCastle(cas.n)) pilars.push(cas.n);
      else castellos.push(cas.n);
    }
  });
  return { castellos, pilars };
}

// ── Odds helpers ─────────────────────────────────────────────────
export function lvlKeyToNum(k) {
  const n = Number(k);
  return [1, 2, 3].includes(n) ? n : 2;
}

export function lvlNumToColor(n) {
  if (n === 1) return '#f85149';
  if (n === 2) return '#f0b400';
  return '#00d04b';
}

export function lvlNumToLabel(n) {
  if (n === 1) return 'Baixa';
  if (n === 2) return 'Normal';
  return 'Alta';
}

export function calcOdd(castellNom, collaNom, lvlKey, houseMarg, ordenat = true) {
  const p = OPA[collaNom]?.[castellNom];
  if (!p || p <= 0) return null;
  const nivell = lvlKeyToNum(lvlKey);
  let quota = Math.pow(1 / p, 1 / nivell);
  quota = quota * (1 - houseMarg / 100);
  quota = Math.max(1.01, Math.round(quota * 100) / 100);
  if (ordenat) return quota;
  const red = Math.sqrt(quota) + (quota - 1) / 2;
  return Math.max(1.01, Math.round(red * 100) / 100);
}

export function calcSpecialOddYesNo(baseOdd, houseMarg) {
  const q = baseOdd * (1 - houseMarg / 100);
  return Math.max(1.01, Math.round(q * 100) / 100);
}

/**
 * Genera opcions per a apostes de rang numèric.
 *
 * @param {number}  n            Nombre total d'opcions
 * @param {number}  best         Índex base-0 del valor més probable
 * @param {number}  baseOdd      Quota central (sense marge)
 * @param {number}  discrepancy  Factor de pujada per posició allunyada del centre
 * @param {number}  houseMarg    % marge de la casa
 * @param {number}  start        Número inicial del rang (default 1)
 * @param {boolean} exact        Si true, l'última etiqueta és exacta; si false, "N+" (default false)
 * @param {number}  step         Salt entre opcions (default 1). Ex: 100 → 100, 200, 300…
 * @param {boolean} orSup        Si true, totes les opcions s'etiqueten com "N+" i les quotes
 *                               s'apliquen amb curvatura exponencial ascendent (default false)
 * @param {number}  expSlope     Pendent de la corba exponencial quan orSup=true (default 1.0)
 *                               1.0 = lineal, >1 = creix més ràpid, <1 = creix més suau
 */
export function generateRangeOptions(
  n, best, baseOdd, discrepancy, houseMarg,
  start = 1, exact = false, step = 1, orSup = false, expSlope = 1.0,
) {
  const marg = 1 - houseMarg / 100;
  const opts = [];

  for (let i = 0; i < n; i++) {
    const val = start + i * step;
    const isLast = i === n - 1;

    let finalOdd;
    let label;

    if (orSup) {
      // Mode "o superior": quotes creixen exponencialment per valors alts
      // (apostar "100 o més" és molt probable → quota baixa;
      //  apostar "500 o més" és poc probable → quota alta)
      const dist = i - best;
      const raw = dist >= 0
        ? baseOdd * Math.pow(discrepancy, Math.pow(Math.abs(dist), expSlope))
        : baseOdd / Math.pow(discrepancy, Math.pow(Math.abs(dist), expSlope));
      finalOdd = Math.max(1.01, Math.round(raw * marg * 100) / 100);
      // Totes les opcions s'etiqueten "N+" excepte l'última si exact=true
      label = isLast && exact ? `${val}` : `${val}+`;
    } else {
      // Mode normal: opcions exactes, disc. simètrica respecte al `best`
      const dist = Math.abs(i - best);
      const raw = baseOdd * Math.pow(discrepancy, dist);
      finalOdd = Math.max(1.01, Math.round(raw * marg * 100) / 100);
      label = isLast && !exact ? `${val}+` : `${val}`;
    }

    opts.push({ label, odd: finalOdd });
  }

  return opts;
}

// Alias per a l'admin (mateixa signatura, delega a generateRangeOptions)
export function buildRangeOptions(
  n         = 5,
  best      = 2,
  baseOdd   = 1.6,
  disc      = 1.6,
  houseMarg = 8,
  start     = 1,
  exact     = false,
  step      = 1,
  orSup     = false,
  expSlope  = 1.0,
) {
  return generateRangeOptions(n, best, baseOdd, disc, houseMarg, start, exact, step, orSup, expSlope);
}

// ── Betslip resolution ───────────────────────────────────────────
export function checkApostaLines(lines, resultats, ordenat) {
  const pilarLines = lines.filter(l => l.isPilar);
  const castellLines = lines.filter(l => !l.isPilar);
  const results = [];

  for (const line of pilarLines) {
    const res = resultats[line.nom];
    const fet = res?.pilar;
    const ok = !!fet && isCastellSuperiorOIgual(fet, line.castle);
    results.push({ ...line, ok, fetCastle: fet || null });
  }

  if (ordenat) {
    for (const line of castellLines) {
      const res = resultats[line.nom];
      const fet = res?.[line.slotKey];
      const ok = !!fet && isCastellSuperiorOIgual(fet, line.castle);
      results.push({ ...line, ok, fetCastle: fet || null });
    }
  } else {
    const perColla = {};
    for (const line of castellLines) {
      if (!perColla[line.nom]) perColla[line.nom] = [];
      perColla[line.nom].push(line);
    }
    for (const [collaNom, collaLines] of Object.entries(perColla)) {
      const res = resultats[collaNom];
      const slotsDisp = ['c0', 'c1', 'c2']
        .map(s => ({ s, fet: res?.[s] }))
        .filter(x => x.fet);
      const linesIdx = collaLines.map((l, i) => ({ ...l, _oi: i }));
      const linesSorted = [...linesIdx].sort((a, b) => castellIndex(b.castle) - castellIndex(a.castle));
      const slotsSorted = [...slotsDisp].sort((a, b) => castellIndex(b.fet) - castellIndex(a.fet));
      const usats = new Set();
      const assOrig = new Map();
      for (const line of linesSorted) {
        for (const { s, fet } of slotsSorted) {
          if (!usats.has(s) && isCastellSuperiorOIgual(fet, line.castle)) {
            usats.add(s);
            assOrig.set(line._oi, fet);
            break;
          }
        }
      }
      for (let i = 0; i < collaLines.length; i++) {
        const fetCastle = assOrig.get(i) || null;
        results.push({ ...collaLines[i], ok: !!fetCastle, fetCastle });
      }
    }
  }

  return lines.map(
    l => results.find(r => r.slotKey === l.slotKey && r.nom === l.nom && r.castle === l.castle)
      || { ...l, ok: false, fetCastle: null }
  );
}