export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@300;400;500&display=swap');
:root{--green:#00d04b;--bg:#0d1117;--bg2:#161b22;--bg3:#1f2937;--bg4:#252d3a;--border:#2a3441;--text:#e6edf3;--text-dim:#8b949e;--text-muted:#4a5568;--gold:#f0b400;--red:#f85149;--accent:#1a8cff;--purple:#a855f7}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Barlow',sans-serif;background:var(--bg);color:var(--text)}
select{background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--text);padding:6px 10px;font-family:'Barlow Condensed';font-size:.88rem;outline:none;cursor:pointer;width:100%}
select:focus{border-color:var(--green)} select option{background:var(--bg2)}
input{background:var(--bg);border:1px solid var(--border);border-radius:4px;color:var(--text);padding:8px 12px;font-family:'Barlow Condensed';font-size:.93rem;outline:none}
input:focus{border-color:var(--green)}
input[type=range]{background:transparent;border:none;padding:0;cursor:pointer;width:100%;accent-color:var(--green)}
input[type=password],input[type=number]{background:var(--bg);border:1px solid var(--border);border-radius:4px;color:var(--text);padding:8px 12px;font-family:'Barlow Condensed';font-size:.93rem;outline:none}
input[type=password]:focus,input[type=number]:focus{border-color:var(--green)}
button{transition:all .15s}
@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
@keyframes tick{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes spin{to{transform:rotate(360deg)}}
.fade{animation:fadeIn .2s ease}
.slot-row{border-bottom:1px solid var(--border);transition:background .15s}
.slot-row:hover{background:rgba(26,140,255,.04)}
.slot-row:last-child{border-bottom:none}
.accordio-header{cursor:pointer;user-select:none;display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--bg4);border-bottom:1px solid var(--border);transition:background .15s}
.accordio-header:hover{background:#2a3441}
.cat-tab{cursor:pointer;border:none;background:none;font-family:'Barlow Condensed';font-weight:700;font-size:.82rem;padding:7px 14px;border-radius:4px;transition:all .15s;letter-spacing:.5px}
.special-card{background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:12px 14px;margin-bottom:8px;cursor:pointer;transition:all .15s}
.special-card:hover{border-color:rgba(26,140,255,.4);background:rgba(26,140,255,.04)}
.special-card.selected{border-color:var(--green);background:rgba(0,208,75,.06)}
@media(max-width:768px){.ml{grid-template-columns:1fr!important}.rp{position:static!important;height:auto!important}}
`;