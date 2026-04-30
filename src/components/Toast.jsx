import { calcOdd } from '../utils';

export function Toast({ msg }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
      background: 'var(--bg4)', border: '1px solid var(--green)', borderRadius: 6,
      padding: '12px 18px', fontFamily: "'Barlow Condensed'", fontWeight: 600,
      fontSize: '.95rem', color: 'var(--text)', transition: 'all .3s',
      pointerEvents: 'none', maxWidth: 340,
      transform: msg ? 'none' : 'translateY(80px)', opacity: msg ? 1 : 0,
    }}>
      {msg}
    </div>
  );
}

export function Ticker({ diades, houseMarg }) {
  const items = [];
  diades.forEach(d =>
    (d.colles || []).forEach(c =>
      ['5d6', '3d7', 'td6', '9d5', '4d7'].forEach(nom => {
        const o = calcOdd(nom, c.nom, c.nivell ?? 2, houseMarg);
        if (o) items.push({ nom: c.nom, cas: nom, o });
      })
    )
  );

  if (!items.length) return (
    <div style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)', height: 28, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
      <span style={{ fontFamily: "'Barlow Condensed'", fontSize: '.78rem', color: 'var(--text-dim)' }}>Carregant quotes...</span>
    </div>
  );

  const d = [...items, ...items];
  return (
    <div style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)', overflow: 'hidden', height: 28, display: 'flex', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 48, animation: 'tick 35s linear infinite', whiteSpace: 'nowrap', paddingLeft: '100%' }}>
        {d.map((it, i) => (
          <span key={i} style={{ fontFamily: "'Barlow Condensed'", fontSize: '.78rem', color: 'var(--text-dim)' }}>
            {it.cas} <b style={{ color: 'var(--green)' }}>{it.nom}</b>{' '}
            <b style={{ color: 'var(--gold)' }}>×{it.o.toFixed(2)}</b>
          </span>
        ))}
      </div>
    </div>
  );
}