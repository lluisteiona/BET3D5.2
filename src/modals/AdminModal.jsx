import { useState } from 'react';
import { collection, addDoc, doc, deleteDoc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLES } from '../constants';
import { calcOdd, lvlKeyToNum, lvlNumToColor, lvlNumToLabel, getCollaOptions } from '../utils';
import { ResultatsTab } from '../admin/ResultatsTab';
import { EspecialsAdminTab } from '../admin/EspecialsAdminTab';

const ADMIN_PASSWORD = 'castells2025';

export function AdminModal({ open, onClose, diades, houseMarg, setHouseMarg, onToast, apostes, usuaris }) {
  const [authed, setAuthed] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [passErr, setPassErr] = useState('');
  const [tab, setTab] = useState('nova');
  const [dName, setDName] = useState('');
  const [dDate, setDDate] = useState('');
  const [checked, setChecked] = useState([]);
  const [cfg, setCfg] = useState({});
  const [previewColla, setPreviewColla] = useState(COLLES[0]);
  const [previewCastel, setPreviewCastel] = useState('5d6');

  const handlePass = () => {
    if (passInput === ADMIN_PASSWORD) { setAuthed(true); setPassErr(''); }
    else { setPassErr('Contrasenya incorrecta'); }
  };

  const toggle = nom => {
    setChecked(p => p.includes(nom) ? p.filter(c => c !== nom) : [...p, nom]);
    setCfg(c => c[nom] ? c : { ...c, [nom]: { nivell: 2 } });
  };
  const setF = (nom, f, v) => setCfg(c => ({ ...c, [nom]: { ...(c[nom] || {}), [f]: v } }));

  const crear = async () => {
    if (!dName.trim() || !dDate) { alert('Falten dades'); return; }
    if (!checked.length) { alert('Selecciona almenys una colla'); return; }
    try {
      await addDoc(collection(db, 'diades'), {
        name: dName.trim(),
        date: dDate,
        colles: checked.map(n => ({ nom: n, nivell: cfg[n]?.nivell ?? 2 })),
        specialBets: [],
        timestamp: serverTimestamp(),
      });
      onToast('✅ Diada creada!');
      setDName(''); setDDate(''); setChecked([]); setCfg({});
      onClose();
    } catch (e) { onToast('❌ ' + e.message); }
  };

  const del = async (id, name) => {
    if (!confirm(`Eliminar "${name}"?`)) return;
    try { await deleteDoc(doc(db, 'diades', id)); onToast('🗑️ Eliminada'); }
    catch (e) { onToast('❌ ' + e.message); }
  };

  const toggleTancada = async (d) => {
    const nouEstat = !d.tancada;
    try {
      await updateDoc(doc(db, 'diades', d.id), { tancada: nouEstat });
      onToast(nouEstat ? '🔒 Diada tancada (apostes desactivades)' : '🔓 Diada oberta (apostes activades)');
    } catch (e) { onToast('❌ ' + e.message); }
  };

  const grantPoints = async (d) => {
    if (!confirm(`Atorgar 100 punts extra a tots els usuaris per la diada "${d.name}"?`)) return;
    try {
      const { getDocs, collection: col } = await import('firebase/firestore');
      const snap = await getDocs(col(db, 'usuaris'));
      const batch = writeBatch(db);
      snap.docs.forEach(uDoc => {
        batch.update(uDoc.ref, { points: (uDoc.data().points || 0) + 100 });
      });
      await batch.commit();
      onToast(`🎁 100 punts atorgats a ${snap.docs.length} usuaris!`);
    } catch (e) { onToast('❌ ' + e.message); }
  };

  const previewLvlN = cfg['_preview']?.nivell ?? 2;
  const previewOdd = calcOdd(previewCastel, previewColla, previewLvlN, houseMarg);
  const { castellos: prevCastellos } = getCollaOptions(previewColla);

  if (!open) return null;

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ display: 'flex', position: 'fixed', inset: 0, background: '#000c', zIndex: 1000, alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '20px 0' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 26, width: '90%', maxWidth: 720, margin: 'auto' }}>
        <div style={{ fontFamily: "'Bebas Neue'", fontSize: '1.7rem', letterSpacing: 1, color: 'var(--green)', marginBottom: 18, borderBottom: '1px solid var(--border)', paddingBottom: 11, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          ⚙ Administració
          <button onClick={onClose} style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem' }}>✕</button>
        </div>

        {!authed ? (
          <div style={{ padding: '30px 0', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔒</div>
            <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '1.1rem', marginBottom: 16 }}>Accés restringit</div>
            <input type="password" value={passInput} onChange={e => setPassInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePass()} placeholder="Contrasenya admin" style={{ width: '100%', maxWidth: 300, marginBottom: 10, textAlign: 'center' }} />
            {passErr && <div style={{ color: 'var(--red)', fontSize: '.82rem', marginBottom: 10 }}>{passErr}</div>}
            <button onClick={handlePass} style={{ padding: '10px 28px', cursor: 'pointer', border: 'none', borderRadius: 4, fontFamily: "'Barlow Condensed'", fontWeight: 700, background: 'var(--green)', color: '#000' }}>ENTRAR</button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 18, flexWrap: 'wrap', gap: 0 }}>
              {[['nova', 'Nova Diada'], ['gestio', 'Gestió'], ['especials', '✨ Especials'], ['resultats', 'Resultats'], ['params', 'Paràmetres']].map(([id, lbl]) => (
                <button key={id} onClick={() => setTab(id)} style={{ cursor: 'pointer', background: 'none', border: 'none', color: tab === id ? 'var(--green)' : 'var(--text-dim)', fontFamily: "'Barlow Condensed'", fontWeight: 600, fontSize: '.88rem', padding: '8px 14px', borderBottom: `2px solid ${tab === id ? 'var(--green)' : 'transparent'}` }}>
                  {lbl}
                </button>
              ))}
            </div>

            {/* Tab: Nova Diada */}
            {tab === 'nova' && (
              <div>
                <label style={{ fontFamily: "'Barlow Condensed'", fontWeight: 600, fontSize: '.78rem', textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: 5 }}>Nom</label>
                <input value={dName} onChange={e => setDName(e.target.value)} placeholder="Ex: Diada de Sant Jordi 2025" style={{ width: '100%', marginBottom: 10 }} />
                <label style={{ fontFamily: "'Barlow Condensed'", fontWeight: 600, fontSize: '.78rem', textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: 5 }}>Data</label>
                <input type="date" value={dDate} onChange={e => setDDate(e.target.value)} style={{ width: '100%', marginBottom: 10 }} />
                <label style={{ fontFamily: "'Barlow Condensed'", fontWeight: 600, fontSize: '.78rem', textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: 5 }}>Colles</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
                  {COLLES.map(c => (
                    <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg3)', border: `1px solid ${checked.includes(c) ? 'var(--green)' : 'var(--border)'}`, borderRadius: 4, padding: '7px 11px', cursor: 'pointer', fontSize: '.88rem' }}>
                      <input type="checkbox" checked={checked.includes(c)} onChange={() => toggle(c)} style={{ accentColor: 'var(--green)', width: 15, height: 15 }} />{c}
                    </label>
                  ))}
                </div>
                {checked.length > 0 && (
                  <div>
                    {/* Preview quota */}
                    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '12px 14px', marginBottom: 14 }}>
                      <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.88rem', marginBottom: 10, color: 'var(--accent)' }}>🎯 Previsualització de quota</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                        <div>
                          <label style={{ fontSize: '.68rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4, fontFamily: "'Barlow Condensed'" }}>COLLA</label>
                          <select value={previewColla} onChange={e => setPreviewColla(e.target.value)}>
                            {checked.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '.68rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4, fontFamily: "'Barlow Condensed'" }}>CASTELL</label>
                          <select value={previewCastel} onChange={e => setPreviewCastel(e.target.value)}>
                            {prevCastellos.map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: '.72rem', color: 'var(--text-dim)', fontFamily: "'Barlow Condensed'", textTransform: 'uppercase' }}>Nivell preview</span>
                        <span style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, color: lvlNumToColor(previewLvlN), fontSize: '.88rem' }}>{lvlNumToLabel(previewLvlN)}</span>
                      </div>
                      <input type="range" min={1} max={3} step={1} value={previewLvlN} onChange={e => setF('_preview', 'nivell', parseInt(e.target.value))} style={{ width: '100%', marginBottom: 8 }} />
                      <div style={{ textAlign: 'center', background: 'var(--bg)', borderRadius: 6, padding: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '.72rem', color: 'var(--text-dim)', marginBottom: 4 }}>{previewColla} · {previewCastel} o sup.</div>
                        <div style={{ fontFamily: "'Bebas Neue'", fontSize: '2.2rem', color: 'var(--gold)', lineHeight: 1 }}>×{previewOdd?.toFixed(2) || '—'}</div>
                      </div>
                    </div>
                    {/* Nivell per colla */}
                    {checked.map(c => (
                      <div key={c} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', marginBottom: 6 }}>
                        <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>🏴 {c}</span>
                          <span style={{ color: lvlNumToColor(cfg[c]?.nivell ?? 2), fontSize: '.82rem' }}>{lvlNumToLabel(cfg[c]?.nivell ?? 2)}</span>
                        </div>
                        <input type="range" min={1} max={3} step={1} value={cfg[c]?.nivell ?? 2} onChange={e => setF(c, 'nivell', parseInt(e.target.value))} style={{ width: '100%', accentColor: lvlNumToColor(cfg[c]?.nivell ?? 2) }} />
                        <div style={{ marginTop: 8, fontSize: '.72rem', color: 'var(--text-dim)', background: 'var(--bg)', borderRadius: 3, padding: '5px 8px' }}>
                          Exemple 5d6: ×{calcOdd('5d6', c, cfg[c]?.nivell ?? 2, houseMarg)?.toFixed(2) || '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={crear} style={{ marginTop: 18, padding: '10px 28px', cursor: 'pointer', border: 'none', borderRadius: 4, fontFamily: "'Barlow Condensed'", fontWeight: 700, background: 'var(--green)', color: '#000' }}>CREAR DIADA</button>
              </div>
            )}

            {/* Tab: Gestió */}
            {tab === 'gestio' && (
              <div>
                {!diades.length
                  ? <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Cap diada</div>
                  : diades.map(d => (
                    <div key={d.id} style={{ background: 'var(--bg3)', border: `1px solid ${d.tancada ? 'rgba(248,81,73,.3)' : 'var(--border)'}`, borderRadius: 6, padding: '11px 13px', marginBottom: 7 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {d.name}
                            {d.resultatsFinalitzats && <span style={{ background: 'rgba(0,208,75,.15)', border: '1px solid rgba(0,208,75,.4)', borderRadius: 3, padding: '1px 6px', fontSize: '.65rem', color: 'var(--green)' }}>✓ RESULTATS</span>}
                            {d.tancada && <span style={{ background: 'rgba(248,81,73,.15)', border: '1px solid rgba(248,81,73,.4)', borderRadius: 3, padding: '1px 6px', fontSize: '.65rem', color: 'var(--red)' }}>🔒 TANCADA</span>}
                          </div>
                          <div style={{ fontSize: '.76rem', color: 'var(--text-dim)', marginTop: 2 }}>{d.date || '—'} · {(d.colles || []).length} colles · {(d.specialBets || []).length} especials</div>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
                            {(d.colles || []).map(c => (
                              <span key={c.nom} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 3, padding: '2px 7px', fontSize: '.72rem', fontFamily: "'Barlow Condensed'", fontWeight: 600, color: 'var(--green)' }}>{c.nom}</span>
                            ))}
                          </div>
                        </div>
                        <button onClick={() => del(d.id, d.name)} style={{ cursor: 'pointer', border: 'none', borderRadius: 4, fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.8rem', padding: '5px 9px', background: 'var(--red)', color: '#fff', flexShrink: 0 }}>🗑</button>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                        <button onClick={() => toggleTancada(d)} style={{ cursor: 'pointer', border: `1px solid ${d.tancada ? 'rgba(0,208,75,.4)' : 'rgba(248,81,73,.4)'}`, borderRadius: 4, fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.8rem', padding: '6px 14px', background: d.tancada ? 'rgba(0,208,75,.1)' : 'rgba(248,81,73,.1)', color: d.tancada ? 'var(--green)' : 'var(--red)' }}>
                          {d.tancada ? '🔓 Obrir apostes' : '🔒 Tancar apostes'}
                        </button>
                        <button onClick={() => grantPoints(d)} style={{ cursor: 'pointer', border: '1px solid rgba(240,180,0,.4)', borderRadius: 4, fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.8rem', padding: '6px 14px', background: 'rgba(240,180,0,.1)', color: 'var(--gold)' }}>
                          🎁 +100 punts a tothom
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {tab === 'especials' && <EspecialsAdminTab diades={diades} onToast={onToast} />}
            {tab === 'resultats' && <ResultatsTab diades={diades} apostes={apostes} onToast={onToast} />}

            {/* Tab: Paràmetres */}
            {tab === 'params' && (
              <div>
                <div style={{ background: 'var(--bg3)', borderLeft: '3px solid var(--gold)', borderRadius: 4, padding: '9px 13px', fontSize: '.82rem', color: 'var(--text-dim)', marginBottom: 14 }}>
                  Quotes basades en probabilitats reals. El nivell ajusta la prob. base.
                </div>
                <label style={{ fontFamily: "'Barlow Condensed'", fontWeight: 600, fontSize: '.78rem', textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: 5 }}>Marge de la casa (%)</label>
                <input type="number" value={houseMarg} step={1} min={0} max={25} onChange={e => setHouseMarg(parseFloat(e.target.value) || 8)} style={{ width: '100%' }} />
                <button onClick={() => onToast('✅ Paràmetres desats!')} style={{ marginTop: 14, padding: '10px 28px', cursor: 'pointer', border: 'none', borderRadius: 4, fontFamily: "'Barlow Condensed'", fontWeight: 700, background: 'var(--green)', color: '#000' }}>DESAR</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}