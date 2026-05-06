import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, addDoc, doc, updateDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { CSS } from './styles';
import { isPilarCastle, calcOdd } from './utils';
import { Toast, Ticker } from './components/Toast';
import { Betslip } from './components/Betslip';
import { DiadaMarket } from './components/DiadaMarket';
import { ComuntitatSection, MeuesSection, Ranking } from './components/Community';
import { LoginModal } from './modals/LoginModal';
import { AdminModal } from './modals/AdminModal';

export default function App() {
  const [fb, setFb] = useState({ ok: false, msg: '● Connectant...' });
  const [diades, setDiades] = useState([]);
  const [apostes, setApostes] = useState([]);
  const [usuaris, setUsuaris] = useState([]);
  const [sec, setSec] = useState('apostes');
  const [selD, setSelD] = useState(null);
  const [bs, setBs] = useState([]);           // castle betslip lines
  const [bsSpecial, setBsSpecial] = useState([]); // special betslip lines
  const [sels, setSels] = useState({});
  const [stake, setStake] = useState(100);
  const [marg, setMarg] = useState(8);
  const [ordenat, setOrdenat] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [toast, setToast] = useState('');
  const tmr = useRef(null);
  const bref = useRef(null);

  const showToast = useCallback(m => {
    setToast(m);
    clearTimeout(tmr.current);
    tmr.current = setTimeout(() => setToast(''), 3200);
  }, []);

  // ── Firebase listeners ──────────────────────────────────────────
  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'diades'), s => {
      setDiades(s.docs.map(d => ({ id: d.id, ...d.data() })));
      setFb({ ok: true, msg: '● Firebase OK' });
    }, () => setFb({ ok: false, msg: '● Error Firebase' }));

    const u2 = onSnapshot(query(collection(db, 'apostes'), orderBy('timestamp', 'desc')), s =>
      setApostes(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const u3 = onSnapshot(collection(db, 'usuaris'), s =>
      setUsuaris(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => { u1(); u2(); u3(); };
  }, []);

  // Sync currentUser amb canvis de Firebase
  useEffect(() => {
    if (currentUser) {
      const updated = usuaris.find(u => u.id === currentUser.id);
      if (updated) setCurrentUser(updated);
    }
  }, [usuaris]);

  // ── Auth ────────────────────────────────────────────────────────
  const handleLogin = async (username, password) => {
    const { getDocs, where, query: q } = await import('firebase/firestore');
    const uSnap = await getDocs(q(collection(db, 'usuaris'), where('username', '==', username)));
    if (uSnap.empty) throw new Error("Usuari no trobat. Registra't primer.");
    const uDoc = uSnap.docs[0];
    const uData = uDoc.data();
    if (uData.password !== password) throw new Error('Contrasenya incorrecta.');
    setCurrentUser({ id: uDoc.id, ...uData });
    showToast(`✅ Benvingut, ${username}!`);
  };

  const handleRegister = async (username, password) => {
    const { getDocs, where, query: q } = await import('firebase/firestore');
    const existing = await getDocs(q(collection(db, 'usuaris'), where('username', '==', username)));
    if (!existing.empty) throw new Error("Aquest nom d'usuari ja existeix.");
    const newUser = { username, password, points: 100, totalApostes: 0, createdAt: serverTimestamp() };
    const ref = await addDoc(collection(db, 'usuaris'), newUser);
    setCurrentUser({ id: ref.id, ...newUser, points: 100 });
    showToast('🎉 Registrat! Tens 100 punts per apostar.');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setBs([]); setSels({}); setBsSpecial([]);
    showToast('👋 Sessió tancada.');
  };

  // ── Castle betslip toggle ───────────────────────────────────────
  const handleToggle = useCallback((nom, slotKey, castleOrNull) => {
    setSels(prev => ({
      ...prev,
      [nom]: { ...(prev[nom] || { c0: null, c1: null, c2: null, pilar: null }), [slotKey]: castleOrNull },
    }));
    setBs(prev => {
      const f = prev.filter(b => !(b.nom === nom && b.slotKey === slotKey));
      if (!castleOrNull) return f;
      const colla = diades.find(d => d.id === selD)?.colles?.find(c => c.nom === nom);
      const lvlKey = colla?.nivell ?? 2;
      const odd = calcOdd(castleOrNull, nom, lvlKey, marg) ?? 1.01;
      return [...f, { nom, slotKey, castle: castleOrNull, odd, isPilar: isPilarCastle(castleOrNull) }];
    });
  }, [diades, selD, marg]);

  // ── Special betslip toggle ──────────────────────────────────────
  const handleToggleSpecial = useCallback((bet, optionIdx, opt, odd, colla) => {
    const betKey = (bet.perColla && colla) ? `${bet.id}__${colla}` : bet.id;
    setBsSpecial(prev => {
      const existing = prev.findIndex(b => b.betKey === betKey);
      if (optionIdx === -1 || (existing >= 0 && prev[existing].optionIdx === optionIdx)) {
        return prev.filter(b => b.betKey !== betKey);
      }
      const entry = {
        betKey,
        betLabel: bet.label + (colla ? ` (${colla})` : ''),
        optionIdx,
        optionLabel: opt.label,
        odd,
        colla: colla || null,
      };
      if (existing >= 0) return prev.map((b, i) => i === existing ? entry : b);
      return [...prev, entry];
    });
  }, []);

  // ── Remove from betslip ─────────────────────────────────────────
  const remBet = i => {
    const b = bs[i];
    setSels(prev => ({ ...prev, [b.nom]: { ...(prev[b.nom] || {}), [b.slotKey]: null } }));
    setBs(prev => prev.filter((_, j) => j !== i));
  };

  const remSpecial = i => setBsSpecial(prev => prev.filter((_, j) => j !== i));

  // ── Place bet ───────────────────────────────────────────────────
  const place = async () => {
    const allBets = [...bs, ...bsSpecial];
    if (!allBets.length) return;
    if (!selD) { showToast('⚠️ Selecciona una diada'); return; }
    if (!currentUser) { showToast("⚠️ Has d'iniciar sessió"); setLoginOpen(true); return; }

    const combinedBase = allBets.reduce((a, b) => a * (b.odd || 1), 1);
    const combined = ordenat
      ? combinedBase
      : Math.max(1.01, Math.round((Math.sqrt(combinedBase) + (combinedBase - 1) / 2) * 100) / 100);
    const stakeVal = Math.min(stake, currentUser.points);
    if (stakeVal <= 0) { showToast('⚠️ No tens prou punts'); return; }

    const diada = diades.find(d => d.id === selD);
    try {
      await addDoc(collection(db, 'apostes'), {
        diadaId: selD,
        diadaName: diada?.name || '—',
        bettorName: currentUser.username,
        userId: currentUser.id,
        stake: stakeVal,
        combinedOdd: Math.round(combined * 100) / 100,
        potentialWin: Math.round(stakeVal * combined),
        lines: bs.map(b => ({ nom: b.nom, castle: b.castle, slotKey: b.slotKey, odd: b.odd, isPilar: b.isPilar })),
        specialLines: bsSpecial.map(b => ({ betKey: b.betKey, betLabel: b.betLabel, optionIdx: b.optionIdx, optionLabel: b.optionLabel, odd: b.odd, colla: b.colla || null })),
        ordenat,
        timestamp: serverTimestamp(),
        resolt: false,
      });
      await updateDoc(doc(db, 'usuaris', currentUser.id), {
        points: currentUser.points - stakeVal,
        totalApostes: (currentUser.totalApostes || 0) + 1,
      });
      showToast(`✅ Aposta! ×${combined.toFixed(2)} → ${Math.round(stakeVal * combined)} pts potencials`);
      setBs([]); setSels({}); setBsSpecial([]);
    } catch (e) { showToast('❌ ' + e.message); }
  };

  // ── Diada selection ─────────────────────────────────────────────
  const selDiada = id => {
    setSelD(id); setBs([]); setSels({}); setBsSpecial([]);
    setTimeout(() => bref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };
  const curD = diades.find(d => d.id === selD);

  // ── Style helpers ───────────────────────────────────────────────
  const navBtn = (id) => ({
    background: 'none', border: 'none', cursor: 'pointer',
    color: sec === id ? 'var(--green)' : 'var(--text-dim)',
    fontFamily: "'Barlow Condensed'", fontWeight: 600, fontSize: '.9rem',
    padding: '10px 18px',
    borderBottom: `2px solid ${sec === id ? 'var(--green)' : 'transparent'}`,
    whiteSpace: 'nowrap',
  });

  const diadaBtn = (active) => ({
    cursor: 'pointer',
    border: `1px solid ${active ? 'var(--green)' : 'var(--border)'}`,
    borderRadius: 4, fontFamily: "'Barlow Condensed'", fontWeight: 700,
    letterSpacing: '.5px', padding: '8px 18px',
    background: active ? 'rgba(0,208,75,.1)' : 'transparent',
    color: active ? 'var(--green)' : 'var(--text)',
    fontSize: '.9rem',
  });

  return (
    <>
      <style>{CSS}</style>
      <Toast msg={toast} />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={handleLogin} onRegister={handleRegister} />

      {/* Header */}
      <header style={{ background: 'var(--bg2)', borderBottom: '2px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 58, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: "'Bebas Neue'", fontSize: '2.2rem', letterSpacing: 2, color: 'var(--green)', textShadow: '0 0 20px #00d04b55' }}>
          BET<span style={{ color: 'var(--text)' }}>3</span>d5
          <em style={{ color: 'var(--text)', fontStyle: 'normal', fontSize: '1rem', fontFamily: "'Barlow Condensed'", fontWeight: 400, letterSpacing: 1, marginLeft: 8, verticalAlign: 'middle' }}>Apostes de Castells</em>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '.72rem', padding: '3px 10px', borderRadius: 12, fontFamily: "'Barlow Condensed'", fontWeight: 600, background: fb.ok ? 'rgba(0,208,75,.12)' : 'rgba(248,81,73,.12)', color: fb.ok ? 'var(--green)' : 'var(--red)', border: fb.ok ? '1px solid rgba(0,208,75,.3)' : '1px solid rgba(248,81,73,.3)' }}>
            {fb.msg}
          </span>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.88rem', color: 'var(--green)' }}>
                👤 {currentUser.username} <span style={{ color: 'var(--gold)' }}>{currentUser.points} pts</span>
              </span>
              <button onClick={handleLogout} style={{ cursor: 'pointer', border: '1px solid var(--border)', borderRadius: 4, fontFamily: "'Barlow Condensed'", fontWeight: 600, fontSize: '.82rem', padding: '6px 12px', background: 'transparent', color: 'var(--text-muted)' }}>Sortir</button>
            </div>
          ) : (
            <button onClick={() => setLoginOpen(true)} style={{ cursor: 'pointer', border: '1px solid var(--green)', borderRadius: 4, fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.9rem', padding: '7px 16px', background: 'rgba(0,208,75,.1)', color: 'var(--green)' }}>
              👤 ENTRAR
            </button>
          )}
          <button onClick={() => setAdmin(true)} style={{ cursor: 'pointer', border: '1px solid var(--border)', borderRadius: 4, fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.95rem', padding: '8px 18px', background: 'transparent', color: 'var(--text-muted)' }}>
            ⚙ ADMIN
          </button>
        </div>
      </header>

      <Ticker diades={diades} houseMarg={marg} />

      {/* Nav */}
      <nav style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', display: 'flex', padding: '0 24px', overflowX: 'auto' }}>
        {[['apostes', '🏆 Apostes'], ['meues', '🎫 Les meves'], ['comunitat', '👥 La gent'], ['ranking', '🥇 Rànquing']].map(([id, lbl]) => (
          <button key={id} onClick={() => setSec(id)} style={navBtn(id)}>{lbl}</button>
        ))}
      </nav>

      {/* Secció Apostes */}
      {sec === 'apostes' && (
        <div className="ml" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', minHeight: 'calc(100vh - 120px)' }}>
          <div style={{ padding: 16, borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
            <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.72rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '4px 0 10px' }}>Diades disponibles</div>
            {!diades.length ? (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🏰</div>
                <p>Cap diada. Crea'n una des d'Admin.</p>
              </div>
            ) : diades.map(d => {
              const act = selD === d.id;
              return (
                <div key={d.id} className="fade" style={{ background: act ? 'var(--bg4)' : 'var(--bg3)', border: `1px solid ${act ? 'var(--green)' : 'var(--border)'}`, borderRadius: 8, padding: 14, marginBottom: 10, transition: 'all .15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {d.name}
                        {d.resultatsFinalitzats && <span style={{ background: 'rgba(0,208,75,.15)', border: '1px solid rgba(0,208,75,.4)', borderRadius: 3, padding: '1px 6px', fontSize: '.65rem', color: 'var(--green)' }}>✓</span>}
                        {(d.specialBets || []).length > 0 && <span style={{ background: 'rgba(168,85,247,.15)', border: '1px solid rgba(168,85,247,.4)', borderRadius: 3, padding: '1px 6px', fontSize: '.65rem', color: 'var(--purple)' }}>✨ {d.specialBets.length} especials</span>}
                      </div>
                      <div style={{ fontSize: '.78rem', color: 'var(--text-dim)', marginTop: 3 }}>📅 {d.date || '—'} · 🏴 {(d.colles || []).length} colles</div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
                        {(d.colles || []).map(c => (
                          <span key={c.nom} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 3, padding: '2px 7px', fontSize: '.72rem', fontFamily: "'Barlow Condensed'", fontWeight: 600, color: 'var(--green)' }}>{c.nom}</span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => selDiada(d.id)} style={diadaBtn(act)}>
                      {act ? '✓ OBERTA' : '🎰 APOSTAR'}
                    </button>
                  </div>
                </div>
              );
            })}
            {selD && curD && (
              <div ref={bref}>
                <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />
                <DiadaMarket
                  curD={curD}
                  sels={sels}
                  handleToggle={handleToggle}
                  bsSpecial={bsSpecial}
                  onToggleSpecial={handleToggleSpecial}
                  houseMarg={marg}
                />
              </div>
            )}
          </div>
          {/* Betslip */}
          <div className="rp" style={{ padding: 16, background: 'var(--bg2)', position: 'sticky', top: 120, height: 'calc(100vh - 120px)', overflowY: 'auto' }}>
            <Betslip
              betslip={bs}
              bsSpecial={bsSpecial}
              onRemove={remBet}
              onRemoveSpecial={remSpecial}
              onPlace={place}
              stake={stake}
              setStake={setStake}
              currentUser={currentUser}
              ordenat={ordenat}
              setOrdenat={setOrdenat}
            />
          </div>
        </div>
      )}

      {sec === 'comunitat' && <ComuntitatSection apostes={apostes} diades={diades} />}
      {sec === 'ranking'   && <Ranking usuaris={usuaris} />}
      {sec === 'meues'     && <MeuesSection apostes={apostes} diades={diades} currentUser={currentUser} />}

      <AdminModal
        open={admin}
        onClose={() => setAdmin(false)}
        diades={diades}
        houseMarg={marg}
        setHouseMarg={setMarg}
        onToast={showToast}
        apostes={apostes}
        usuaris={usuaris}
      />
    </>
  );
}
