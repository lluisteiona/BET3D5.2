import { useState } from 'react';
import { buildRangeOptions } from '../utils';

// ── QuotesEditor ─────────────────────────────────────────────────
// collaKey: '__global__' per globals, o nom de colla per override
export function QuotesEditor({ bet, collaKey, label, tipus, HOUSE_MARG, updateBet, recalcRange, recalcYesNo }) {
  const isGlobal = collaKey === '__global__';
  const cfg = isGlobal ? bet : (bet._collasCfg?.[collaKey] || {});

  const setCollaField = (field, val) => {
    updateBet(bet.id, '_collasCfg', {
      ...(bet._collasCfg || {}),
      [collaKey]: { ...(bet._collasCfg?.[collaKey] || {}), [field]: val },
    });
  };
  const setGlobalField = (field, val) => updateBet(bet.id, field, val);
  const setField = isGlobal ? setGlobalField : setCollaField;

  const ynSi   = isGlobal ? (bet._ynSi   ?? 1.8) : (cfg._ynSi   ?? bet._ynSi   ?? 1.8);
  const ynNo   = isGlobal ? (bet._ynNo   ?? 1.8) : (cfg._ynNo   ?? bet._ynNo   ?? 1.8);
  const rangN  = isGlobal ? (bet._rangN  ?? 5)   : (cfg._rangN  ?? bet._rangN  ?? 5);
  const rangBest = isGlobal ? (bet._rangBest ?? 2) : (cfg._rangBest ?? bet._rangBest ?? 2);
  const rangBase = isGlobal ? (bet._rangBase ?? 1.6) : (cfg._rangBase ?? bet._rangBase ?? 1.6);
  const rangDisc = isGlobal ? (bet._rangDisc ?? 1.6) : (cfg._rangDisc ?? bet._rangDisc ?? 1.6);
  const rangStart = isGlobal ? (bet._rangStart ?? 1) : (cfg._rangStart ?? bet._rangStart ?? 1);
  const rangExact = isGlobal ? (bet._rangExact ?? false) : (cfg._rangExact ?? bet._rangExact ?? false);

  const previewOpts = tipus === 'range' ? buildRangeOptions(rangN, rangBest, rangBase, rangDisc, HOUSE_MARG, rangStart, rangExact) : [];

  return (
    <div style={{ background: 'var(--bg4)', border: `1px solid ${isGlobal ? 'var(--border)' : 'rgba(168,85,247,.3)'}`, borderRadius: 6, padding: '10px 12px' }}>
      {label && <div style={{ fontSize: '.65rem', color: isGlobal ? 'var(--text-dim)' : 'var(--purple)', fontFamily: "'Barlow Condensed'", textTransform: 'uppercase', marginBottom: 8, fontWeight: 700 }}>{label}</div>}

      {tipus === 'yesno' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={{ fontSize: '.6rem', color: 'var(--green)', display: 'block', marginBottom: 3, fontFamily: "'Barlow Condensed'" }}>QUOTA "SÍ" BASE</label>
            <input type="number" min={1.01} step={0.05} value={ynSi}
              onChange={e => setField('_ynSi', parseFloat(e.target.value) || 1.8)}
              onBlur={() => isGlobal ? recalcYesNo(bet.id) : recalcYesNo(bet.id, collaKey)}
              style={{ width: '100%' }} />
            <div style={{ fontSize: '.7rem', color: 'var(--gold)', marginTop: 3, fontFamily: "'Bebas Neue'" }}>
              Amb marge: ×{Math.max(1.01, Math.round(ynSi * (1 - HOUSE_MARG / 100) * 100) / 100).toFixed(2)}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '.6rem', color: 'var(--red)', display: 'block', marginBottom: 3, fontFamily: "'Barlow Condensed'" }}>QUOTA "NO" BASE</label>
            <input type="number" min={1.01} step={0.05} value={ynNo}
              onChange={e => setField('_ynNo', parseFloat(e.target.value) || 1.8)}
              onBlur={() => isGlobal ? recalcYesNo(bet.id) : recalcYesNo(bet.id, collaKey)}
              style={{ width: '100%' }} />
            <div style={{ fontSize: '.7rem', color: 'var(--gold)', marginTop: 3, fontFamily: "'Bebas Neue'" }}>
              Amb marge: ×{Math.max(1.01, Math.round(ynNo * (1 - HOUSE_MARG / 100) * 100) / 100).toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {tipus === 'range' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <label style={{ fontSize: '.6rem', color: 'var(--text-dim)', display: 'block', marginBottom: 3, fontFamily: "'Barlow Condensed'" }}>NOMBRE D'OPCIONS</label>
              <input type="number" min={2} max={20} value={rangN}
                onChange={e => setField('_rangN', parseInt(e.target.value) || 5)}
                onBlur={() => isGlobal ? recalcRange(bet.id) : recalcRange(bet.id, collaKey)}
                style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '.6rem', color: 'var(--text-dim)', display: 'block', marginBottom: 3, fontFamily: "'Barlow Condensed'" }}>MÉS PROBABLE (posició 1..{rangN})</label>
              <input type="number" min={1} max={rangN} value={rangBest + 1}
                onChange={e => setField('_rangBest', (parseInt(e.target.value) || 1) - 1)}
                onBlur={() => isGlobal ? recalcRange(bet.id) : recalcRange(bet.id, collaKey)}
                style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '.6rem', color: 'var(--text-dim)', display: 'block', marginBottom: 3, fontFamily: "'Barlow Condensed'" }}>QUOTA BASE (sense marge)</label>
              <input type="number" min={1.05} step={0.05} value={rangBase}
                onChange={e => setField('_rangBase', parseFloat(e.target.value) || 1.6)}
                onBlur={() => isGlobal ? recalcRange(bet.id) : recalcRange(bet.id, collaKey)}
                style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '.6rem', color: 'var(--text-dim)', display: 'block', marginBottom: 3, fontFamily: "'Barlow Condensed'" }}>DISCREPÀNCIA (×/posició)</label>
              <input type="number" min={1.0} max={5} step={0.05} value={rangDisc}
                onChange={e => setField('_rangDisc', parseFloat(e.target.value) || 1.6)}
                onBlur={() => isGlobal ? recalcRange(bet.id) : recalcRange(bet.id, collaKey)}
                style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '.6rem', color: 'var(--text-dim)', display: 'block', marginBottom: 3, fontFamily: "'Barlow Condensed'" }}>NÚMERO INICIAL</label>
              <input type="number" min={0} value={rangStart}
                onChange={e => setField('_rangStart', parseInt(e.target.value) ?? 1)}
                onBlur={() => isGlobal ? recalcRange(bet.id) : recalcRange(bet.id, collaKey)}
                style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label style={{ fontSize: '.6rem', color: 'var(--text-dim)', display: 'block', marginBottom: 3, fontFamily: "'Barlow Condensed'" }}>ÚLTIMA OPCIÓ</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {[false, true].map(val => (
                  <button key={String(val)}
                    onClick={() => {
                      setField('_rangExact', val);
                      setTimeout(() => isGlobal ? recalcRange(bet.id) : recalcRange(bet.id, collaKey), 0);
                    }}
                    style={{ flex: 1, cursor: 'pointer', border: `1px solid ${rangExact === val ? 'var(--green)' : 'var(--border)'}`, borderRadius: 4, padding: '4px 6px', background: rangExact === val ? 'rgba(0,208,75,.12)' : 'var(--bg3)', color: rangExact === val ? 'var(--green)' : 'var(--text-dim)', fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.65rem' }}>
                    {val ? `Exacte` : `${rangStart + rangN - 1}+`}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => isGlobal ? recalcRange(bet.id) : recalcRange(bet.id, collaKey)}
            style={{ cursor: 'pointer', border: '1px solid var(--accent)', borderRadius: 4, padding: '4px 12px', background: 'rgba(26,140,255,.1)', color: 'var(--accent)', fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.78rem', marginBottom: 8 }}>
            ↻ Recalcular
          </button>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {previewOpts.map((opt, i) => (
              <div key={i} style={{ background: i === rangBest ? 'rgba(0,208,75,.15)' : 'var(--bg3)', border: `1px solid ${i === rangBest ? 'rgba(0,208,75,.5)' : 'var(--border)'}`, borderRadius: 5, padding: '3px 8px', textAlign: 'center', minWidth: 44 }}>
                <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.72rem', color: i === rangBest ? 'var(--green)' : 'var(--text)' }}>{opt.label}</div>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: '.9rem', color: 'var(--gold)', lineHeight: 1.1 }}>×{opt.odd.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── CollaQuotaAccordio ───────────────────────────────────────────
export function CollaQuotaAccordio({ collaNom, bet, hasOverride, HOUSE_MARG, updateBet, recalcRange, recalcYesNo }) {
  const [open, setOpen] = useState(false);
  const displayOpts = bet.collesOpts?.[collaNom] || bet.options || [];

  const removeOverride = () => {
    const newCfg = { ...(bet._collasCfg || {}) };
    delete newCfg[collaNom];
    const newCollesOpts = { ...(bet.collesOpts || {}) };
    delete newCollesOpts[collaNom];
    updateBet(bet.id, '_collasCfg', newCfg);
    updateBet(bet.id, 'collesOpts', newCollesOpts);
    setOpen(false);
  };

  return (
    <div style={{ border: `1px solid ${hasOverride ? 'rgba(168,85,247,.4)' : 'var(--border)'}`, borderRadius: 6, marginBottom: 5, overflow: 'hidden', background: hasOverride ? 'rgba(168,85,247,.04)' : 'var(--bg3)' }}>
      <div onClick={() => setOpen(o => !o)} style={{ cursor: 'pointer', padding: '7px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.85rem' }}>{collaNom}</span>
          {hasOverride
            ? <span style={{ fontSize: '.62rem', background: 'rgba(168,85,247,.2)', color: 'var(--purple)', borderRadius: 3, padding: '1px 6px', fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>✎ PERSONALITZAT</span>
            : <span style={{ fontSize: '.62rem', color: 'var(--text-muted)', fontFamily: "'Barlow Condensed'" }}>usa globals</span>
          }
          <div style={{ display: 'flex', gap: 3 }}>
            {displayOpts.slice(0, 4).map((o, i) => (
              <span key={i} style={{ fontSize: '.62rem', fontFamily: "'Bebas Neue'", color: 'var(--gold)' }}>×{o.odd?.toFixed(1)}</span>
            ))}
            {displayOpts.length > 4 && <span style={{ fontSize: '.62rem', color: 'var(--text-muted)' }}>...</span>}
          </div>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '.8rem', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</span>
      </div>
      {open && (
        <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <QuotesEditor
            bet={bet}
            collaKey={collaNom}
            label={null}
            tipus={bet.tipus}
            HOUSE_MARG={HOUSE_MARG}
            updateBet={updateBet}
            recalcRange={recalcRange}
            recalcYesNo={recalcYesNo}
          />
          {hasOverride && (
            <button onClick={removeOverride} style={{ cursor: 'pointer', border: '1px solid rgba(248,81,73,.4)', borderRadius: 4, padding: '4px 12px', background: 'transparent', color: 'var(--red)', fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.75rem', marginTop: 4, alignSelf: 'flex-start' }}>
              ✕ Eliminar personalització — tornar a globals
            </button>
          )}
        </div>
      )}
    </div>
  );
}
