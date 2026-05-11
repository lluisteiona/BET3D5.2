import { useState } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { checkApostaLines, getCollaOptions } from '../utils';
import { SLOT_NAMES } from '../constants';

export function ResultatsTab({ diades, apostes, onToast }) {
  const [selDiada, setSelDiada] = useState('');
  const [resultats, setResultats] = useState({});
  const [resultatsEspecials, setResultatsEspecials] = useState({});
  const [saving, setSaving] = useState(false);

  const diadaSel = diades.find(d => d.id === selDiada);

  const initResultats = (diada) => {
    const r = {};
    (diada?.colles || []).forEach(c => { r[c.nom] = { c0: '', c1: '', c2: '', pilar: '' }; });
    if (diada?.resultats) {
      Object.keys(diada.resultats).forEach(nom => { r[nom] = { ...(r[nom] || {}), ...diada.resultats[nom] }; });
    }
    setResultats(r);
    const re = {};
    (diada?.specialBets || []).forEach(b => {
      if (b.perColla) {
        (diada?.colles || []).forEach(c => {
          const key = `${b.id}__${c.nom}`;
          re[key] = diada?.resultatsEspecials?.[key] ?? '';
        });
      } else {
        re[b.id] = diada?.resultatsEspecials?.[b.id] ?? '';
      }
    });
    setResultatsEspecials(re);
  };

  const updateR = (collaNom, field, val) =>
    setResultats(prev => ({ ...prev, [collaNom]: { ...(prev[collaNom] || {}), [field]: val } }));

  const updateRE = (betId, val) =>
    setResultatsEspecials(prev => ({ ...prev, [betId]: val }));

  const desarDirecte = async () => {
    if (!selDiada || !diadaSel) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'diades', selDiada), { resultats, resultatsEspecials });
      onToast('💾 Resultats desats en directe');
    } catch (e) { onToast('❌ ' + e.message); }
    setSaving(false);
  };

  const publicarResultats = async () => {
    if (!selDiada || !diadaSel) return;
    if (!confirm('Finalitzar la diada i atorgar punts? Aquesta acció no es pot desfer.')) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'diades', selDiada), { resultats, resultatsEspecials, resultatsFinalitzats: true });
      const apostesDiada = apostes.filter(a => a.diadaId === selDiada && !a.resolt);
      for (const ap of apostesDiada) {
        let totsEncertats = true;
        if (ap.lines?.length) {
          const lineResults = checkApostaLines(ap.lines || [], resultats, ap.ordenat !== false);
          if (!lineResults.every(l => l.ok)) totsEncertats = false;
          ap._lineResults = lineResults;
        }
        if (ap.specialLines?.length) {
          const specResults = ap.specialLines.map(sl => {
            const res = resultatsEspecials[sl.betKey];
            if (res === undefined || res === '') return { ...sl, ok: false, fetVal: res };
            // Suport per a apostes "o superior" (etiqueta amb "+")
            let ok = false;
            if (sl.optionLabel?.endsWith('+')) {
              const threshold = parseFloat(sl.optionLabel);
              const actual = parseFloat(res);
              ok = !isNaN(threshold) && !isNaN(actual) && actual >= threshold;
            } else {
              ok = res === sl.optionLabel;
            }
            return { ...sl, ok, fetVal: res };
          });
          if (!specResults.every(r => r.ok)) totsEncertats = false;
          ap._specResults = specResults;
        }
        const ptsConganyats = totsEncertats ? ap.potentialWin : 0;
        await updateDoc(doc(db, 'apostes', ap.id), {
          resolt: true,
          encertat: totsEncertats,
          ptsAtorgats: ptsConganyats,
          lineResults: ap._lineResults || [],
          specResults: ap._specResults || [],
        });
        if (ap.userId) {
          const uRef = doc(db, 'usuaris', ap.userId);
          const uSnap = await getDoc(uRef);
          if (uSnap.exists()) {
            const pts = uSnap.data().points || 0;
            const delta = totsEncertats ? ptsConganyats : 0;
            await updateDoc(uRef, { points: Math.max(0, pts + delta) });
          }
        }
      }
      onToast('✅ Resultats publicats i punts atorgats!');
    } catch (e) { onToast('❌ ' + e.message); }
    setSaving(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontFamily: "'Barlow Condensed'", fontWeight: 600, fontSize: '.78rem', textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: 5 }}>Diada</label>
        <select value={selDiada} onChange={e => { setSelDiada(e.target.value); initResultats(diades.find(d => d.id === e.target.value)); }}>
          <option value="">— Selecciona diada —</option>
          {diades.map(d => <option key={d.id} value={d.id}>{d.name}{d.resultatsFinalitzats ? ' ✓' : ''}</option>)}
        </select>
      </div>

      {diadaSel && (
        <>
          <div style={{ background: 'var(--bg3)', borderLeft: '3px solid var(--gold)', borderRadius: 4, padding: '9px 13px', fontSize: '.82rem', color: 'var(--text-dim)', marginBottom: 14 }}>
            🏰 Actualitza els resultats en directe. Quan acabi, prem <b style={{ color: 'var(--green)' }}>FINALITZAR</b> per atorgar punts.
          </div>

          {/* Castells per colla */}
          <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.78rem', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8 }}>Castells per colla</div>
          {(diadaSel?.colles || []).map(c => {
            const { castellos, pilars } = getCollaOptions(c.nom);
            const r = resultats[c.nom] || {};
            return (
              <div key={c.nom} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '12px 14px', marginBottom: 10 }}>
                <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '1rem', marginBottom: 10 }}>🏴 {c.nom}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {['c0', 'c1', 'c2'].map(slot => (
                    <div key={slot}>
                      <label style={{ fontSize: '.65rem', color: 'var(--text-dim)', display: 'block', marginBottom: 3, fontFamily: "'Barlow Condensed'", textTransform: 'uppercase' }}>{SLOT_NAMES[slot]}</label>
                      <select value={r[slot] || ''} onChange={e => updateR(c.nom, slot, e.target.value)}>
                        <option value="">— No fet —</option>
                        {castellos.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: '.65rem', color: 'var(--gold)', display: 'block', marginBottom: 3, fontFamily: "'Barlow Condensed'", textTransform: 'uppercase' }}>Pilar</label>
                    <select value={r.pilar || ''} onChange={e => updateR(c.nom, 'pilar', e.target.value)}>
                      <option value="">— No fet —</option>
                      {pilars.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Especials */}
          {(diadaSel?.specialBets || []).length > 0 && (
            <>
              <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.78rem', textTransform: 'uppercase', color: 'var(--text-dim)', margin: '14px 0 8px' }}>Apostes Especials</div>
              {(diadaSel.specialBets || []).map(bet => {
                const isRange = bet.tipus === 'range';
                const isPerColla = bet.perColla;

                const renderInput = (betKey) => {
                  const currentVal = resultatsEspecials[betKey];
                  if (isRange) return (
                    <div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input type="number" placeholder="Valor real" value={currentVal || ''} onChange={e => updateRE(betKey, e.target.value)} style={{ width: 120 }} />
                        {currentVal !== '' && currentVal !== undefined && <button onClick={() => updateRE(betKey, '')} style={{ cursor: 'pointer', border: '1px solid var(--border)', borderRadius: 4, padding: '3px 8px', background: 'transparent', color: 'var(--text-muted)', fontFamily: "'Barlow Condensed'", fontSize: '.75rem' }}>✕</button>}
                      </div>
                      <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(bet.options || []).map((opt, oi) => {
                          const threshold = parseFloat(opt.label);
                          const actual = parseFloat(currentVal);
                          const guanya = currentVal !== '' && currentVal !== undefined && !isNaN(threshold) && !isNaN(actual) && (opt.label.endsWith('+') ? actual >= threshold : actual === threshold);
                          return <div key={oi} style={{ background: guanya ? 'rgba(0,208,75,.15)' : 'var(--bg4)', border: `1px solid ${guanya ? 'var(--green)' : 'var(--border)'}`, borderRadius: 4, padding: '2px 7px', fontFamily: "'Barlow Condensed'", fontSize: '.75rem', color: guanya ? 'var(--green)' : 'var(--text-muted)' }}>{guanya ? '✓ ' : ''}{opt.label}</div>;
                        })}
                      </div>
                    </div>
                  );
                  return (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={() => updateRE(betKey, '')} style={{ cursor: 'pointer', border: `1px solid ${currentVal === '' ? 'var(--text-muted)' : 'var(--border)'}`, borderRadius: 4, padding: '4px 10px', background: 'var(--bg4)', color: 'var(--text-muted)', fontFamily: "'Barlow Condensed'", fontWeight: 600, fontSize: '.8rem' }}>— Pendent</button>
                      {(bet.options || []).map((opt, oi) => (
                        <button key={oi} onClick={() => updateRE(betKey, opt.label)} style={{ cursor: 'pointer', border: `1px solid ${currentVal === opt.label ? 'var(--green)' : 'var(--border)'}`, borderRadius: 4, padding: '4px 10px', background: currentVal === opt.label ? 'rgba(0,208,75,.15)' : 'var(--bg4)', color: currentVal === opt.label ? 'var(--green)' : 'var(--text)', fontFamily: "'Barlow Condensed'", fontWeight: 600, fontSize: '.8rem' }}>{opt.label}</button>
                      ))}
                    </div>
                  );
                };

                return (
                  <div key={bet.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', marginBottom: 8 }}>
                    <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.9rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {bet.label} {bet.colla && <span style={{ color: 'var(--purple)', fontSize: '.8rem' }}>({bet.colla})</span>}
                      <span style={{ fontSize: '.65rem', background: isRange ? 'rgba(26,140,255,.15)' : 'rgba(0,208,75,.1)', color: isRange ? 'var(--accent)' : 'var(--green)', border: `1px solid ${isRange ? 'rgba(26,140,255,.3)' : 'rgba(0,208,75,.3)'}`, borderRadius: 3, padding: '1px 6px' }}>{isRange ? 'RANG' : 'SÍ/NO'}</span>
                      {isPerColla && <span style={{ fontSize: '.65rem', background: 'rgba(168,85,247,.15)', color: 'var(--purple)', border: '1px solid rgba(168,85,247,.3)', borderRadius: 3, padding: '1px 6px' }}>PER COLLA</span>}
                    </div>
                    {isRange && !isPerColla && <div style={{ fontSize: '.7rem', color: 'var(--text-dim)', marginBottom: 8, fontFamily: "'Barlow Condensed'" }}>Introdueix el valor real. El sistema calcularà quins apostadors guanyen.</div>}
                    {isPerColla ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(diadaSel?.colles || []).map(c => {
                          const betKey = `${bet.id}__${c.nom}`;
                          return (
                            <div key={c.nom} style={{ background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 4, padding: '8px 10px' }}>
                              <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.8rem', color: 'var(--text-dim)', marginBottom: 6 }}>🏴 {c.nom}</div>
                              {renderInput(betKey)}
                            </div>
                          );
                        })}
                      </div>
                    ) : renderInput(bet.id)}
                  </div>
                );
              })}
            </>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={desarDirecte} disabled={saving} style={{ flex: 1, padding: '10px', cursor: 'pointer', border: '1px solid var(--border)', borderRadius: 4, fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.9rem', background: 'var(--bg4)', color: 'var(--text)' }}>
              {saving ? '...' : '💾 DESAR EN DIRECTE'}
            </button>
            {!diadaSel?.resultatsFinalitzats ? (
              <button onClick={publicarResultats} disabled={saving} style={{ flex: 1, padding: '10px', cursor: 'pointer', border: 'none', borderRadius: 4, fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.9rem', background: 'var(--green)', color: '#000' }}>
                {saving ? '...' : '✅ FINALITZAR'}
              </button>
            ) : (
              <div style={{ flex: 1, padding: '10px', borderRadius: 4, fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.9rem', background: 'rgba(0,208,75,.1)', color: 'var(--green)', textAlign: 'center', border: '1px solid rgba(0,208,75,.3)' }}>
                ✓ DIADA FINALITZADA
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}