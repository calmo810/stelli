import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LOGO_URL } from '@/components/shared/StelliWordmark';

/* Homepage "how it works" section, told as a case study:
   the old way (an illustrative, fictional social profile) vs. the Stelli way.
   Desktop: two floating browser screens. Phones/tablets: two phone mockups side by side.
   Background is transparent so it sits on the page's ink navy with no seams. */

const RISE = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.12 },
  transition: { duration: 0.8, ease: [0.2, 0.8, 0.2, 1] },
};

const STEPS = [
  { n: '01', step: 'Request', was: 'Left on seen.', now: 'Pick a creator. Send a date.' },
  { n: '02', step: 'Quote', was: '“DM for rates.”', now: 'Approve the price before you pay.' },
  { n: '03', step: 'Book', was: 'A handshake. Pay and hope.', now: 'Contract built in. Payment held.' },
  { n: '04', step: 'Photos', was: '“Sending them soon.”', now: 'In 2–3 days. Edits within a week.' },
];

const PHONE_W = 200;
const PHONE_H = 432;

const CSS = `
.cs{position:relative}

/* ---------- desktop: floating browsers ---------- */
.cs-stage{position:relative;display:grid;grid-template-columns:1fr 150px 1fr;align-items:center;perspective:2200px}
.cs-rig{position:relative;transform-style:preserve-3d}
.cs-rig--l{transform:rotateY(16deg) rotateX(4deg) rotateZ(-1deg)}
.cs-rig--r{transform:rotateY(-16deg) rotateX(4deg) rotateZ(1deg)}
.cs-float{animation:csFloat 7s ease-in-out infinite;will-change:transform;backface-visibility:hidden}
.cs-delay{animation-delay:-3.5s}
@keyframes csFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
.cs-shadow{position:relative}
.cs-shadow::after{content:"";position:absolute;left:10%;right:10%;bottom:-64px;height:40px;border-radius:50%;
  background:radial-gradient(closest-side,rgba(0,0,0,.55),transparent);pointer-events:none}
.cs-go{cursor:pointer;outline:none}
.cs-go .cs-browser,.cs-go .cs-phone{transition:box-shadow .3s ease,transform .3s ease}
.cs-go:hover .cs-browser--new,.cs-go:focus-visible .cs-browser--new{box-shadow:0 0 0 1px hsl(var(--neon-lime)/.6),0 30px 60px -12px rgba(0,0,0,.6),0 80px 140px -40px rgba(0,0,0,.8)}
.cs-go:hover .cs-phone--new,.cs-go:focus-visible .cs-phone--new{box-shadow:inset 0 0 0 1px hsl(var(--neon-lime)/.7),0 30px 50px -14px rgba(0,0,0,.7),0 60px 90px -30px rgba(0,0,0,.8)}
.cs-go-hint{display:inline-flex;align-items:center;gap:6px;margin-top:14px;font-family:var(--font-mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:hsl(var(--neon-lime));opacity:.75;transition:opacity .3s}
.cs-go:hover .cs-go-hint{opacity:1}

.cs-label{display:flex;align-items:center;gap:10px;margin:0 0 16px 6px}
.cs-label i{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.3);flex:none}
.cs-label--on i{background:hsl(var(--neon-lime));box-shadow:0 0 18px hsl(var(--neon-lime))}

.cs-browser{border-radius:14px;overflow:hidden;
  box-shadow:0 0 0 1px rgba(255,255,255,.06),0 30px 60px -12px rgba(0,0,0,.6),0 80px 140px -40px rgba(0,0,0,.8)}
.cs-browser--old{background:#fff;filter:saturate(.85) brightness(.92)}
.cs-chrome{display:flex;align-items:center;gap:12px;height:38px;padding:0 14px;background:#f1f1ef;border-bottom:1px solid #e2e2df}
.cs-dots{display:flex;gap:6px}.cs-dots span{width:10px;height:10px;border-radius:50%;background:#d3d3cf}
.cs-url{flex:1;max-width:320px;margin:0 auto;height:22px;border-radius:6px;background:#fff;border:1px solid #e4e4e0;display:flex;align-items:center;justify-content:center;font-size:11px;color:#8a8a90}
.cs-browser--new{background:hsl(var(--ink));box-shadow:0 0 0 1px hsl(var(--neon-lime)/.18),0 30px 60px -12px rgba(0,0,0,.6),0 80px 140px -40px rgba(0,0,0,.8)}
.cs-browser--new .cs-chrome{background:hsl(var(--surface));border-color:rgba(255,255,255,.06)}
.cs-browser--new .cs-dots span{background:rgba(255,255,255,.14)}
.cs-browser--new .cs-url{background:hsl(var(--ink));border-color:rgba(255,255,255,.08);color:rgba(255,255,255,.45)}
.cs-vp{height:470px;overflow:hidden;position:relative}

.cs-old{display:grid;grid-template-columns:1fr 210px;height:100%;font-size:12px;background:#fff;color:#111;font-family:var(--font-body)}
.cs-feed{padding:18px 18px 0;border-right:1px solid #efefed;overflow:hidden}
.cs-prof{display:flex;gap:16px;align-items:center}
.cs-av{width:62px;height:62px;border-radius:50%;flex:none;padding:2px;background:conic-gradient(#e9b19a,#d97aa3,#b29be0,#e9b19a)}
.cs-av div{width:100%;height:100%;border-radius:50%;border:2px solid #fff;background:linear-gradient(140deg,#c9b8a6,#7d6a5c)}
.cs-handle{font-weight:600;font-size:14px}
.cs-stats{display:flex;gap:14px;margin-top:6px;color:#55555c}.cs-stats b{color:#111;font-weight:600}
.cs-bio{margin-top:12px;line-height:1.45;color:#333}.cs-bio .m{color:#8a8a90}
.cs-tabs{display:flex;justify-content:center;gap:26px;margin:14px -18px 0;border-top:1px solid #efefed;padding:8px 0;font-size:10px;letter-spacing:.12em;color:#8a8a90}
.cs-tabs b{color:#111;font-weight:600}
.cs-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;margin:0 -18px}
.cs-grid div{aspect-ratio:1;position:relative}
.cs-grid div:nth-child(1){background:linear-gradient(160deg,#e8c9a4,#a46b4c)}
.cs-grid div:nth-child(2){background:linear-gradient(200deg,#9fb6c9,#4b5e75)}
.cs-grid div:nth-child(3){background:#f3f3f1;display:flex;align-items:center;justify-content:center;color:#b0b0aa;font-size:10px}
.cs-grid div:nth-child(4){background:linear-gradient(120deg,#2d2b33,#6c5a6e)}
.cs-grid div:nth-child(5){background:linear-gradient(180deg,#f1d9b8,#d6905c)}
.cs-grid div:nth-child(6){background:linear-gradient(150deg,#b8c4a6,#5f6e4e)}
.cs-grid div:nth-child(7){background:linear-gradient(200deg,#d4b5c8,#7a5a72)}
.cs-grid div:nth-child(8){background:linear-gradient(140deg,#cfd6dd,#8d9aa6)}
.cs-grid div:nth-child(9){background:linear-gradient(170deg,#e0c08e,#8c6a3b)}
.cs-grid .t{position:absolute;left:5px;bottom:5px;font-size:9px;color:#fff;background:rgba(0,0,0,.35);padding:2px 5px;border-radius:4px}
.cs-dms{display:flex;flex-direction:column;background:#fafaf9}
.cs-dms h4{padding:14px 14px 10px;font-size:13px;font-weight:600;border-bottom:1px solid #efefed;margin:0}
.cs-thread{flex:1;padding:12px;display:flex;flex-direction:column;gap:8px}
.cs-bub{max-width:85%;padding:8px 11px;border-radius:16px;border-bottom-right-radius:5px;line-height:1.35;background:#3d7bff;color:#fff;align-self:flex-end}
.cs-seen{align-self:flex-end;font-size:10px;color:#9a9aa0}
.cs-typing{align-self:flex-start;display:flex;gap:3px;padding:10px 12px;background:#ececea;border-radius:16px;opacity:.6}
.cs-typing span{width:5px;height:5px;border-radius:50%;background:#8a8a90;animation:csBlink 1.4s infinite}
.cs-typing span:nth-child(2){animation-delay:.2s}.cs-typing span:nth-child(3){animation-delay:.4s}
@keyframes csBlink{0%,60%,100%{opacity:.3}30%{opacity:1}}
.cs-note{position:absolute;font-family:var(--font-mono);font-size:10px;letter-spacing:.06em;background:#fff;color:#c2410c;border:1px solid #f2d3c4;padding:5px 8px;border-radius:6px;box-shadow:0 8px 20px -8px rgba(0,0,0,.35);white-space:nowrap;z-index:3}
.cs-note::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:#ef6b3a;margin-right:6px;vertical-align:1px}

.cs-new{height:100%;color:#fff;padding:18px 22px;position:relative;overflow:hidden;font-family:var(--font-body)}
.cs-new::before{content:"";position:absolute;width:420px;height:420px;right:-160px;top:-180px;border-radius:50%;background:radial-gradient(closest-side,hsl(var(--neon-lime)/.16),transparent)}
.cs-nav{display:flex;align-items:center;justify-content:space-between;position:relative}
.cs-logo{display:block;height:24px;width:auto}
.cs-links{display:flex;gap:16px;font-size:11px;color:rgba(255,255,255,.5);align-items:center}
.cs-pill{background:hsl(var(--neon-lime));color:hsl(var(--ink));padding:6px 12px;border-radius:999px;font-weight:600}
.cs-kick{margin-top:26px;font-family:var(--font-mono);font-size:10px;letter-spacing:.16em;color:hsl(var(--neon-cyan));position:relative}
.cs-h1{margin-top:8px;font-family:var(--font-display);font-size:32px;line-height:1.02;letter-spacing:-.02em;position:relative}
.cs-h1 em{color:hsl(var(--neon-lime))}
.cs-book{margin-top:20px;display:grid;grid-template-columns:150px 1fr;gap:14px;background:hsl(var(--surface));border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:12px;position:relative}
.cs-creator{border-radius:10px;overflow:hidden;background:linear-gradient(165deg,#d9c3a5,#8a6a52 60%,#3b2c27);position:relative;min-height:160px}
.cs-creator .tag{position:absolute;left:8px;bottom:8px;font-size:10px;background:rgba(10,15,30,.7);backdrop-filter:blur(6px);padding:4px 7px;border-radius:6px}
.cs-creator .star{color:hsl(var(--neon-magenta))}
.cs-steps{display:flex;flex-direction:column;gap:8px;font-size:12px}
.cs-step{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 11px;border-radius:9px;background:hsl(var(--ink));border:1px solid rgba(255,255,255,.06)}
.cs-step .k{color:rgba(255,255,255,.5)}.cs-step .v{font-weight:500}
.cs-check{display:inline-flex;align-items:center;gap:6px;color:hsl(var(--neon-lime));font-family:var(--font-mono);font-size:10px;letter-spacing:.08em}
.cs-check::before{content:"";flex:none;width:14px;height:14px;border-radius:50%;background:hsl(var(--neon-lime)) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4 8.5l2.5 2.5L12 5.5' stroke='%230a0f1e' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/10px no-repeat}
.cs-proof{display:flex;gap:18px;margin-top:16px;font-family:var(--font-mono);font-size:10px;color:rgba(255,255,255,.4);letter-spacing:.06em;position:relative}
.cs-proof b{color:#fff;font-weight:500}

.cs-bridge{position:relative;height:520px;display:flex;align-items:center;justify-content:center}
.cs-bridge canvas{position:absolute;top:0;bottom:0;left:-90px;width:calc(100% + 180px);height:100%}
.cs-arrow{position:relative;z-index:2;font-family:var(--font-mono);font-size:10px;letter-spacing:.18em;background:hsl(var(--neon-lime));color:hsl(var(--ink));padding:7px 11px;border-radius:999px;box-shadow:0 0 30px hsl(var(--neon-lime)/.35)}

/* ---------- phones/tablets: two phones side by side ---------- */
.cs-phones{display:none;position:relative;grid-template-columns:1fr 1fr;gap:14px;max-width:620px;margin:0 auto;padding-bottom:48px}
.cs-pcol{position:relative;min-width:0}
.cs-pcol .cs-label{margin:0 0 12px 2px;justify-content:center}
.cs-tilt-l{transform:rotate(-2.5deg)}
.cs-tilt-r{transform:rotate(2.5deg) translateY(18px)}
.cs-pfit{width:100%;height:calc(var(--s,.8) * ${PHONE_H}px);display:flex;justify-content:center}
.cs-phone{flex:none;width:${PHONE_W}px;height:${PHONE_H}px;transform:scale(var(--s,.8));transform-origin:top center;
  border-radius:32px;padding:6px;background:#1c2233;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.12),0 30px 50px -14px rgba(0,0,0,.7),0 60px 90px -30px rgba(0,0,0,.8)}
.cs-phone--new{box-shadow:inset 0 0 0 1px hsl(var(--neon-lime)/.35),0 30px 50px -14px rgba(0,0,0,.7),0 60px 90px -30px rgba(0,0,0,.8)}
.cs-screen{position:relative;width:100%;height:100%;border-radius:26px;overflow:hidden;font-family:var(--font-body)}
.cs-notch{position:absolute;top:7px;left:50%;transform:translateX(-50%);width:62px;height:17px;border-radius:999px;background:#05070d;z-index:4}
.cs-sbar{height:30px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;font-size:10px;font-weight:600}

.cs-po{background:#fff;color:#111;filter:saturate(.85) brightness(.94)}
.cs-po .cs-sbar{color:#111}
.cs-po-body{padding:2px 12px 0}
.cs-po-handle{font-size:12px;font-weight:600;display:flex;justify-content:space-between}
.cs-po-prof{display:flex;align-items:center;gap:10px;margin-top:8px}
.cs-po-prof .cs-av{width:42px;height:42px}
.cs-po-stats{display:flex;gap:10px;font-size:9px;color:#55555c}.cs-po-stats b{display:block;color:#111;font-size:11px}
.cs-po-bio{margin-top:7px;font-size:10px;line-height:1.35;color:#333}.cs-po-bio .m{color:#9a9aa0}
.cs-po .cs-grid{margin:8px -12px 0}
.cs-po-dm{position:absolute;left:0;right:0;bottom:0;padding:9px 10px 12px;background:#fafaf9;border-top:1px solid #ececea;display:flex;flex-direction:column;gap:5px;border-radius:16px 16px 0 0;box-shadow:0 -10px 24px -10px rgba(0,0,0,.2)}
.cs-po-dm h5{margin:0 0 2px;font-size:10px;font-weight:600}
.cs-po-dm .cs-bub{font-size:10px;padding:6px 9px}
.cs-po-dm .cs-seen{font-size:8.5px}
.cs-pnote{position:absolute;z-index:3;font-family:var(--font-mono);font-size:10.5px;letter-spacing:.04em;background:#fff;color:#c2410c;border:1px solid #f2d3c4;padding:4px 7px;border-radius:6px;box-shadow:0 6px 14px -6px rgba(0,0,0,.4);white-space:nowrap}
.cs-pnote::before{content:"";display:inline-block;width:5px;height:5px;border-radius:50%;background:#ef6b3a;margin-right:5px;vertical-align:1px}

.cs-pn{background:hsl(var(--ink));color:#fff}
.cs-pn::before{content:"";position:absolute;width:260px;height:260px;right:-120px;top:-110px;border-radius:50%;background:radial-gradient(closest-side,hsl(var(--neon-lime)/.18),transparent)}
.cs-pn-body{position:relative;padding:4px 12px 0}
.cs-pn-nav{display:flex;align-items:center;justify-content:space-between}
.cs-pn-nav .cs-logo{height:19px}
.cs-pn-nav .cs-pill{font-size:9px;padding:4px 9px}
.cs-pn .cs-kick{margin-top:12px;font-size:8px}
.cs-pn-card{margin-top:8px;height:118px;border-radius:12px;position:relative;overflow:hidden;background:linear-gradient(165deg,#d9c3a5,#8a6a52 60%,#3b2c27)}
.cs-pn-card .tag{position:absolute;left:7px;bottom:7px;font-size:9px;background:rgba(10,15,30,.7);backdrop-filter:blur(6px);padding:3px 6px;border-radius:5px}
.cs-pn-card .star{color:hsl(var(--neon-magenta))}
.cs-pn-rows{margin-top:8px;display:flex;flex-direction:column;gap:5px}
.cs-pn-rows .cs-step{padding:7px 9px;border-radius:8px;font-size:10px;background:hsl(var(--surface))}
.cs-pn-rows .cs-check{font-size:8.5px;gap:4px}
.cs-pn-rows .cs-check::before{width:11px;height:11px;background-size:8px}
.cs-pn-cta{margin-top:9px;text-align:center;background:hsl(var(--neon-lime));color:hsl(var(--ink));border-radius:999px;padding:8px;font-size:10px;font-weight:600}

.cs-pswap{position:absolute;left:50%;top:calc(50% - 10px);transform:translate(-50%,-50%);z-index:5;width:34px;height:34px;border-radius:50%;
  display:grid;place-items:center;background:hsl(var(--neon-lime));color:hsl(var(--ink));font-size:15px;font-weight:700;
  box-shadow:0 0 0 5px hsl(var(--ink)),0 0 30px hsl(var(--neon-lime)/.5)}

/* ---------- steps table ---------- */
.cs-table{border:1px solid rgba(255,255,255,.09);border-radius:24px;overflow:hidden;
  background:linear-gradient(145deg,rgba(255,255,255,.025),transparent 45%),hsl(var(--surface))}
.cs-row{display:grid;grid-template-columns:150px 1fr 1fr;gap:20px;align-items:center;padding:24px 32px;border-bottom:1px solid rgba(255,255,255,.06)}
.cs-row:last-child{border-bottom:none}
.cs-row--head{padding:16px 32px;background:rgba(255,255,255,.02)}
.cs-num{display:flex;align-items:baseline;gap:12px}
.cs-num b{font-family:var(--font-display);font-style:italic;font-weight:400;font-size:22px;color:hsl(var(--neon-lime));letter-spacing:0}
.cs-was{color:rgba(255,255,255,.35);text-decoration:line-through;text-decoration-color:rgba(255,255,255,.2)}
.cs-now{color:#fff;font-weight:500;display:flex;align-items:center;gap:12px}
.cs-now::before{content:"";flex:none;width:7px;height:7px;border-radius:50%;background:hsl(var(--neon-lime));box-shadow:0 0 14px hsl(var(--neon-lime))}
.cs-ml{display:none}

@media (max-width:1100px){
  .cs-stage{display:none}
  .cs-phones{display:grid}
}
@media (max-width:700px){
  .cs-row--head{display:none}
  .cs-row{grid-template-columns:1fr;gap:8px;padding:20px}
  .cs-ml{display:inline;margin-right:8px;text-decoration:none}
}
@media (prefers-reduced-motion:reduce){
  .cs-float,.cs-typing span{animation:none!important}
}
`;

/* Particle stream between the desktop browsers. Pauses when off screen. */
function Flow() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return undefined;
    const ctx = c.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const LANES = 4;
    let W = 0, H = 0, raf = 0, visible = false;

    const size = () => {
      const r = c.getBoundingClientRect();
      const d = window.devicePixelRatio || 1;
      W = r.width; H = r.height;
      c.width = Math.max(1, W * d); c.height = Math.max(1, H * d);
      ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    const spawn = (p) => Object.assign(p, {
      t: Math.random() * -1,
      speed: 0.0035 + Math.random() * 0.003,
      lane: Math.floor(Math.random() * LANES),
      off: Math.random() - 0.5,
      wob: Math.random() * Math.PI * 2,
    });
    const parts = Array.from({ length: 90 }, () => spawn({}));
    if (reduced) parts.forEach((p, i) => { p.t = i / parts.length; });

    const pos = (p) => {
      const t = Math.max(0, Math.min(1, p.t));
      const ease = t * t * (3 - 2 * t);
      const chaos = p.off * H * 0.85 * (1 - ease) + Math.sin(p.wob + t * 14) * 26 * (1 - ease);
      const across = chaos + (p.lane - (LANES - 1) / 2) * H * 0.07 * ease;
      return [t * W, H / 2 + across];
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < LANES; i++) {
        const y = H / 2 + (i - (LANES - 1) / 2) * H * 0.07;
        ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(W * 0.6, y); ctx.lineTo(W, y); ctx.stroke();
      }
      for (const p of parts) {
        if (!reduced) p.t += p.speed;
        if (p.t > 1.05) spawn(p);
        if (p.t < 0) continue;
        const [x, y] = pos(p);
        const t = Math.min(p.t, 1);
        const fade = Math.min(1, t * 6, (1.05 - t) * 12);
        if (t < 0.55) {
          ctx.fillStyle = `rgba(255,255,255,${0.35 * fade})`;
          ctx.save(); ctx.translate(x, y); ctx.rotate(p.wob + t * 8); ctx.fillRect(-3, -1.5, 6, 3); ctx.restore();
        } else {
          ctx.fillStyle = `rgba(196,248,42,${fade})`;
          ctx.shadowColor = 'rgba(196,248,42,.8)'; ctx.shadowBlur = 8;
          ctx.beginPath(); ctx.arc(x, y, 2.4, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    };
    const loop = () => {
      draw();
      if (visible && !reduced) raf = requestAnimationFrame(loop);
    };

    // Only animate while the canvas is on screen (it has no box on phones, so it never runs there).
    const io = new IntersectionObserver(([entry]) => {
      const now = entry.isIntersecting && entry.boundingClientRect.width > 0;
      if (now && !visible) { visible = true; size(); cancelAnimationFrame(raf); loop(); }
      else if (!now) { visible = false; cancelAnimationFrame(raf); }
    });
    io.observe(c);
    const onResize = () => { if (visible) size(); };
    window.addEventListener('resize', onResize);
    return () => { io.disconnect(); cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);
  return <canvas ref={ref} />;
}

/* Makes the Stelli mockup act like a real link to the creators page. */
function useGoProps() {
  const navigate = useNavigate();
  const go = () => navigate('/creators');
  return {
    role: 'link',
    tabIndex: 0,
    'aria-label': 'Browse creators',
    onClick: go,
    onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } },
  };
}

/* Two phone mockups that scale to fit their columns. */
function Phones() {
  const goProps = useGoProps();
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const fit = () => {
      const w = el.getBoundingClientRect().width;
      if (!w) return;
      const col = (w - 14) / 2;
      el.style.setProperty('--s', String(Math.min(col / PHONE_W, 1.3)));
    };
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    fit();
    return () => ro.disconnect();
  }, []);

  return (
    <motion.div {...RISE} ref={ref} className="cs-phones" aria-label="The old way compared with the Stelli way">
      <div className="cs-pcol">
        <p className="cs-label label-mono text-[9px] text-white/45"><i />The old way</p>
        <div className="cs-tilt-l">
          <div className="cs-float cs-shadow">
            <div className="cs-pfit">
              <div className="cs-phone">
                <div className="cs-screen cs-po">
                  <span className="cs-notch" />
                  <div className="cs-sbar"><span>9:41</span><span>●●●</span></div>
                  <div className="cs-po-body">
                    <div className="cs-po-handle"><span>photos.by.someone</span><span>···</span></div>
                    <div className="cs-po-prof">
                      <div className="cs-av"><div /></div>
                      <div className="cs-po-stats"><span><b>412</b>posts</span><span><b>3.1k</b>followers</span></div>
                    </div>
                    <p className="cs-po-bio">events, portraits, whatever 📷<br />Rates? DM me<br /><span className="m">link broken, fixing soon</span></p>
                    <div className="cs-grid">
                      <div><span className="t">2023</span></div><div /><div>no image</div>
                      <div /><div /><div />
                    </div>
                  </div>
                  <div className="cs-po-dm">
                    <h5>Messages</h5>
                    <div className="cs-bub">are you free sat?</div>
                    <div className="cs-bub">how much for 2 hrs?</div>
                    <div className="cs-seen">Seen · 3 days ago</div>
                    <div className="cs-bub">hello??</div>
                  </div>
                  <span className="cs-pnote" style={{ right: 8, top: 112 }}>No pricing</span>
                  <span className="cs-pnote" style={{ left: 10, bottom: 92 }}>Left on seen</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <span className="cs-pswap" aria-hidden>→</span>

      <div className="cs-pcol">
        <p className="cs-label cs-label--on label-mono text-[9px] text-white/70"><i />The Stelli way</p>
        <div className="cs-tilt-r">
          <div className="cs-float cs-shadow cs-delay cs-go" {...goProps}>
            <div className="cs-pfit">
              <div className="cs-phone cs-phone--new">
                <div className="cs-screen cs-pn">
                  <span className="cs-notch" />
                  <div className="cs-sbar" style={{ position: 'relative' }}><span>9:41</span><span>●●●</span></div>
                  <div className="cs-pn-body">
                    <div className="cs-pn-nav">
                      <img src={LOGO_URL} alt="Stelli" className="cs-logo" />
                      <span className="cs-pill">Book</span>
                    </div>
                    <p className="cs-kick">BOOKING CONFIRMED</p>
                    <div className="cs-pn-card"><span className="tag">Maya R. · <span className="star">★</span> 4.9</span></div>
                    <div className="cs-pn-rows">
                      <div className="cs-step"><span className="k">Quote approved</span><span className="v">$450</span></div>
                      <div className="cs-step"><span className="k">Contract</span><span className="cs-check">SIGNED</span></div>
                      <div className="cs-step"><span className="k">Payment</span><span className="cs-check">HELD</span></div>
                    </div>
                    <div className="cs-pn-cta">Photos in 2–3 days</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function CaseStudy() {
  const goProps = useGoProps();
  return (
    <section
      id="how-it-works"
      className="cs relative w-[calc(100%-28px)] md:w-[min(1380px,calc(100%-48px))] mx-auto py-[60px] md:py-[100px]"
    >
      <style>{CSS}</style>

      {/* Header */}
      <motion.div {...RISE} className="flex items-center justify-center gap-3 mb-5 label-mono text-[10px] text-white/45">
        <span className="w-[6px] h-[6px] rounded-full bg-neon-lime shadow-[0_0_18px_hsl(var(--neon-lime))]" />
        <span>the Stelli way</span>
        <span className="w-[6px] h-[6px] rounded-full bg-neon-lime shadow-[0_0_18px_hsl(var(--neon-lime))]" />
      </motion.div>

      <motion.h2
        {...RISE}
        className="max-w-[980px] mx-auto text-center font-display font-normal text-white"
        style={{ fontSize: 'clamp(36px, 6.4vw, 88px)', lineHeight: 0.95, letterSpacing: '-0.03em' }}
      >
        From <em className="text-white/45">“wait, are you free?”</em>
        <br />
        to{' '}
        <span className="relative inline-block italic text-ink px-[.24em] pb-[.07em] ml-[.08em]" style={{ transform: 'rotate(-1.7deg)' }}>
          <span
            aria-hidden
            className="absolute -z-10"
            style={{
              inset: '-.02em -.08em -.02em',
              background: 'hsl(var(--neon-lime))',
              borderRadius: '.14em .11em .16em .08em',
              transform: 'skewX(-4deg)',
            }}
          />
          it’s handled.
        </span>
      </motion.h2>

      <motion.p
        {...RISE}
        className="max-w-[470px] mx-auto mt-6 text-center font-body text-[14px] md:text-[16px] leading-[1.6] text-white/45"
      >
        Great photos. Terrible booking experiences. We built Stelli to change that.
      </motion.p>

      <div className="mt-[48px] md:mt-[90px]">
        {/* Desktop: floating browsers */}
        <motion.div {...RISE} className="cs-stage" aria-label="The old way compared with the Stelli way">
          <div className="cs-rig cs-rig--l">
            <div className="cs-float cs-shadow">
              <p className="cs-label label-mono text-[10px] text-white/45"><i />The old way</p>
              <div className="cs-browser cs-browser--old">
                <div className="cs-chrome"><div className="cs-dots"><span /><span /><span /></div><div className="cs-url">social.app/@photos.by.someone</div></div>
                <div className="cs-vp">
                  <div className="cs-old">
                    <div className="cs-feed">
                      <div className="cs-prof">
                        <div className="cs-av"><div /></div>
                        <div>
                          <div className="cs-handle">photos.by.someone</div>
                          <div className="cs-stats"><span><b>412</b> posts</span><span><b>3.1k</b> followers</span></div>
                        </div>
                      </div>
                      <p className="cs-bio">NYC photographer · events, portraits, whatever 📷<br />Rates? DM me<br /><span className="m">portfolio link broken, fixing soon</span></p>
                      <div className="cs-tabs"><b>POSTS</b><span>REELS</span><span>TAGGED</span></div>
                      <div className="cs-grid">
                        <div><span className="t">2023</span></div><div /><div>no image</div>
                        <div /><div><span className="t">meme</span></div><div />
                        <div /><div /><div />
                      </div>
                    </div>
                    <aside className="cs-dms">
                      <h4>Messages</h4>
                      <div className="cs-thread">
                        <div className="cs-bub">hi! are you free sat the 14th?</div>
                        <div className="cs-bub">how much for 2 hrs?</div>
                        <div className="cs-seen">Seen · 3 days ago</div>
                        <div className="cs-bub">hello??</div>
                        <div className="cs-bub">event is in 2 days 😭</div>
                        <div className="cs-typing"><span /><span /><span /></div>
                      </div>
                    </aside>
                  </div>
                  <span className="cs-note" style={{ left: 18, top: 150 }}>No pricing</span>
                  <span className="cs-note" style={{ right: 24, top: 236 }}>Left on seen</span>
                  <span className="cs-note" style={{ left: 120, bottom: 24 }}>No contract</span>
                </div>
              </div>
            </div>
          </div>

          <div className="cs-bridge" aria-hidden>
            <Flow />
            <span className="cs-arrow">STELLI →</span>
          </div>

          <div className="cs-rig cs-rig--r">
            <div className="cs-float cs-shadow cs-delay cs-go" {...goProps}>
              <p className="cs-label cs-label--on label-mono text-[10px] text-white/70"><i />The Stelli way</p>
              <div className="cs-browser cs-browser--new">
                <div className="cs-chrome"><div className="cs-dots"><span /><span /><span /></div><div className="cs-url">🔒 getstelli.com</div></div>
                <div className="cs-vp">
                  <div className="cs-new">
                    <nav className="cs-nav">
                      <img src={LOGO_URL} alt="Stelli" className="cs-logo" />
                      <div className="cs-links"><span>Creators</span><span>How it works</span><span className="cs-pill">Book</span></div>
                    </nav>
                    <p className="cs-kick">ELON · BOOKING CONFIRMED</p>
                    <h3 className="cs-h1">You’re the star.<br /><em>We just bring the camera.</em></h3>
                    <div className="cs-book">
                      <div className="cs-creator"><span className="tag">Maya R. · <span className="star">★</span> 4.9</span></div>
                      <div className="cs-steps">
                        <div className="cs-step"><span className="k">Booking</span><span className="cs-check">CONFIRMED</span></div>
                        <div className="cs-step"><span className="k">Quote · approved upfront</span><span className="v">$450</span></div>
                        <div className="cs-step"><span className="k">Contract</span><span className="cs-check">SIGNED</span></div>
                        <div className="cs-step"><span className="k">Payment held until delivery</span><span className="cs-check">SECURE</span></div>
                      </div>
                    </div>
                    <div className="cs-proof"><span><b>Sat 14</b> · 2 hrs</span><span>Photos in <b>2–3 days</b></span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Phones and tablets: two phones side by side */}
        <Phones />
      </div>

      {/* How it works: four steps, each one fixing a pain */}
      <div className="max-w-[980px] mx-auto mt-[90px] md:mt-[150px]">
        <motion.div {...RISE} className="text-center mb-10 md:mb-12">
          <p className="label-mono text-[10px] text-white/45">how it works</p>
          <h3
            className="mt-4 font-display font-normal text-white"
            style={{ fontSize: 'clamp(30px, 4.5vw, 52px)', lineHeight: 1, letterSpacing: '-0.02em' }}
          >
            Four steps. That’s it.
          </h3>
        </motion.div>

        <motion.ol {...RISE} className="cs-table m-0 p-0 list-none">
          <li className="cs-row cs-row--head label-mono text-[10px] text-white/35" aria-hidden>
            <span>Step</span>
            <span>The old way</span>
            <span className="text-neon-lime">With Stelli</span>
          </li>
          {STEPS.map((r) => (
            <li key={r.step} className="cs-row font-body text-[15px]">
              <span className="cs-num"><b>{r.n}</b><span className="label-mono text-[10px] text-white/60">{r.step}</span></span>
              <span className="cs-was"><span className="cs-ml label-mono text-[9px] text-white/30">before</span>{r.was}</span>
              <span className="cs-now">{r.now}</span>
            </li>
          ))}
        </motion.ol>

        <motion.div {...RISE} className="flex flex-col items-center gap-7 mt-12">
          <Link
            to="/creators"
            className="inline-flex items-center justify-center rounded-full px-8 py-4 label-mono text-[11px] font-semibold transition-transform duration-300 hover:-translate-y-0.5"
            style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', boxShadow: '0 0 40px hsl(var(--neon-lime) / .25)' }}
          >
            Book a creator →
          </Link>
          <div className="flex items-center justify-center gap-3 label-mono text-[10px] text-white/30 text-center">
            <span className="w-[28px] h-px bg-white/10" />
            <span>you bring the moment · we bring the camera</span>
            <span className="w-[28px] h-px bg-white/10" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}