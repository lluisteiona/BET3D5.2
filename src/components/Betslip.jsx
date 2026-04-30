import { SLOT_NAMES } from '../constants';

export function Betslip({ betslip, bsSpecial, onRemove, onRemoveSpecial, onPlace, stake, setStake, currentUser, ordenat, setOrdenat }) {
  const allBets = [
    ...betslip.map(b => ({ ...b, _type: 'castle' })),
    ...bsSpecial.map(b => ({ ...b, _type: 'special' })),
  ];
  const combinedBase = allBets.reduce((a, b) => a * (b.odd || 1), 1);
  const combined = ordenat
    ? combinedBase
    : Math.max(1.01, Math.round((Math.sqrt(combinedBase) + (combinedBase - 1) / 2) * 100) / 100);
  const potWin = Math.round(stake * combined);

  return (
    <div>
      <div style={{ fontFamily: "'Bebas Neue'", fontSize: '1.4rem', letterSpacing: 1, color: 'var(--green)', borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Butxaca
        <span style={{ background: 'var(--green)', color: '#000', borderRadius: 12, fontSize: '.72rem', fontFamily: "'Barlow Condensed'", fontWeight: 700, padding: '2px 10px' }}>{allBets.length}</span>
      </div>

      {!currentUser && (
        <div style={{ background: 'rgba(248,81,73,.08)', border: '1px solid rgba(248,81,73,.3)', borderRadius: 6, padding: '10px 14px', marginBottom: 12, fontSize: '.83rem', color: 'var(--red)', textAlign: 'center' }}>
          ⚠️ Inicia sessió per apostar
        </div>
      )}
      {currentUser && (
        <div style={{ background: 'rgba(0,208,75,.08)', border: '1px solid rgba(0,208,75,.3)', borderRadius: 6, padding: '8px 14px', marginBottom: 12, fontSize: '.82rem', color: 'var(--green)', display: 'flex', justifyContent: 'space-between' }}>
          <span>👤 {currentUser.username}</span>
          <span style={{ color: 'var(--gold)', fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>{currentUser.points} pts disponibles</span>
        </div>
      )}

      {!allBets.length ? (
        <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)', fontSize: '.85rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎪</div>
          Selecciona apostes del mercat
        </div>
      ) : (
        <>
          {betslip.map((b, i) => (
            <div key={'c' + i} className="fade" style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', marginBottom: 7, position: 'relative' }}>
              <button onClick={() => onRemove(i)} style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1rem', position: 'absolute', top: 7, right: 9 }}>✕</button>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: 20 }}>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.82rem', color: 'var(--accent)' }}>🏰 {b.nom}</div>
                  <div style={{ fontSize: '.9rem', fontWeight: 500, marginTop: 2 }}>{b.castle} o superior</div>
                  <div style={{ fontSize: '.7rem', color: 'var(--text-dim)', marginTop: 2 }}>{b.isPilar ? '🔷' : '🏰'} {SLOT_NAMES[b.slotKey]}</div>
                </div>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: '1.5rem', color: 'var(--gold)', lineHeight: 1 }}>×{b.odd.toFixed(2)}</div>
              </div>
            </div>
          ))}

          {bsSpecial.map((b, i) => (
            <div key={'s' + i} className="fade" style={{ background: 'var(--bg3)', border: '1px solid rgba(168,85,247,.3)', borderRadius: 6, padding: '10px 12px', marginBottom: 7, position: 'relative' }}>
              <button onClick={() => onRemoveSpecial(i)} style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1rem', position: 'absolute', top: 7, right: 9 }}>✕</button>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: 20 }}>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.82rem', color: 'var(--purple)' }}>✨ Especial</div>
                  <div style={{ fontSize: '.9rem', fontWeight: 500, marginTop: 2 }}>{b.betLabel}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--green)', marginTop: 2, fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>{b.optionLabel}</div>
                </div>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: '1.5rem', color: 'var(--gold)', lineHeight: 1 }}>×{b.odd.toFixed(2)}</div>
              </div>
            </div>
          ))}

          <div style={{ background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 6, padding: 12, marginTop: 10 }}>
            {betslip.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '.72rem', color: 'var(--text-dim)', fontFamily: "'Barlow Condensed'", textTransform: 'uppercase' }}>Ordre dels castells</span>
                <button onClick={() => setOrdenat(o => !o)} style={{ cursor: 'pointer', border: `1px solid ${ordenat ? 'rgba(0,208,75,.5)' : 'rgba(248,81,73,.5)'}`, borderRadius: 4, fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.68rem', padding: '3px 10px', background: ordenat ? 'rgba(0,208,75,.1)' : 'rgba(248,81,73,.1)', color: ordenat ? 'var(--green)' : 'var(--red)', letterSpacing: .5 }}>
                  {ordenat ? '✓ ORDENAT' : '✗ SENSE ORDRE'}
                </button>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.83rem', color: 'var(--text-dim)', marginBottom: 10 }}>
              <span>Quota combinada</span>
              <span style={{ color: 'var(--gold)', fontFamily: "'Bebas Neue'", fontSize: '1.1rem' }}>×{combined.toFixed(2)}</span>
            </div>
            <div style={{ fontSize: '.72rem', color: 'var(--text-dim)', marginBottom: 4, fontFamily: "'Barlow Condensed'", textTransform: 'uppercase' }}>Punts apostats</div>
            <input type="number" value={stake} min={1} max={currentUser?.points || 9999} onChange={e => setStake(Math.max(1, parseInt(e.target.value) || 1))} style={{ width: '100%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '1.05rem', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 8 }}>
              <span>Guany potencial</span>
              <span style={{ color: 'var(--gold)' }}>{potWin} pts</span>
            </div>
          </div>

          <button onClick={onPlace} disabled={!currentUser} style={{ width: '100%', marginTop: 10, padding: 12, fontSize: '1rem', cursor: currentUser ? 'pointer' : 'not-allowed', border: 'none', borderRadius: 4, fontFamily: "'Barlow Condensed'", fontWeight: 700, background: currentUser ? 'var(--green)' : 'var(--bg3)', color: currentUser ? '#000' : 'var(--text-muted)', letterSpacing: .5, opacity: currentUser ? 1 : 0.6 }}>
            APOSTAR ARA
          </button>
        </>
      )}
    </div>
  );
}