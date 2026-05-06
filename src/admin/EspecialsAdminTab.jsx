import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { SPECIAL_CATEGORIES } from '../constants';
import { buildRangeOptions } from '../utils';
import { QuotesEditor, CollaQuotaAccordio } from './QuotesEditor';

const HOUSE_MARG = 8;

export function EspecialsAdminTab({ diades, onToast }) {
  const [selDiada, setSelDiada] = useState('');
  const [bets, setBets] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editingBetId, setEditingBetId] = useState(null);

  // Formulari d'afegir
  const [addCat, setAddCat] = useState('puntuacio');
  const [addTemplate, setAddTemplate] = useState('');
  const [addLabel, setAddLabel] = useState('');
  const [addDesc, setAddDesc] = useState('');
  const [addTipus, setAddTipus] = useState('yesno');
  const [addAmbit, setAddAmbit] = useState('global'); // 'global' | 'per_colla' | 'colla_especifica'
  const [addColla, setAddColla] = useState('');
  // Config rang
  const [rN, setRN] = useState(5);
  const [rBest, setRBest] = useState(2);
  const [rBase, setRBase] = useState(1.6);
  const [rDisc, setRDisc] = useState(1.6);
  const [rStart, setRStart] = useState(1);
  const [rExact, setRExact] = useState(false);
  const [rStep, setRStep] = useState(1);
  // ── NOU: mode "o superior" i pendent exponencial ──
  const [rOrSup, setROrSup] = useState(false);   // totes les opcions amb "o sup."
  const [rExpSlope, setRExpSlope] = useState(1.0); // pendent exponencial (1 = lineal)
  // Config yesno
  const [ynSiOdd, setYnSiOdd] = useState(1.8);
  const [ynNoOdd, setYnNoOdd] = useState(1.8);

  const diadaSel = diades.find(d => d.id === selDiada);
  const catTemplates = SPECIAL_CATEGORIES.find(c => c.id === addCat)?.templates || [];

  const loadBets = (diada) => {
    setBets(diada?.specialBets || []);
    setEditingBetId(null);
  };

  const saveBets = async (newBets) => {
    if (!selDiada) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'diades', selDiada), { specialBets: newBets });
      setBets(newBets);
      onToast('✅ Apostes especials desades!');
    } catch (e) { onToast('❌ ' + e.message); }
    setSaving(false);
  };

  const buildOptions = () => {
    if (addTipus === 'yesno') {
      return [
        { label: 'Sí', odd: Math.max(1.01, Math.round(ynSiOdd * (1 - HOUSE_MARG / 100) * 100) / 100) },
        { label: 'No', odd: Math.max(1.01, Math.round(ynNoOdd * (1 - HOUSE_MARG / 100) * 100) / 100) },
      ];
    }
    return buildRangeOptions(rN, rBest, rBase, rDisc, HOUSE_MARG, rStart, rExact, rStep, rOrSup, rExpSlope);
  };

  const addBet = () => {
    if (!addLabel.trim()) { onToast('⚠️ Necessites un títol'); return; }
    const newBet = {
      id: Date.now().toString(),
      catId: addCat,
      templateId: addTemplate || null,
      label: addLabel.trim(),
      descripcio: addDesc.trim(),
      tipus: addTipus,
      perColla: addAmbit === 'per_colla',
      colla: addAmbit === 'colla_especifica' ? addColla : null,
      options: buildOptions(),
      _rangN: rN, _rangBest: rBest, _rangBase: rBase, _rangDisc: rDisc,
      _rangStart: rStart, _rangExact: rExact, _rangStep: rStep,
      _rangOrSup: rOrSup, _rangExpSlope: rExpSlope,
      _ynSi: ynSiOdd, _ynNo: ynNoOdd,
    };
    const newBets = [...bets, newBet];
    saveBets(newBets);
    setAddLabel(''); setAddDesc(''); setAddTemplate(''); setEditingBetId(newBet.id);
  };

  const deleteBet = (id) => {
    if (!confirm('Eliminar aquesta aposta especial?')) return;
    saveBets(bets.filter(b => b.id !== id));
  };

  const updateBet = (id, field, val) =>
    setBets(prev => prev.map(b => b.id === id ? { ...b, [field]: val } : b));

  const recalcRange = (id, collaKey) => {
    setBets(prev => prev.map(b => {
      if (b.id !== id) return b;
      if (collaKey) {
        const cfg = b._collasCfg?.[collaKey] || {};
        const opts = buildRangeOptions(
          cfg._rangN ?? b._rangN ?? 5,
          cfg._rangBest ?? b._rangBest ?? 2,
          cfg._rangBase ?? b._rangBase ?? 1.6,
          cfg._rangDisc ?? b._rangDisc ?? 1.6,
          HOUSE_MARG,
          cfg._rangStart ?? b._rangStart ?? 1,
          cfg._rangExact ?? b._rangExact ?? false,
          cfg._rangStep ?? b._rangStep ?? 1,
          cfg._rangOrSup ?? b._rangOrSup ?? false,
          cfg._rangExpSlope ?? b._rangExpSlope ?? 1.0,
        );
        return { ...b, collesOpts: { ...(b.collesOpts || {}), [collaKey]: opts } };
      }
      const opts = buildRangeOptions(
        b._rangN || 5, b._rangBest ?? 2, b._rangBase || 1.6, b._rangDisc || 1.6,
        HOUSE_MARG, b._rangStart ?? 1, b._rangExact ?? false, b._rangStep ?? 1,
        b._rangOrSup ?? false, b._rangExpSlope ?? 1.0,
      );
      return { ...b, options: opts };
    }));
  };

  const recalcYesNo = (id, collaKey) => {
    setBets(prev => prev.map(b => {
      if (b.id !== id) return b;
      if (collaKey) {
        const cfg = b._collasCfg?.[collaKey] || {};
        const si = cfg._ynSi ?? b._ynSi ?? 1.8;
        const no = cfg._ynNo ?? b._ynNo ?? 1.8;
        return {
          ...b, collesOpts: {
            ...(b.collesOpts || {}),
            [collaKey]: [
              { label: 'Sí', odd: Math.max(1.01, Math.round(si * (1 - HOUSE_MARG / 100) * 100) / 100) },
              { label: 'No', odd: Math.max(1.01, Math.round(no * (1 - HOUSE_MARG / 100) * 100) / 100) },
            ],
          },
        };
      }
      return {
        ...b, options: [
          { label: 'Sí', odd: Math.max(1.01, Math.round((b._ynSi || 1.8) * (1 - HOUSE_MARG / 100) * 100) / 100) },
          { label: 'No', odd: Math.max(1.01, Math.round((b._ynNo || 1.8) * (1 - HOUSE_MARG / 100) * 100) / 100) },
        ],
      };
    }));
  };

  const previewOpts = addTipus === 'range'
    ? buildRangeOptions(rN, rBest, rBase, rDisc, HOUSE_MARG, rStart, rExact, rStep, rOrSup, rExpSlope)
    : [];

  return (
    <div>
      {/* Selector de diada */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontFamily: "'Barlow Condensed'", fontWeight: 600, fontSize: '.78rem', textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: 5 }}>Diada</label>
        <select value={selDiada} onChange={e => { setSelDiada(e.target.value); loadBets(diades.find(d => d.id === e.target.value)); }}>
          <option value="">— Selecciona diada —</option>
          {diades.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {diadaSel && (
        <>
          {/* ── Formulari afegir ── */}
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px', marginBottom: 16 }}>
            <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.9rem', marginBottom: 12, color: 'var(--accent)' }}>+ Nova aposta especial</div>

            {/* Categoria + Plantilla */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div>
                <label style={{ fontSize: '.65rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4, fontFamily: "'Barlow Condensed'", textTransform: 'uppercase' }}>Categoria</label>
                <select value={addCat} onChange={e => { setAddCat(e.target.value); setAddTemplate(''); }}>
                  {SPECIAL_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '.65rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4, fontFamily: "'Barlow Condensed'", textTransform: 'uppercase' }}>Plantilla</label>
                <select value={addTemplate} onChange={e => {
                  const t = catTemplates.find(x => x.id === e.target.value);
                  setAddTemplate(e.target.value);
                  if (t) { setAddLabel(t.label); setAddTipus(t.tipus); if (t.desc) setAddDesc(t.desc); }
                }}>
                  <option value="">— Personalitzada —</option>
                  {catTemplates.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
            </div>

            {/* Títol + Desc */}
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: '.65rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4, fontFamily: "'Barlow Condensed'", textTransform: 'uppercase' }}>Títol</label>
              <input value={addLabel} onChange={e => setAddLabel(e.target.value)} placeholder="Ex: Quantitat de músics" style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: '.65rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4, fontFamily: "'Barlow Condensed'", textTransform: 'uppercase' }}>Descripció (opcional)</label>
              <input value={addDesc} onChange={e => setAddDesc(e.target.value)} placeholder="Descripció addicional" style={{ width: '100%' }} />
            </div>

            {/* Àmbit */}
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: '.65rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4, fontFamily: "'Barlow Condensed'", textTransform: 'uppercase' }}>Àmbit</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[['global', '🌐 Global'], ['per_colla', '🏴 Per colla (independent)'], ['colla_especifica', '📌 Colla específica']].map(([v, l]) => (
                  <button key={v} onClick={() => setAddAmbit(v)} style={{ cursor: 'pointer', border: `1px solid ${addAmbit === v ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 4, padding: '5px 12px', background: addAmbit === v ? 'rgba(26,140,255,.12)' : 'var(--bg4)', color: addAmbit === v ? 'var(--accent)' : 'var(--text-dim)', fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.78rem' }}>
                    {l}
                  </button>
                ))}
              </div>
              {addAmbit === 'global' && <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginTop: 4 }}>Una sola aposta per a tota la diada.</div>}
              {addAmbit === 'per_colla' && <div style={{ fontSize: '.7rem', color: 'var(--purple)', marginTop: 4 }}>Es crearà una aposta independent per cada colla. L'usuari tria a quina colla apostar.</div>}
              {addAmbit === 'colla_especifica' && (
                <select value={addColla} onChange={e => setAddColla(e.target.value)} style={{ marginTop: 6, width: '100%' }}>
                  <option value="">— Tria colla —</option>
                  {(diadaSel.colles || []).map(c => <option key={c.nom} value={c.nom}>{c.nom}</option>)}
                </select>
              )}
            </div>

            {/* Tipus */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: '.65rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4, fontFamily: "'Barlow Condensed'", textTransform: 'uppercase' }}>Tipus d'aposta</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[['yesno', 'Sí / No'], ['range', 'Rangs numèrics']].map(([t, l]) => (
                  <button key={t} onClick={() => setAddTipus(t)} style={{ cursor: 'pointer', border: `1px solid ${addTipus === t ? 'var(--green)' : 'var(--border)'}`, borderRadius: 4, padding: '6px 16px', background: addTipus === t ? 'rgba(0,208,75,.12)' : 'var(--bg4)', color: addTipus === t ? 'var(--green)' : 'var(--text-dim)', fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.82rem' }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Config SÍ/NO */}
            {addTipus === 'yesno' && (
              <div style={{ background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', marginBottom: 10 }}>
                <div style={{ fontSize: '.7rem', color: 'var(--text-dim)', fontFamily: "'Barlow Condensed'", textTransform: 'uppercase', marginBottom: 8 }}>Quotes base (sense marge casa)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: '.65rem', color: 'var(--green)', display: 'block', marginBottom: 4, fontFamily: "'Barlow Condensed'" }}>QUOTA "SÍ" BASE</label>
                    <input type="number" min={1.01} step={0.05} value={ynSiOdd} onChange={e => setYnSiOdd(parseFloat(e.target.value) || 1.8)} style={{ width: '100%' }} />
                    <div style={{ fontSize: '.7rem', color: 'var(--gold)', marginTop: 3, fontFamily: "'Bebas Neue'" }}>Amb marge: ×{Math.max(1.01, Math.round(ynSiOdd * (1 - HOUSE_MARG / 100) * 100) / 100).toFixed(2)}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '.65rem', color: 'var(--red)', display: 'block', marginBottom: 4, fontFamily: "'Barlow Condensed'" }}>QUOTA "NO" BASE</label>
                    <input type="number" min={1.01} step={0.05} value={ynNoOdd} onChange={e => setYnNoOdd(parseFloat(e.target.value) || 1.8)} style={{ width: '100%' }} />
                    <div style={{ fontSize: '.7rem', color: 'var(--gold)', marginTop: 3, fontFamily: "'Bebas Neue'" }}>Amb marge: ×{Math.max(1.01, Math.round(ynNoOdd * (1 - HOUSE_MARG / 100) * 100) / 100).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Config RANG */}
            {addTipus === 'range' && (
              <div style={{ background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', marginBottom: 10 }}>
                <div style={{ fontSize: '.7rem', color: 'var(--text-dim)', fontFamily: "'Barlow Condensed'", textTransform: 'uppercase', marginBottom: 10 }}>Configuració de rangs numèrics</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: '.65rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4, fontFamily: "'Barlow Condensed'" }}>NOMBRE D'OPCIONS (últim és N+)</label>
                    <input type="number" min={2} max={20} value={rN} onChange={e => setRN(Math.max(2, parseInt(e.target.value) || 5))} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '.65rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4, fontFamily: "'Barlow Condensed'" }}>VALOR MÉS PROBABLE (posició 1..{rN})</label>
                    <input type="number" min={1} max={rN} value={rBest + 1} onChange={e => setRBest(Math.max(0, Math.min(rN - 1, (parseInt(e.target.value) || 1) - 1)))} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '.65rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4, fontFamily: "'Barlow Condensed'" }}>QUOTA BASE (valor central, sense marge)</label>
                    <input type="number" min={1.05} step={0.05} value={rBase} onChange={e => setRBase(parseFloat(e.target.value) || 1.6)} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '.65rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4, fontFamily: "'Barlow Condensed'" }}>DISCREPÀNCIA (×{rDisc} per cada posició)</label>
                    <input type="number" min={1.0} max={5} step={0.05} value={rDisc} onChange={e => setRDisc(parseFloat(e.target.value) || 1.5)} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '.65rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4, fontFamily: "'Barlow Condensed'" }}>NÚMERO INICIAL DEL RANG</label>
                    <input type="number" min={0} value={rStart} onChange={e => setRStart(parseInt(e.target.value) ?? 1)} style={{ width: '100%' }} />
                  </div>
                  {/* ── NOU: Pas del rang ── */}
                  <div>
                    <label style={{ fontSize: '.65rem', color: 'var(--accent)', display: 'block', marginBottom: 4, fontFamily: "'Barlow Condensed'" }}>PAS (salt entre opcions)</label>
                    <input type="number" min={1} step={1} value={rStep} onChange={e => setRStep(Math.max(1, parseInt(e.target.value) || 1))} style={{ width: '100%' }} />
                    <div style={{ fontSize: '.62rem', color: 'var(--text-muted)', marginTop: 2, fontFamily: "'Barlow Condensed'" }}>
                      Ex: pas=100 → {rStart}, {rStart + 100}, {rStart + 200}…
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <label style={{ fontSize: '.65rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4, fontFamily: "'Barlow Condensed'" }}>ÚLTIMA OPCIÓ</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[false, true].map(val => (
                        <button key={String(val)} onClick={() => setRExact(val)} style={{ flex: 1, cursor: 'pointer', border: `1px solid ${rExact === val ? 'var(--green)' : 'var(--border)'}`, borderRadius: 4, padding: '6px 8px', background: rExact === val ? 'rgba(0,208,75,.12)' : 'var(--bg3)', color: rExact === val ? 'var(--green)' : 'var(--text-dim)', fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.72rem' }}>
                          {val ? `Exacte (${rStart + (rN - 1) * rStep})` : `${rStart + (rN - 1) * rStep}+ (o més)`}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* ── NOU: Mode "o superior" per a totes ── */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '.65rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4, fontFamily: "'Barlow Condensed'", textTransform: 'uppercase' }}>Mode "o superior"</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[false, true].map(val => (
                        <button key={String(val)} onClick={() => setROrSup(val)}
                          style={{ flex: 1, cursor: 'pointer', border: `1px solid ${rOrSup === val ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 4, padding: '6px 8px', background: rOrSup === val ? 'rgba(255,196,0,.1)' : 'var(--bg3)', color: rOrSup === val ? 'var(--gold)' : 'var(--text-dim)', fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.72rem' }}>
                          {val ? '✓ Totes "o superior" (acumulatiu)' : 'Normal (opcions exactes)'}
                        </button>
                      ))}
                    </div>
                    {rOrSup && (
                      <div style={{ marginTop: 6, fontSize: '.68rem', color: 'var(--gold)', background: 'rgba(255,196,0,.07)', borderRadius: 4, padding: '5px 8px', fontFamily: "'Barlow Condensed'" }}>
                        ⚡ Cada opció representa "{rStart}+", "{rStart + rStep}+", etc. Les quotes s'apliquen amb curvatura exponencial.
                      </div>
                    )}
                  </div>
                  {/* ── NOU: Pendent exponencial (només si or-sup actiu) ── */}
                  {rOrSup && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '.65rem', color: 'var(--gold)', display: 'block', marginBottom: 4, fontFamily: "'Barlow Condensed'", textTransform: 'uppercase' }}>
                        Pendent exponencial: {rExpSlope.toFixed(2)}
                      </label>
                      <input type="range" min={0.5} max={3.0} step={0.05} value={rExpSlope}
                        onChange={e => setRExpSlope(parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--gold)' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.6rem', color: 'var(--text-muted)', fontFamily: "'Barlow Condensed'" }}>
                        <span>0.5 (suau)</span><span>1.0 (lineal)</span><span>3.0 (molt pronunciat)</span>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '.65rem', color: 'var(--text-dim)', fontFamily: "'Barlow Condensed'", textTransform: 'uppercase', marginBottom: 6 }}>Previsualització de quotes (amb {HOUSE_MARG}% marge)</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {previewOpts.map((opt, i) => (
                    <div key={i} style={{ background: i === rBest ? 'rgba(0,208,75,.15)' : 'var(--bg3)', border: `1px solid ${i === rBest ? 'rgba(0,208,75,.5)' : 'var(--border)'}`, borderRadius: 5, padding: '4px 10px', textAlign: 'center', minWidth: 48 }}>
                      <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.78rem', color: i === rBest ? 'var(--green)' : 'var(--text)' }}>{opt.label}</div>
                      <div style={{ fontFamily: "'Bebas Neue'", fontSize: '1rem', color: 'var(--gold)', lineHeight: 1.1 }}>×{opt.odd.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={addBet} disabled={saving} style={{ cursor: 'pointer', border: 'none', borderRadius: 4, fontFamily: "'Barlow Condensed'", fontWeight: 700, padding: '9px 22px', background: 'var(--accent)', color: '#fff', fontSize: '.9rem' }}>
              + Afegir aposta
            </button>
          </div>

          {/* ── Llista de bets ── */}
          {bets.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: '.85rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎲</div>
              Cap aposta especial. Afegeix-ne una de dalt.
            </div>
          )}

          {bets.map(bet => {
            const cat = SPECIAL_CATEGORIES.find(c => c.id === bet.catId);
            const catColor = cat?.color || 'var(--accent)';
            const isEditing = editingBetId === bet.id;

            return (
              <div key={bet.id} style={{ background: 'var(--bg2)', border: `1px solid ${catColor}44`, borderRadius: 8, marginBottom: 10, overflow: 'hidden' }}>
                {/* Capçalera */}
                <div style={{ padding: '10px 14px', background: 'var(--bg4)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>{bet.label}</span>
                      {bet.perColla && <span style={{ fontSize: '.65rem', background: 'rgba(168,85,247,.2)', color: 'var(--purple)', borderRadius: 3, padding: '1px 6px', fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>PER COLLA</span>}
                      {bet.colla && <span style={{ fontSize: '.7rem', color: catColor, fontFamily: "'Barlow Condensed'" }}>{bet.colla}</span>}
                      <span style={{ fontSize: '.65rem', background: catColor + '22', color: catColor, borderRadius: 3, padding: '1px 6px', fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>{bet.tipus === 'yesno' ? 'SÍ/NO' : 'RANG'}</span>
                      {bet._rangOrSup && <span style={{ fontSize: '.65rem', background: 'rgba(255,196,0,.15)', color: 'var(--gold)', borderRadius: 3, padding: '1px 6px', fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>O SUP.</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setEditingBetId(isEditing ? null : bet.id)} style={{ cursor: 'pointer', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 10px', background: 'var(--bg3)', color: 'var(--text-dim)', fontFamily: "'Barlow Condensed'", fontWeight: 600, fontSize: '.8rem' }}>
                      {isEditing ? '✓ Tancar' : '✎ Editar'}
                    </button>
                    {isEditing && (
                      <button onClick={() => saveBets(bets)} disabled={saving} style={{ cursor: 'pointer', border: 'none', borderRadius: 4, padding: '4px 10px', background: 'var(--green)', color: '#000', fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.8rem' }}>
                        💾 Desar
                      </button>
                    )}
                    <button onClick={() => deleteBet(bet.id)} style={{ cursor: 'pointer', border: 'none', borderRadius: 4, padding: '4px 9px', background: 'var(--red)', color: '#fff', fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.8rem' }}>🗑</button>
                  </div>
                </div>

                {isEditing && (
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: '.65rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4, fontFamily: "'Barlow Condensed'", textTransform: 'uppercase' }}>Títol</label>
                      <input value={bet.label} onChange={e => updateBet(bet.id, 'label', e.target.value)} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '.65rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4, fontFamily: "'Barlow Condensed'", textTransform: 'uppercase' }}>Descripció</label>
                      <input value={bet.descripcio || ''} onChange={e => updateBet(bet.id, 'descripcio', e.target.value)} style={{ width: '100%' }} />
                    </div>

                    <QuotesEditor
                      bet={bet}
                      collaKey="__global__"
                      label="Quotes globals (base per totes les colles)"
                      tipus={bet.tipus}
                      HOUSE_MARG={HOUSE_MARG}
                      updateBet={updateBet}
                      recalcRange={recalcRange}
                      recalcYesNo={recalcYesNo}
                    />

                    {bet.perColla && (
                      <div>
                        <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.78rem', textTransform: 'uppercase', color: 'var(--purple)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          🏴 Quotes per colla
                          <span style={{ fontWeight: 400, color: 'var(--text-muted)', textTransform: 'none', fontSize: '.7rem' }}>(si no edites una colla, usa les globals)</span>
                        </div>
                        {(diadaSel?.colles || []).map(c => (
                          <CollaQuotaAccordio
                            key={c.nom}
                            collaNom={c.nom}
                            bet={bet}
                            hasOverride={!!(bet.collesOpts?.[c.nom])}
                            HOUSE_MARG={HOUSE_MARG}
                            updateBet={updateBet}
                            recalcRange={recalcRange}
                            recalcYesNo={recalcYesNo}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Resum opcions globals */}
                <div style={{ padding: '10px 14px' }}>
                  {bet.perColla && (
                    <div style={{ fontSize: '.65rem', color: 'var(--text-muted)', fontFamily: "'Barlow Condensed'", textTransform: 'uppercase', marginBottom: 6 }}>
                      Quotes globals (base) — {Object.keys(bet.collesOpts || {}).length > 0 ? `${Object.keys(bet.collesOpts).length} colles amb quotes personalitzades` : 'totes iguals'}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {(bet.options || []).map((opt, oi) => (
                      <div key={oi} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 5, padding: '5px 10px', textAlign: 'center', minWidth: 56 }}>
                        <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.78rem' }}>{opt.label}</div>
                        <div style={{ fontFamily: "'Bebas Neue'", fontSize: '1.05rem', color: 'var(--gold)', lineHeight: 1.1 }}>×{opt.odd?.toFixed(2) ?? '—'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}