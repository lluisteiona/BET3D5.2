import { useState } from 'react';
import { SLOT_NAMES } from '../constants';
import { checkApostaLines } from '../utils';

function getResDirectes(diadaId, diades) {
  return diades.find(d => d.id === diadaId)?.resultats || null;
}

export function ApostaCard({ a, diades, showUser = true }) {
  const ts = a.timestamp?.toDate ? a.timestamp.toDate() : null;
  const ds = ts ? ts.toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
  const resoltColor = a.resolt ? (a.encertat ? 'var(--green)' : 'var(--red)') : 'var(--text-dim)';
  const resDirectes = !a.resolt ? getResDirectes(a.diadaId, diades) : null;
  const linesCheck = resDirectes ? checkApostaLines(a.lines || [], resDirectes, a.ordenat !== false) : null;
  const hasSpecials = (a.specialLines || []).length > 0;
  const hasCastells = (a.lines || []).length > 0;

  return (
    <div className="fade" style={{ background: 'var(--bg2)', border: `1px solid ${a.resolt ? (a.encertat ? 'rgba(0,208,75,.3)' : 'rgba(248,81,73,.3)') : 'var(--border)'}`, borderRadius: 8, marginBottom: 12, overflow: 'hidden' }}>
      <div style={{ background: 'var(--bg4)', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 6 }}>
        <div>
          {showUser && <span style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>👤 {a.bettorName || 'Anònim'}</span>}
          <div style={{ fontSize: '.72rem', color: 'var(--text-dim)', marginTop: showUser ? 2 : 0 }}>📅 {a.diadaName || '—'} · {ds}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: '1.4rem', color: 'var(--gold)' }}>×{a.combinedOdd?.toFixed(2) || '—'}</div>
          <div style={{ fontSize: '.7rem', color: 'var(--text-dim)' }}>{a.stake || '—'} pts → <b style={{ color: 'var(--green)' }}>{a.potentialWin || '—'} pts</b></div>
          {a.resolt && <div style={{ fontSize: '.72rem', color: resoltColor, fontFamily: "'Barlow Condensed'", fontWeight: 700, marginTop: 2 }}>{a.encertat ? `✅ +${a.ptsAtorgats} pts` : '❌ Fallida'}</div>}
        </div>
      </div>
      <div style={{ padding: '6px 14px 10px' }}>
        {hasCastells && (a.lines || []).map((l, li) => {
          const lr = a.resolt ? a.lineResults?.[li] : linesCheck?.[li];
          const hasResult = !!lr;
          const lineOk = hasResult && lr.ok;
          const color = !hasResult ? 'var(--gold)' : lineOk ? 'var(--green)' : 'var(--red)';
          return (
            <div key={li} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--border)', paddingLeft: 4 }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '.82rem' }}><b style={{ color: 'var(--green)' }}>{l.nom}</b> · {l.castle} o sup.</span>
                <div style={{ fontSize: '.68rem', color: 'var(--text-dim)', marginTop: 1 }}>
                  {l.isPilar ? 'Pilar' : (a.ordenat !== false) ? SLOT_NAMES[l.slotKey] : 'Qualsevol ordre'}
                  {hasResult && lr.fetCastle && (
                    <span style={{ marginLeft: 6, color, fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>→ {lr.fetCastle} {lineOk ? '✓' : '✗'}</span>
                  )}
                </div>
              </div>
              <span style={{ fontFamily: "'Bebas Neue'", fontSize: '1.1rem', color, flexShrink: 0, marginLeft: 8 }}>×{l.odd?.toFixed(2) || '—'}</span>
            </div>
          );
        })}
        {hasSpecials && (a.specialLines || []).map((sl, si) => {
          const sr = a.resolt ? a.specResults?.[si] : null;
          const color = !sr ? 'var(--purple)' : sr.ok ? 'var(--green)' : 'var(--red)';
          return (
            <div key={'s' + si} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--border)', paddingLeft: 4 }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '.82rem' }}>✨ <b style={{ color: 'var(--purple)' }}>{sl.betLabel}</b></span>
                <div style={{ fontSize: '.68rem', color: 'var(--text-dim)', marginTop: 1 }}>
                  → <b style={{ color: 'var(--green)' }}>{sl.optionLabel}</b>
                  {sr && <span style={{ marginLeft: 6, color, fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>{sr.ok ? '✓' : '✗'}</span>}
                </div>
              </div>
              <span style={{ fontFamily: "'Bebas Neue'", fontSize: '1.1rem', color: 'var(--gold)', flexShrink: 0, marginLeft: 8 }}>×{sl.odd?.toFixed(2) || '—'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ComuntitatSection({ apostes, diades }) {
  const [filt, setFilt] = useState('');
  const filtered = filt ? apostes.filter(a => a.diadaId === filt) : apostes;
  return (
    <div style={{ padding: 20, maxWidth: 960, margin: '0 auto' }}>
      <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.72rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '4px 0 10px' }}>Apostes de la comunitat</div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filt} onChange={e => setFilt(e.target.value)} style={{ maxWidth: 260 }}>
          <option value="">Totes les diades</option>
          {diades.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <span style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>{filtered.length} aposta{filtered.length !== 1 ? 's' : ''}</span>
      </div>
      {!filtered.length ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}><div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🎪</div><p>Encara no hi ha apostes.</p></div>
      ) : filtered.map(a => <ApostaCard key={a.id} a={a} diades={diades} showUser={true} />)}
    </div>
  );
}

export function MeuesSection({ apostes, diades, currentUser }) {
  return (
    <div style={{ padding: 20, maxWidth: 960, margin: '0 auto' }}>
      <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '.72rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '4px 0 10px' }}>Les meves apostes</div>
      {!currentUser ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}><div style={{ fontSize: '2.5rem', marginBottom: 8 }}>👤</div><p>Inicia sessió per veure les teves apostes.</p></div>
      ) : (() => {
        const myAp = apostes.filter(a => a.userId === currentUser.id);
        if (!myAp.length) return <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}><div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🎪</div><p>Encara no has fet cap aposta.</p></div>;
        return myAp.map(a => <ApostaCard key={a.id} a={a} diades={diades} showUser={false} />);
      })()}
    </div>
  );
}

export function Ranking({ usuaris }) {
  const sorted = [...usuaris].sort((a, b) => b.points - a.points);
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div style={{ padding: 20, maxWidth: 700, margin: '0 auto' }}>
      <div style={{ fontFamily: "'Bebas Neue'", fontSize: '2rem', letterSpacing: 2, color: 'var(--gold)', marginBottom: 4 }}>🏆 RÀNQUING</div>
      <div style={{ fontFamily: "'Barlow Condensed'", fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: 18 }}>Punts acumulats de totes les diades</div>
      {!sorted.length ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}><div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🎪</div><p>Encara no hi ha usuaris registrats.</p></div>
      ) : sorted.map((u, i) => (
        <div key={u.id} className="fade" style={{ background: i===0?'rgba(240,180,0,.06)':i===1?'rgba(192,192,192,.04)':i===2?'rgba(205,127,50,.04)':'var(--bg2)', border:`1px solid ${i===0?'rgba(240,180,0,.3)':i===1?'rgba(192,192,192,.2)':i===2?'rgba(205,127,50,.2)':'var(--border)'}`, borderRadius:8,padding:'14px 18px',marginBottom:8,display:'flex',alignItems:'center',gap:14 }}>
          <div style={{ fontFamily:"'Bebas Neue'",fontSize:'1.6rem',color:'var(--text-muted)',minWidth:32,textAlign:'center' }}>{i<3?medals[i]:`#${i+1}`}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Barlow Condensed'",fontWeight:700,fontSize:'1.05rem' }}>{u.username}</div>
            <div style={{ fontSize:'.72rem',color:'var(--text-dim)',marginTop:2 }}>{u.totalApostes||0} apostes</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:"'Bebas Neue'",fontSize:'1.8rem',color:i===0?'var(--gold)':i===1?'#c0c0c0':i===2?'#cd7f32':'var(--text)',lineHeight:1 }}>{u.points}</div>
            <div style={{ fontSize:'.65rem',color:'var(--text-muted)',fontFamily:"'Barlow Condensed'" }}>PUNTS</div>
          </div>
        </div>
      ))}
    </div>
  );
}