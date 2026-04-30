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
    (diada?.specialBets || []).forEach(b => { re[b.id] = diada?.resultatsEspecials?.[b.id] ?? ''; });
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
            const ok = res !== undefined && res !== '' && res === sl.optionLabel;
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
          {(diadaSel.colles || []).map(c => {
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
          {(diadaSel.specialBets || []).length > 0 && (
            <>
              <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.78rem', textTransform: 'uppercase', color: 'var(--text-dim)', margin: '14px 0 8px' }}>Apostes Especials</div>
              {(diadaSel.specialBets || []).map(bet => (
                <div key={bet.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', marginBottom: 8 }}>
                  <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.9rem', marginBottom: 8 }}>
                    {bet.label} {bet.colla && <span style={{ color: 'var(--purple)', fontSize: '.8rem' }}>({bet.colla})</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button onClick={() => updateRE(bet.id, '')} style={{ cursor: 'pointer', border: `1px solid ${resultatsEspecials[bet.id] === '' ? 'var(--text-muted)' : 'var(--border)'}`, borderRadius: 4, padding: '4px 10px', background: 'var(--bg4)', color: 'var(--text-muted)', fontFamily: "'Barlow Condensed'", fontWeight: 600, fontSize: '.8rem' }}>
                      — Pendent
                    </button>
                    {(bet.options || []).map((opt, oi) => (
                      <button key={oi} onClick={() => updateRE(bet.id, opt.label)} style={{ cursor: 'pointer', border: `1px solid ${resultatsEspecials[bet.id] === opt.label ? 'var(--green)' : 'var(--border)'}`, borderRadius: 4, padding: '4px 10px', background: resultatsEspecials[bet.id] === opt.label ? 'rgba(0,208,75,.15)' : 'var(--bg4)', color: resultatsEspecials[bet.id] === opt.label ? 'var(--green)' : 'var(--text)', fontFamily: "'Barlow Condensed'", fontWeight: 600, fontSize: '.8rem' }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={desarDirecte} disabled={saving} style={{ flex: 1, padding: '10px', cursor: 'pointer', border: '1px solid var(--border)', borderRadius: 4, fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.9rem', background: 'var(--bg4)', color: 'var(--text)' }}>
              {saving ? '...' : '💾 DESAR EN DIRECTE'}
            </button>
            {!diadaSel.resultatsFinalitzats ? (
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
