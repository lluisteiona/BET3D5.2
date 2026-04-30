import { useState } from 'react';
import { CollaMarket } from './CollaMarket';
import { SpecialBetsMarket } from './SpecialBets';

export function DiadaMarket({ curD, sels, handleToggle, bsSpecial, onToggleSpecial, houseMarg }) {
  const [tab, setTab] = useState('castells');
  const specialBets = curD?.specialBets || [];

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: 6, padding: 3, marginBottom: 14, gap: 3 }}>
        {[['castells', '🏰 Castells per Colla'], ['especials', '✨ Apostes Especials']].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, cursor: 'pointer', border: 'none', borderRadius: 4, fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.88rem', padding: '8px', background: tab === id ? 'var(--bg4)' : 'transparent', color: tab === id ? 'var(--green)' : 'var(--text-dim)', borderBottom: tab === id ? '2px solid var(--green)' : '2px solid transparent' }}>
            {lbl}
            {id === 'especials' && specialBets.length > 0 && (
              <span style={{ background: 'var(--purple)', color: '#fff', borderRadius: 10, fontSize: '.6rem', fontFamily: "'Barlow Condensed'", fontWeight: 700, padding: '0px 5px', marginLeft: 5 }}>{specialBets.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'castells' && (
        <>
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, padding: '7px 12px', fontSize: '.78rem', color: 'var(--text-dim)', marginBottom: 12 }}>
            Clica cada colla per expandir-la i seleccionar apostes. Cada aposta és "<b>X o superior</b>".
          </div>
          {(curD.colles || []).map(c => (
            <CollaMarket key={c.nom} colla={c} selections={sels} onToggle={handleToggle} houseMarg={houseMarg} />
          ))}
        </>
      )}

      {tab === 'especials' && (
        <SpecialBetsMarket
          diada={curD}
          specialBets={specialBets}
          bsSpecial={bsSpecial}
          onToggleSpecial={onToggleSpecial}
        />
      )}
    </div>
  );
}