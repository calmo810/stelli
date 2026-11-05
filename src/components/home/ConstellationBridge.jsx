import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LOGO_URL } from '@/components/shared/StelliWordmark';

/* The constellation bridge: problem → fix.
   Each thing that goes wrong when you book through DMs (left) is carried by a
   shooting star along its own constellation to the Stelli feature that fixes it
   (right). Five pairs play in order when the section scrolls into view, then the
   booking button lights. Hover/tap a row to send its star again.
   Phones: panels stack and rows check off in order, no canvas. */

const PAIRS = [
  { pain: 'No prices, just “DM me for rates”', fix: 'A private quote, sent in your messages' },
  { pain: 'Left on seen for three days', fix: 'Every request tracked, never lost in DMs' },
  { pain: 'No contract, just a Venmo request', fix: 'A contract built into every booking' },
  { pain: 'Pay up front and hope they deliver', fix: 'Payment held until your photos arrive' },
  { pain: 'Portfolio link broken, “fixing soon”', fix: 'Vetted creators with real portfolios' },
];

const CSS = `
.cb{--lime:hsl(75 94% 57%);--cyan:hsl(185 94% 57%);--surf:hsl(224 42% 13%);--coral:#ef6b3a;--coral-ink:#c2410c;--paper:#fafaf8;--pline:#e8e8e4;--rowh:46px;--top:200px;--ease:cubic-bezier(.16,1,.3,1);font-family:var(--font-sans)}
.cb-stage{position:relative;display:grid;grid-template-columns:minmax(0,1fr) clamp(130px,17vw,240px) minmax(0,1fr);align-items:start}
.cb-stage canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1}
.cb-panel{position:relative;z-index:2;min-width:0}
.cb-label{display:flex;align-items:center;gap:8px;margin:0 0 12px 4px;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.42);font-weight:600}
.cb-label i{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.3)}
.cb-label.on{color:rgba(255,255,255,.68)}.cb-label.on i{background:var(--lime);box-shadow:0 0 10px var(--lime)}
.cb-browser{border-radius:16px;overflow:hidden;box-shadow:0 30px 70px -30px rgba(0,0,0,.9)}
.cb-chrome{height:34px;display:flex;align-items:center;gap:12px;padding:0 12px}
.cb-dots{display:flex;gap:5px}.cb-dots span{width:9px;height:9px;border-radius:50%}
.cb-url{flex:1;max-width:240px;margin:0 auto;height:20px;border-radius:6px;font-size:10.5px;display:grid;place-items:center}
.cb-top{height:var(--top);padding:16px;display:flex;flex-direction:column;gap:7px;overflow:hidden}
.cb-head{padding:0 16px;height:34px;display:flex;align-items:center;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;font-weight:700}
.cb-rows{padding:2px 8px 12px}
.cb-row{height:var(--rowh);display:flex;align-items:center;gap:10px;padding:0 10px;border-radius:10px;font-size:13.5px;position:relative;transition:background .4s,color .4s;cursor:default;outline:none}
.cb-row:focus-visible{box-shadow:0 0 0 2px var(--lime)}

.cb-old{background:var(--paper);color:#1b1b1f}
.cb-old .cb-chrome{background:#f0f0ee;border-bottom:1px solid var(--pline)}
.cb-old .cb-dots span{background:#d2d2ce}
.cb-old .cb-url{background:#fff;color:#8a8a90;border:1px solid var(--pline)}
.cb-who{display:flex;gap:10px;align-items:center;padding-bottom:9px;border-bottom:1px solid var(--pline);font-size:12.5px;font-weight:600}
.cb-who>span{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#c9c9c4,#e8e8e4)}
.cb-who small{display:block;font-weight:400;color:#9a9aa0;font-size:10.5px}
.cb-b{align-self:flex-end;max-width:80%;background:#3d7bff;color:#fff;padding:6px 11px;border-radius:15px 15px 4px 15px;font-size:12.5px}
.cb-t{align-self:flex-end;font-size:10px;color:#a0a0a6}
.cb-old .cb-head{color:var(--coral-ink);border-top:1px solid var(--pline);background:#fff6f1}
.cb-old .cb-row{color:#3a3a40}
.cb-old .cb-dot{width:8px;height:8px;border-radius:50%;background:var(--coral);flex:none;box-shadow:0 0 0 3px rgba(239,107,58,.15);transition:background .4s,box-shadow .4s}
.cb-txt{position:relative}
.cb-txt svg{position:absolute;left:-2%;top:50%;width:104%;height:10px;transform:translateY(-50%);overflow:visible}
.cb-txt path{fill:none;stroke:#8fb315;stroke-width:2.2;stroke-linecap:round;stroke-dasharray:320;stroke-dashoffset:320;transition:stroke-dashoffset .7s var(--ease)}
.cb-old .cb-row.lit{background:#fff1ea}
.cb-old .cb-row.done{color:#a5a5ab}
.cb-old .cb-row.done .cb-dot{background:#c9c9c4;box-shadow:none}
.cb-old .cb-row.done .cb-txt path{stroke-dashoffset:0}

.cb-new{background:var(--surf);border:1px solid rgba(255,255,255,.08);color:#fff}
.cb-new .cb-chrome{background:rgba(255,255,255,.04);border-bottom:1px solid rgba(255,255,255,.07)}
.cb-new .cb-dots span{background:rgba(255,255,255,.14)}
.cb-new .cb-url{background:rgba(255,255,255,.06);color:rgba(255,255,255,.42)}
.cb-new .cb-top{gap:0}
.cb-prof{display:flex;gap:12px;align-items:center}
.cb-av{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#2ae7f8,#3d7bff);box-shadow:0 0 0 2px var(--surf),0 0 0 3.5px var(--cyan);flex:none}
.cb-prof b{font-size:15px;display:block;font-weight:600}
.cb-prof small{font-size:10.5px;color:var(--cyan);letter-spacing:.14em;text-transform:uppercase;font-weight:600}
.cb-new h3{font-family:var(--font-display);font-weight:500;font-size:21px;line-height:1.12;letter-spacing:-.02em;margin-top:12px}
.cb-new h3 em{color:var(--lime);font-weight:400}
.cb-cta{margin-top:auto;display:block;text-align:center;background:var(--lime);color:hsl(225 50% 8%);font-weight:600;font-size:13.5px;padding:10px;border-radius:999px;transition:box-shadow 1s var(--ease),transform 1s var(--ease)}
.cb-cta.lit{box-shadow:0 0 0 4px hsl(75 94% 57% / .16),0 0 36px hsl(75 94% 57% / .45);transform:translateY(-1px)}
.cb-new .cb-head{color:var(--lime);border-top:1px solid rgba(255,255,255,.07);background:hsl(75 94% 57% / .05)}
.cb-new .cb-row{color:rgba(255,255,255,.42)}
.cb-ck{width:20px;height:20px;border-radius:50%;flex:none;display:grid;place-items:center;border:1.5px solid rgba(255,255,255,.18);transition:background .4s,border-color .4s,transform .5s var(--ease)}
.cb-ck svg{width:12px;height:12px;opacity:0;transform:scale(.4);transition:opacity .3s,transform .5s var(--ease)}
.cb-new .cb-row.lit{background:hsl(75 94% 57% / .07)}
.cb-new .cb-row.done{color:#fff}
.cb-new .cb-row.done .cb-ck{background:var(--lime);border-color:var(--lime)}
.cb-new .cb-row.done .cb-ck svg{opacity:1;transform:none}
.cb-new .cb-row.pop .cb-ck{transform:scale(1.25)}

.cb-tally{display:flex;justify-content:center;align-items:center;gap:18px;flex-wrap:wrap;padding-top:34px;text-align:center}
.cb-tally p{display:inline-flex;align-items:center;gap:.4em;font-size:clamp(17px,2vw,22px);font-weight:500;letter-spacing:-.02em;color:rgba(255,255,255,.68);margin:0}
.cb-tally b{color:#fff;font-weight:600;font-variant-numeric:tabular-nums}
.cb-tally img{height:2em;width:auto;margin-top:-.25em}
.cb-replay{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);color:#fff;font:inherit;font-size:13px;font-weight:600;padding:9px 16px;border-radius:999px;cursor:pointer;display:inline-flex;gap:7px;align-items:center}
.cb-replay:hover{background:rgba(255,255,255,.13)}
.cb-replay svg{width:14px;height:14px}

@media (max-width:820px){
  .cb-stage{grid-template-columns:minmax(0,1fr);gap:18px}
  .cb-gap{display:none}
  .cb-top{height:auto}
}
@media (prefers-reduced-motion:reduce){.cb *,.cb *::before,.cb *::after{transition-duration:.001ms!important}}
`;

const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="hsl(225 50% 8%)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export default function ConstellationBridge() {
  const rootRef = useRef(null);
  const replayRef = useRef(() => {});

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const stage = root.querySelector('.cb-stage');
    const canvas = root.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const painRows = [...root.querySelectorAll('.cb-old .cb-row')];
    const fixRows = [...root.querySelectorAll('.cb-new .cb-row')];
    const cta = root.querySelector('.cb-cta');
    const countEl = root.querySelector('.cb-count');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const LIME = 'rgba(206,252,92,', WHITE = 'rgba(255,255,255,', CORAL = 'rgba(255,140,100,', CYAN = 'rgba(110,236,248,';

    let W = 0, H = 0, stacked = false;
    let paths = [], dust = [], flights = [], sparks = [], ambient = [];
    const fixed = new Set();
    const timers = new Set();
    const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };
    let playing = false, visible = false, last = 0, nextAmbient = 0, raf = 0, alive = true;

    function layout() {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const r = stage.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stacked = window.innerWidth <= 820;
      let seed = 11; const sr = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      const ar = painRows[0].closest('.cb-browser').getBoundingClientRect();
      const br = fixRows[0].closest('.cb-browser').getBoundingClientRect();
      paths = PAIRS.map((_, i) => {
        const a = painRows[i].getBoundingClientRect(), b = fixRows[i].getBoundingClientRect();
        const p0 = { x: ar.right - r.left, y: a.top + a.height / 2 - r.top };
        const p1 = { x: br.left - r.left, y: b.top + b.height / 2 - r.top };
        const n = 4, pts = [p0];
        for (let k = 1; k < n; k++) {
          const t = k / n, lift = (k % 2 ? -1 : 1) * (9 + sr() * 13) * (i % 2 ? -1 : 1);
          pts.push({ x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t + lift, r: 1 + sr() * 0.9 });
        }
        pts.push(p1);
        let len = 0; pts.forEach((p, k) => { p.d = k ? (len += Math.hypot(p.x - pts[k - 1].x, p.y - pts[k - 1].y)) : 0; });
        return { pts, len, drawn: fixed.has(i) ? 1 : 0, glow: 0, hover: false };
      });
      const g0 = ar.right - r.left, g1 = br.left - r.left;
      dust = [];
      if (!stacked) for (let k = 0; k < Math.round(((g1 - g0) * H) / 2200); k++) dust.push({ x: rnd(g0 + 6, g1 - 6), y: rnd(10, H - 10), r: rnd(0.35, 1), a: rnd(0.12, 0.4), tw: rnd(0, 6.3), sp: rnd(0.4, 1.1) });
    }
    const at = (path, d) => {
      const pts = path.pts;
      for (let k = 1; k < pts.length; k++) if (d <= pts[k].d) {
        const a = (d - pts[k - 1].d) / (pts[k].d - pts[k - 1].d || 1);
        return { x: pts[k - 1].x + (pts[k].x - pts[k - 1].x) * a, y: pts[k - 1].y + (pts[k].y - pts[k - 1].y) * a };
      }
      return pts[pts.length - 1];
    };

    const light = (i, on) => { painRows[i].classList.toggle('lit', on); fixRows[i].classList.toggle('lit', on); };
    function burst(p) {
      const cols = [LIME, LIME, WHITE, CYAN];
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2 + rnd(-0.15, 0.15), sp = rnd(50, 95);
        sparks.push({ x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: rnd(0.5, 0.75), c: cols[k % 4] });
      }
      sparks.push({ ring: true, x: p.x, y: p.y, life: 0, max: 0.7 });
    }
    function land(i) {
      const first = !fixed.has(i);
      fixed.add(i);
      if (paths[i]) { paths[i].drawn = 1; paths[i].glow = 1; }
      painRows[i].classList.add('done'); fixRows[i].classList.add('done');
      fixRows[i].classList.add('pop'); later(() => fixRows[i].classList.remove('pop'), 260);
      later(() => light(i, false), 650);
      countEl.textContent = String(fixed.size);
      if (paths[i] && !stacked && !reduced) burst(paths[i].pts[paths[i].pts.length - 1]);
      if (first && fixed.size === PAIRS.length) later(() => cta.classList.add('lit'), 350);
    }
    function send(i) {
      light(i, true);
      if (stacked || reduced) { later(() => land(i), reduced ? 0 : 450); return; }
      flights.push({ i, t: 0, dur: 1.15, trail: [] });
    }
    function play() {
      if (playing) return;
      playing = true;
      PAIRS.forEach((_, i) => later(() => send(i), reduced ? 0 : 300 + i * 950));
      later(() => { playing = false; }, 300 + PAIRS.length * 950 + 1200);
    }
    function reset() {
      timers.forEach(clearTimeout); timers.clear(); playing = false;
      fixed.clear(); countEl.textContent = '0'; cta.classList.remove('lit');
      [...painRows, ...fixRows].forEach((row) => row.classList.remove('done', 'lit', 'pop'));
      paths.forEach((p) => { p.drawn = 0; p.glow = 0; }); flights = []; sparks = [];
    }
    replayRef.current = () => { reset(); later(play, 250); };

    function glint(x, y, s, a) {
      for (const [dx, dy] of [[1, 0], [0, 1]]) {
        const g = ctx.createLinearGradient(x - dx * s, y - dy * s, x + dx * s, y + dy * s);
        g.addColorStop(0, LIME + '0)'); g.addColorStop(0.5, WHITE + a + ')'); g.addColorStop(1, LIME + '0)');
        ctx.strokeStyle = g; ctx.lineWidth = 0.9;
        ctx.beginPath(); ctx.moveTo(x - dx * s, y - dy * s); ctx.lineTo(x + dx * s, y + dy * s); ctx.stroke();
      }
    }
    function drawPath(p, upto, alpha) {
      ctx.lineWidth = 1; ctx.lineCap = 'round';
      for (let k = 1; k < p.pts.length; k++) {
        const a = p.pts[k - 1], b = p.pts[k];
        if (a.d >= upto) break;
        const e = b.d <= upto ? b : at(p, upto);
        const g = ctx.createLinearGradient(a.x, a.y, e.x, e.y);
        g.addColorStop(0, CORAL + alpha * 0.35 * (1 - a.d / p.len) + ')');
        g.addColorStop(1, LIME + alpha * (0.25 + 0.5 * (b.d / p.len)) + ')');
        ctx.strokeStyle = g;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(e.x, e.y); ctx.stroke();
      }
      p.pts.forEach((s, k) => {
        if (!k || k === p.pts.length - 1 || s.d > upto) return;
        ctx.fillStyle = WHITE + Math.min(1, 0.55 * alpha + 0.2) + ')';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      });
    }

    function frame(now) {
      if (!visible || !alive) { last = 0; return; }
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
      ctx.clearRect(0, 0, W, H);
      if (!stacked) {
        for (const s of dust) { s.tw += dt * s.sp; ctx.fillStyle = WHITE + s.a * (0.65 + 0.35 * Math.sin(s.tw)) + ')'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); }
        paths.forEach((p) => { p.glow = Math.max(0, p.glow - dt * 0.8); if (p.drawn) drawPath(p, p.len, 0.55 + p.glow * 0.45 + (p.hover ? 0.4 : 0)); });

        ctx.globalCompositeOperation = 'lighter';
        if (now > nextAmbient && !reduced && paths.length) {
          const gx = paths[0].pts[0].x, gw = paths[0].pts[paths[0].pts.length - 1].x - gx;
          ambient.push({ x: gx + rnd(0, gw * 0.5), y: rnd(-10, H * 0.5), vx: rnd(160, 260), vy: rnd(90, 160), life: 0, max: rnd(0.5, 0.9) });
          nextAmbient = now + rnd(600, 1400);
        }
        for (let k = ambient.length - 1; k >= 0; k--) {
          const m = ambient[k]; m.life += dt; if (m.life > m.max) { ambient.splice(k, 1); continue; }
          m.x += m.vx * dt; m.y += m.vy * dt;
          const f = Math.sin((Math.PI * m.life) / m.max) * 0.35;
          const g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 0.18, m.y - m.vy * 0.18);
          g.addColorStop(0, WHITE + f + ')'); g.addColorStop(1, WHITE + '0)');
          ctx.strokeStyle = g; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.vx * 0.18, m.y - m.vy * 0.18); ctx.stroke();
        }
        for (let k = flights.length - 1; k >= 0; k--) {
          const f = flights[k], p = paths[f.i];
          f.t += dt / f.dur;
          const e = f.t >= 1 ? 1 : 1 - Math.pow(1 - f.t, 2.2);
          const d = e * p.len;
          if (!p.drawn) { ctx.globalCompositeOperation = 'source-over'; drawPath(p, d, 0.8); ctx.globalCompositeOperation = 'lighter'; }
          const h = at(p, d);
          f.trail.push(h); if (f.trail.length > 26) f.trail.shift();
          for (let q = f.trail.length - 1; q > 0; q--) {
            const a = f.trail[q], b = f.trail[q - 1], w = q / f.trail.length;
            ctx.strokeStyle = LIME + 0.85 * w * w + ')'; ctx.lineWidth = 2.2 * w + 0.2;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
          const bl = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, 11);
          bl.addColorStop(0, WHITE + '1)'); bl.addColorStop(0.25, LIME + '.85)'); bl.addColorStop(1, LIME + '0)');
          ctx.fillStyle = bl; ctx.beginPath(); ctx.arc(h.x, h.y, 11, 0, Math.PI * 2); ctx.fill();
          glint(h.x, h.y, 9, 0.5);
          if (f.t >= 1) { flights.splice(k, 1); land(f.i); }
        }
        for (let k = sparks.length - 1; k >= 0; k--) {
          const s = sparks[k]; s.life += dt; if (s.life > s.max) { sparks.splice(k, 1); continue; }
          const q = 1 - s.life / s.max;
          if (s.ring) {
            const o = 1 - Math.pow(q, 3);
            ctx.strokeStyle = LIME + 0.5 * q * q + ')'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(s.x, s.y, 3 + o * 30, 0, Math.PI * 2); ctx.stroke();
            const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 22);
            g.addColorStop(0, WHITE + 0.7 * q * q * q + ')'); g.addColorStop(1, LIME + '0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, 22, 0, Math.PI * 2); ctx.fill();
            continue;
          }
          const drag = Math.pow(0.03, dt); s.vx *= drag; s.vy *= drag; s.x += s.vx * dt; s.y += s.vy * dt;
          ctx.strokeStyle = s.c + 0.9 * q * q + ')'; ctx.lineWidth = 0.6 + q;
          ctx.beginPath(); ctx.moveTo(s.x - s.vx * 0.05, s.y - s.vy * 0.05); ctx.lineTo(s.x, s.y); ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      raf = requestAnimationFrame(frame);
    }

    // Hover, tap or tab onto a problem or a fix to send its star again.
    const offs = [];
    [...painRows, ...fixRows].forEach((row) => {
      const i = +row.dataset.i;
      const go = () => {
        if (paths[i]) paths[i].hover = true;
        if (flights.some((f) => f.i === i)) return;
        if (fixed.has(i)) {
          light(i, true);
          if (!stacked && !reduced) flights.push({ i, t: 0, dur: 0.9, trail: [] });
          else later(() => light(i, false), 600);
        } else if (!playing) send(i);
      };
      const enter = (e) => { if (e.pointerType === 'mouse') go(); };
      const leave = () => { if (paths[i]) paths[i].hover = false; };
      row.addEventListener('pointerenter', enter);
      row.addEventListener('pointerleave', leave);
      row.addEventListener('click', go);
      row.addEventListener('focus', go);
      row.addEventListener('blur', leave);
      offs.push(() => {
        row.removeEventListener('pointerenter', enter); row.removeEventListener('pointerleave', leave);
        row.removeEventListener('click', go); row.removeEventListener('focus', go); row.removeEventListener('blur', leave);
      });
    });

    const onResize = () => layout();
    window.addEventListener('resize', onResize);
    let io;
    const start = () => {
      if (!alive) return;
      layout();
      io = new IntersectionObserver(([en]) => {
        const was = visible; visible = en.isIntersecting;
        if (visible && !was) { layout(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
        if (en.intersectionRatio >= 0.45 && !fixed.size && !playing) play();
      }, { threshold: [0, 0.45] });
      io.observe(stage);
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      if (io) io.disconnect();
      window.removeEventListener('resize', onResize);
      offs.forEach((off) => off());
    };
  }, []);

  return (
    <div className="cb" ref={rootRef}>
      <style>{CSS}</style>
      <div className="cb-stage">
        <canvas aria-hidden="true" />

        <div className="cb-panel">
          <p className="cb-label"><i />Booking through DMs</p>
          <div className="cb-browser cb-old">
            <div className="cb-chrome"><div className="cb-dots"><span /><span /><span /></div><div className="cb-url">social.app/@photos.by.someone</div></div>
            <div className="cb-top">
              <div className="cb-who"><span /><div>photos.by.someone<small>Active 4d ago</small></div></div>
              <div className="cb-b">hi! are you free sat the 14th?</div>
              <div className="cb-b">how much for 2 hrs?</div>
              <div className="cb-t">Seen · 3 days ago</div>
              <div className="cb-b">hello??</div>
            </div>
            <div className="cb-head">What goes wrong</div>
            <div className="cb-rows">
              {PAIRS.map((p, i) => (
                <div className="cb-row" data-i={i} tabIndex={0} key={p.pain}>
                  <span className="cb-dot" />
                  <span className="cb-txt">
                    {p.pain}
                    <svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
                      <path d="M2 6 C 25 3, 50 8, 75 4 S 95 5, 98 5" vectorEffect="non-scaling-stroke" />
                    </svg>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="cb-gap" aria-hidden="true" />

        <div className="cb-panel">
          <p className="cb-label on"><i />Booking through Stelli</p>
          <div className="cb-browser cb-new">
            <div className="cb-chrome"><div className="cb-dots"><span /><span /><span /></div><div className="cb-url">getstelli.com</div></div>
            <div className="cb-top">
              <div className="cb-prof"><span className="cb-av" /><div><b>Maya R.</b><small>Elon · Photographer</small></div></div>
              <h3>You’re the star.<br /><em>We just bring the camera.</em></h3>
              <Link to="/creators" className="cb-cta">Request a date</Link>
            </div>
            <div className="cb-head">What Stelli does</div>
            <div className="cb-rows">
              {PAIRS.map((p, i) => (
                <div className="cb-row" data-i={i} tabIndex={0} key={p.fix}>
                  <span className="cb-ck">{CHECK}</span>
                  <span>{p.fix}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="cb-tally">
        <p><b className="cb-count">0</b> of 5 fixed by <img src={LOGO_URL} alt="Stelli" /></p>
        <button className="cb-replay" type="button" onClick={() => replayRef.current()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>
          Watch again
        </button>
      </div>
    </div>
  );
}
