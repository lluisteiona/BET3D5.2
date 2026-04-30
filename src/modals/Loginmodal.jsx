import { useState } from 'react';

export function LoginModal({ open, onClose, onLogin, onRegister }) {
  const [mode, setMode] = useState('login');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!user.trim() || !pass.trim()) { setErr('Omple tots els camps'); return; }
    setLoading(true); setErr('');
    try {
      if (mode === 'login') await onLogin(user.trim(), pass.trim());
      else await onRegister(user.trim(), pass.trim());
      setUser(''); setPass(''); onClose();
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ display: 'flex', position: 'fixed', inset: 0, background: '#000c', zIndex: 1000, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 30, width: '90%', maxWidth: 380 }}>
        <div style={{ fontFamily: "'Bebas Neue'", fontSize: '1.7rem', letterSpacing: 1, color: 'var(--green)', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {mode === 'login' ? 'Iniciar sessió' : 'Registre'}
          <button onClick={onClose} style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'var(--bg3)', borderRadius: 6, padding: 3 }}>
          {[['login', 'Entrar'], ['register', 'Registrar-se']].map(([m, l]) => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '8px', cursor: 'pointer', border: 'none', borderRadius: 4, fontFamily: "'Barlow Condensed'", fontWeight: 600, fontSize: '.88rem', background: mode === m ? 'var(--green)' : 'transparent', color: mode === m ? '#000' : 'var(--text-dim)' }}>
              {l}
            </button>
          ))}
        </div>

        <label style={{ fontFamily: "'Barlow Condensed'", fontWeight: 600, fontSize: '.78rem', textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: 5 }}>Usuari</label>
        <input value={user} onChange={e => setUser(e.target.value)} placeholder="El teu nom d'usuari" style={{ width: '100%', marginBottom: 10 }} />

        <label style={{ fontFamily: "'Barlow Condensed'", fontWeight: 600, fontSize: '.78rem', textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: 5 }}>Contrasenya</label>
        <input type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()} placeholder="Contrasenya" style={{ width: '100%', marginBottom: 14 }} />

        {err && <div style={{ color: 'var(--red)', fontSize: '.82rem', marginBottom: 10 }}>{err}</div>}

        {mode === 'register' && (
          <div style={{ background: 'rgba(0,208,75,.08)', border: '1px solid rgba(0,208,75,.2)', borderRadius: 4, padding: '8px 12px', fontSize: '.78rem', color: 'var(--green)', marginBottom: 12 }}>
            🎁 Nou usuari: rebràs <b>100 punts</b> per apostar!
          </div>
        )}

        <button onClick={handle} disabled={loading} style={{ width: '100%', padding: '11px', cursor: 'pointer', border: 'none', borderRadius: 4, fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: '1rem', background: 'var(--green)', color: '#000' }}>
          {loading ? '...' : (mode === 'login' ? 'ENTRAR' : 'REGISTRAR-SE')}
        </button>
      </div>
    </div>
  );
}
