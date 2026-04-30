import { useState } from 'react';
import { PTS } from '../constants';
import { calcOdd, getCollaOptions, lvlKeyToNum, lvlNumToColor, lvlNumToLabel } from '../utils';

export function SlotSelector({ label, isPilar, options, selected, onSelect, collaNom, lvlKey, houseMarg }) {
  const odd = selected ? calcOdd(selected, collaNom, lvlKey, houseMarg) : null;
  const pts = selected ? PTS[selected] : null;
  const hasSelection = selected && odd;

  return (
    <div className="slot-row" style={{ padding: '10px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: hasSelection ? 8 : 0 }}>
        <span style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.72rem', letterSpacing: 1, textTransform: 'uppercase', color: isPilar ? 'var(--gold)' : 'var(--accent)', minWidth: 80, flexShrink: 0 }}>
          {label}
        </span>
        <select
          value={selected || ''}
          onChange={e => onSelect(e.target.value || null)}
          style={{ flex: 1, background: selected ? 'rgba(26,140,255,.08)' : 'var(--bg3)', border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}` }}
        >
          <option value="">— No apostar —</option>
          {options.map(n => {
            const o = calcOdd(n, collaNom, lvlKey, houseMarg);
            if (!o) return null;
            return <option key={n} value={n}>{n} o sup. — ×{o.toFixed(2)}</option>;
          })}
        </select>
        {hasSelection && (
          <span style={{ fontFamily: "'Bebas Neue'", fontSize: '1.4rem', color: 'var(--gold)', lineHeight: 1, flexShrink: 0 }}>
            ×{odd.toFixed(2)}
          </span>
        )}
      </div>
      {hasSelection && pts && (
        <div style={{ display: 'flex', gap: 8, paddingLeft: 88, fontSize: '.7rem', color: 'var(--text-dim)' }}>
          <span style={{ background: 'rgba(0,208,75,.1)', border: '1px solid rgba(0,208,75,.3)', borderRadius: 3, padding: '1px 6px', color: 'var(--green)' }}>✓ {pts.c} pts</span>
          <span style={{ background: 'rgba(248,81,73,.1)', border: '1px solid rgba(248,81,73,.3)', borderRadius: 3, padding: '1px 6px', color: 'var(--red)' }}>✗ {pts.d} pts</span>
        </div>
      )}
    </div>
  );
}

export function CollaMarket({ colla, selections, onToggle, houseMarg }) {
  const [open, setOpen] = useState(false);
  const { castellos, pilars } = getCollaOptions(colla.nom);
  const sel = selections[colla.nom] || {};
  const lvl = colla.nivell ?? 2;
  const lvlN = lvlKeyToNum(lvl);
  const numSel = ['c0', 'c1', 'c2', 'pilar'].filter(k => sel[k]).length;

  return (
    <div className="fade" style={{ background: 'var(--bg2)', border: `1px solid ${numSel > 0 ? 'rgba(26,140,255,.4)' : 'var(--border)'}`, borderRadius: 8, marginBottom: 8, overflow: 'hidden', transition: 'border-color .2s' }}>
      <div className="accordio-header" onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '1.08rem' }}>{colla.nom}</span>
          {numSel > 0 && (
            <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: 10, fontSize: '.65rem', fontFamily: "'Barlow Condensed'", fontWeight: 700, padding: '1px 7px' }}>{numSel} sel.</span>
          )}
          <span style={{ fontSize: '.72rem', background: 'var(--bg)', border: `1px solid ${lvlNumToColor(lvlN)}40`, borderRadius: 3, padding: '2px 8px', color: lvlNumToColor(lvlN) }}>
            {lvlNumToLabel(lvlN)}
          </span>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '.9rem', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</span>
      </div>
      {open && (
        <div className="fade">
          {['c0', 'c1', 'c2'].map((slot, si) => (
            <SlotSelector
              key={slot}
              label={`${si + 1}${si === 0 ? 'r' : si === 1 ? 'n' : 'r'} Castell`}
              isPilar={false}
              options={castellos}
              selected={sel[slot] || null}
              onSelect={v => onToggle(colla.nom, slot, v)}
              collaNom={colla.nom}
              lvlKey={lvl}
              houseMarg={houseMarg}
            />
          ))}
          <SlotSelector
            label="Pilar"
            isPilar={true}
            options={pilars}
            selected={sel.pilar || null}
            onSelect={v => onToggle(colla.nom, 'pilar', v)}
            collaNom={colla.nom}
            lvlKey={lvl}
            houseMarg={houseMarg}
          />
        </div>
      )}
    </div>
  );
}