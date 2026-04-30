import { useState } from 'react';
import { SPECIAL_CATEGORIES } from '../constants';

// ── SpecialBetCard ───────────────────────────────────────────────
// bet.perColla = true → l'usuari tria colla + opció
// bet.options ja vénen amb .odd precalculat (guardat a Firestore per l'admin)
function SpecialBetCard({ bet, bsSpecial, onToggle, diada }) {
  const cat = SPECIAL_CATEGORIES.find(c => c.id === bet.catId);
  const catColor = cat?.color || 'var(--accent)';
  const colles = (diada?.colles || []).map(c => c.nom);
  const isPerColla = bet.perColla;

  const [selColla, setSelColla] = useState(colles[0] || '');

  const getBetKey = (colla) => isPerColla ? `${bet.id}__${colla}` : bet.id;
  const getSelection = (colla) => bsSpecial.find(b => b.betKey === getBetKey(colla));
  const activeSel = isPerColla ? getSelection(selColla) : getSelection(null);
  const options = bet.options || [];

  return (
    <div style={{ background: 'var(--bg2)', border: `1px solid ${activeSel ? 'rgba(0,208,75,.4)' : 'var(--border)'}`, borderRadius: 8, marginBottom: 10, overflow: 'hidden', transition: 'border-color .2s' }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', background: 'var(--bg4)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
            <span style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.95rem' }}>{bet.label}</span>
            {isPerColla
              ? <span style={{ background: 'rgba(168,85,247,.2)', border: '1px solid rgba(168,85,247,.4)', borderRadius: 3, padding: '1px 7px', fontSize: '.65rem', color: 'var(--purple)', fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>PER COLLA</span>
              : bet.colla
                ? <span style={{ background: catColor + '22', border: `1px solid ${catColor}44`, borderRadius: 3, padding: '1px 7px', fontSize: '.65rem', color: catColor, fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>{bet.colla}</span>
                : <span style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 7px', fontSize: '.65rem', color: 'var(--text-muted)', fontFamily: "'Barlow Condensed'" }}>GLOBAL</span>
            }
          </div>
          {bet.descripcio && <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{bet.descripcio}</div>}
        </div>
        <span style={{ fontSize: '.65rem', background: catColor + '15', border: `1px solid ${catColor}33`, borderRadius: 3, padding: '2px 7px', color: catColor, fontFamily: "'Barlow Condensed'", fontWeight: 700, flexShrink: 0 }}>
          {bet.tipus === 'yesno' ? 'SÍ/NO' : 'RANG'}
        </span>
      </div>

      {/* Selector de colla (si perColla) */}
      {isPerColla && (
        <div style={{ padding: '8px 14px 4px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontFamily: "'Barlow Condensed'", fontSize: '.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', flexShrink: 0 }}>Colla:</span>
          <select value={selColla} onChange={e => setSelColla(e.target.value)} style={{ flex: 1 }}>
            {colles.map(c => {
              const hasSel = !!getSelection(c);
              return <option key={c} value={c}>{hasSel ? '✓ ' : ''}{c}</option>;
            })}
          </select>
          {bsSpecial.filter(b => b.betKey?.startsWith(bet.id + '__')).length > 0 && (
            <span style={{ background: 'var(--green)', color: '#000', borderRadius: 10, fontSize: '.6rem', fontFamily: "'Barlow Condensed'", fontWeight: 700, padding: '1px 6px', flexShrink: 0 }}>
              {bsSpecial.filter(b => b.betKey?.startsWith(bet.id + '__')).length} col.
            </span>
          )}
        </div>
      )}

      {/* Options */}
      <div style={{ padding: '8px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {options.map((opt, oi) => {
          const odd = opt.odd ?? 1.5;
          const isSel = activeSel?.optionIdx === oi;
          return (
            <button key={oi}
              onClick={() => onToggle(bet, oi, opt, odd, isPerColla ? selColla : (bet.colla || null))}
              style={{ cursor: 'pointer', border: `1px solid ${isSel ? 'var(--green)' : 'var(--border)'}`, borderRadius: 6, padding: '8px 14px', background: isSel ? 'rgba(0,208,75,.12)' : 'var(--bg3)', color: isSel ? 'var(--green)' : 'var(--text)', fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.88rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: '1 1 auto', minWidth: 80, transition: 'all .15s' }}>
              <span style={{ fontSize: '.8rem' }}>{opt.label}</span>
              <span style={{ fontFamily: "'Bebas Neue'", fontSize: '1.25rem', color: isSel ? 'var(--green)' : 'var(--gold)', lineHeight: 1 }}>×{odd.toFixed(2)}</span>
            </button>
          );
        })}
      </div>

      {activeSel && (
        <div style={{ padding: '6px 14px 8px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.75rem', color: 'var(--text-dim)' }}>
          <span>✓ <b style={{ color: 'var(--green)' }}>{activeSel.optionLabel}</b>{isPerColla && ` — ${selColla}`}</span>
          <button onClick={() => onToggle(bet, -1, null, 0, isPerColla ? selColla : null)} style={{ cursor: 'pointer', border: 'none', background: 'none', color: 'var(--text-muted)', fontSize: '.8rem' }}>✕ Treure</button>
        </div>
      )}
    </div>
  );
}

// ── SpecialBetsMarket ────────────────────────────────────────────
export function SpecialBetsMarket({ diada, specialBets, bsSpecial, onToggleSpecial }) {
  const [catOpen, setCatOpen] = useState('puntuacio');

  if (!specialBets || !specialBets.length) {
    return (
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', marginBottom: 16 }}>
        <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>🎲</div>
        <div style={{ fontFamily: "'Barlow Condensed'", fontSize: '.88rem' }}>Sense apostes especials configurades per aquesta diada.</div>
        <div style={{ fontSize: '.75rem', marginTop: 4, color: 'var(--text-muted)' }}>L'admin les afegirà des d'Administració</div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {SPECIAL_CATEGORIES.map(cat => {
          const hasItems = specialBets.some(b => b.catId === cat.id);
          if (!hasItems) return null;
          return (
            <button key={cat.id} className="cat-tab" onClick={() => setCatOpen(cat.id)}
              style={{ background: catOpen === cat.id ? cat.color + '22' : 'var(--bg3)', color: catOpen === cat.id ? cat.color : 'var(--text-dim)', border: `1px solid ${catOpen === cat.id ? cat.color + '66' : 'var(--border)'}` }}>
              {cat.label}
            </button>
          );
        })}
      </div>
      {specialBets.filter(b => b.catId === catOpen).map(bet => (
        <SpecialBetCard key={bet.id} bet={bet} bsSpecial={bsSpecial} onToggle={onToggleSpecial} diada={diada} />
      ))}
    </div>
  );
}