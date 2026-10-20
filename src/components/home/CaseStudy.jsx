import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/* Homepage "how it works" section, told as a case study:
   the old way (an illustrative, fictional social profile) vs. the Stelli way.
   Background is transparent so it sits on the page's ink navy with no seams. */

const RISE = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.12 },
  transition: { duration: 0.8, ease: [0.2, 0.8, 0.2, 1] },
};

const ROWS = [
  { stage: 'Booking', was: 'Left on seen.', now: 'Pick a creator. Send a date.' },
  { stage: 'Pricing', was: '“DM for rates.”', now: 'A quote you approve before you pay.' },
  { stage: 'Contract', was: 'A handshake.', now: 'Built into every booking.' },
  { stage: 'Payment', was: 'Pay and hope.', now: 'Held until your photos arrive.' },
  { stage: 'Delivery', was: '“Sending them soon.”', now: 'Photos in 2–3 days. Edits within a week.' },
];

const CSS = `
.cs{position:relative}
.cs-stage{position:relative;display:grid;grid-template-columns:1fr 150px 1fr;align-items:center;perspective:2200px}
.cs-rig{position:relative;transform-style:preserve-3d}
.cs-rig--l{transform:rotateY(16deg) rotateX(4deg) rotateZ(-1deg)}
.cs-rig--r{transform:rotateY(-16deg) rotateX(4deg) rotateZ(1deg)}
.cs-float{animation:csFloat 7s ease-in-out infinite}
.cs-rig--r .cs-float{animation-delay:-3.5s}
@keyframes csFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
.cs-rig::after{content:"";position:absolute;left:10%;right:10%;bottom:-64px;height:40px;border-radius:50%;
  background:radial-gradient(closest-side,rgba(0,0,0,.7),transparent);filter:blur(8px);animation:csShadow 7s ease-in-out infinite}
.cs-rig--r::before{content:"";position:absolute;left:5%;right:5%;bottom:-40px;height:60px;border-radius:50%;
  background:radial-gradient(closest-side,hsl(var(--neon-lime)/.16),transparent);filter:blur(14px)}
.cs-rig--r::after{animation-delay:-3.5s}
@keyframes csShadow{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.88);opacity:.65}}

.cs-label{display:flex;align-items:center;gap:10px;margin:0 0 16px 6px}
.cs-label i{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.3)}
.cs-rig--r .cs-label i{background:hsl(var(--neon-lime));box-shadow:0 0 18px hsl(var(--neon-lime))}

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
.cs-note{position:absolute;font-family:var(--font-mono);font-size:10px;letter-spacing:.06em;background:#fff;color:#c2410c;border:1px solid #f2d3c4;padding:5px 8px;border-radius:6px;box-shadow:0 8px 20px -8px rgba(0,0,0,.35);white-space:nowrap}
.cs-note::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:#ef6b3a;margin-right:6px;vertical-align:1px}

.cs-new{height:100%;color:#fff;padding:18px 22px;position:relative;overflow:hidden;font-family:var(--font-body)}
.cs-new::before{content:"";position:absolute;width:420px;height:420px;right:-160px;top:-180px;border-radius:50%;background:radial-gradient(closest-side,hsl(var(--neon-lime)/.16),transparent)}
.cs-nav{display:flex;align-items:center;justify-content:space-between;position:relative}
.cs-logo{font-family:var(--font-display);font-size:19px}.cs-logo span{color:hsl(var(--neon-lime))}
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
.cs-check::before{content:"";width:14px;height:14px;border-radius:50%;background:hsl(var(--neon-lime)) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4 8.5l2.5 2.5L12 5.5' stroke='%230a0f1e' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/10px no-repeat}
.cs-proof{display:flex;gap:18px;margin-top:16px;font-family:var(--font-mono);font-size:10px;color:rgba(255,255,255,.4);letter-spacing:.06em;position:relative}
.cs-proof b{color:#fff;font-weight:500}

.cs-bridge{position:relative;height:520px;display:flex;align-items:center;justify-content:center}
.cs-bridge canvas{position:absolute;top:0;bottom:0;left:-90px;width:calc(100% + 180px);height:100%}
.cs-arrow{position:relative;z-index:2;font-family:var(--font-mono);font-size:10px;letter-spacing:.18em;background:hsl(var(--neon-lime));color:hsl(var(--ink));padding:7px 11px;border-radius:999px;box-shadow:0 0 30px hsl(var(--neon-lime)/.35)}

.cs-table{border:1px solid rgba(255,255,255,.09);border-radius:24px;overflow:hidden;
  background:linear-gradient(145deg,rgba(255,255,255,.025),transparent 45%),hsl(var(--surface))}
.cs-row{display:grid;grid-template-columns:150px 1fr 1fr;gap:20px;align-items:center;padding:24px 32px;border-bottom:1px solid rgba(255,255,255,.06)}
.cs-row:last-child{border-bottom:none}
.cs-row--head{padding:16px 32px;background:rgba(255,255,255,.02)}
.cs-was{color:rgba(255,255,255,.35);text-decoration:line-through;text-decoration-color:rgba(255,255,255,.2)}
.cs-now{color:#fff;font-weight:500;display:flex;align-items:center;gap:12px}
.cs-now::before{content:"";flex:none;width:7px;height:7px;border-radius:50%;background:hsl(var(--neon-lime));box-shadow:0 0 14px hsl(var(--neon-lime))}
.cs-ml{display:none}

@media (max-width:1100px){
  .cs-stage{grid-template-columns:1fr;perspective:1600px;max-width:640px;margin:0 auto}
  .cs-rig--l{transform:rotateX(6deg) rotateZ(-1.5deg)}
  .cs-rig--r{transform:rotateX(6deg) rotateZ(1.5deg)}
  .cs-bridge{height:150px}
  .cs-bridge canvas{left:0;width:100%}
  .cs-arrow{transform:rotate(90deg)}
}
@media (max-width:700px){
  .cs-row--head{display:none}
  .cs-row{grid-template-columns:1fr;gap:8px;padding:20px}
  .cs-ml{display:inline;margin-right:8px;text-decoration:none}
}
@media (max-width:560px){
  .cs-old{grid-template-columns:1fr}.cs-dms{display:none}
  .cs-vp{height:420px}
  .cs-book{grid-template-columns:1fr}.cs-creator{min-height:110px}
  .cs-note{display:none}
  .cs-links span:not(.cs-pill){display:none}
}
@media (prefers-reduced-motion:reduce){
  .cs-float,.cs-rig::after,.cs-typing span{animation:none!important}
}
`;

function Flow() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return undefined;
    const ctx = c.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const LANES = 4;
    let W = 0, H = 0, vertical = false, raf = 0;

    const size = () => {
      const r = c.getBoundingClientRect();
      const d = window.devicePixelRatio || 1;
      W = r.width; H = r.height;
      c.width = W * d; c.height = H * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      vertical = window.innerWidth <= 1100;
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
      const spread = vertical ? W * 0.8 : H * 0.85;
      const chaos = p.off * spread * (1 - ease) + Math.sin(p.wob + t * 14) * 26 * (1 - ease);
      const gap = vertical ? W * 0.09 : H * 0.07;
      const across = chaos + (p.lane - (LANES - 1) / 2) * gap * ease;
      return vertical ? [W / 2 + across, t * H] : [t * W, H / 2 + across];
    };

    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < LANES; i++) {
        const g = i - (LANES - 1) / 2;
        ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1; ctx.beginPath();
        if (vertical) { const x = W / 2 + g * W * 0.09; ctx.moveTo(x, H * 0.6); ctx.lineTo(x, H); }
        else { const y = H / 2 + g * H * 0.07; ctx.moveTo(W * 0.6, y); ctx.lineTo(W, y); }
        ctx.stroke();
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
      if (!reduced) raf = requestAnimationFrame(frame);
    };

    size();
    frame();
    window.addEventListener('resize', size);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', size); };
  }, []);
  return <canvas ref={ref} />;
}

export default function CaseStudy() {
  return (
    <section
      id="how-it-works"
      className="cs relative w-[calc(100%-28px)] md:w-[min(1380px,calc(100%-48px))] mx-auto py-[60px] md:py-[100px]"
    >
      <style>{CSS}</style>

      {/* Header */}
      <motion.div {...RISE} className="flex items-center justify-center gap-3 mb-5 label-mono text-[10px] text-white/45">
        <span className="w-[6px] h-[6px] rounded-full bg-neon-lime shadow-[0_0_18px_hsl(var(--neon-lime))]" />
        <span>how it works</span>
        <span className="w-[6px] h-[6px] rounded-full bg-neon-lime shadow-[0_0_18px_hsl(var(--neon-lime))]" />
      </motion.div>

      <motion.h2
        {...RISE}
        className="max-w-[980px] mx-auto text-center font-display font-normal text-white"
        style={{ fontSize: 'clamp(38px, 6.4vw, 88px)', lineHeight: 0.95, letterSpacing: '-0.03em' }}
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

      {/* Floating screens */}
      <motion.div {...RISE} className="cs-stage mt-[60px] md:mt-[90px]" aria-label="The old way compared with the Stelli way">
        <div className="cs-rig cs-rig--l">
          <div className="cs-float">
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
          <div className="cs-float">
            <p className="cs-label label-mono text-[10px] text-white/70"><i />The Stelli way</p>
            <div className="cs-browser cs-browser--new">
              <div className="cs-chrome"><div className="cs-dots"><span /><span /><span /></div><div className="cs-url">🔒 getstelli.com</div></div>
              <div className="cs-vp">
                <div className="cs-new">
                  <nav className="cs-nav">
                    <div className="cs-logo">stelli<span>.</span></div>
                    <div className="cs-links"><span>Creators</span><span>How it works</span><span className="cs-pill">Book</span></div>
                  </nav>
                  <p className="cs-kick">NEW YORK · BOOKING CONFIRMED</p>
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

      {/* Side by side */}
      <div className="max-w-[980px] mx-auto mt-[120px] md:mt-[160px]">
        <motion.div {...RISE} className="text-center mb-10 md:mb-12">
          <p className="label-mono text-[10px] text-white/45">side by side</p>
          <h3
            className="mt-4 font-display font-normal text-white"
            style={{ fontSize: 'clamp(30px, 4.5vw, 52px)', lineHeight: 1, letterSpacing: '-0.02em' }}
          >
            What actually changes.
          </h3>
        </motion.div>

        <motion.div {...RISE} className="cs-table" role="table">
          <div className="cs-row cs-row--head label-mono text-[10px] text-white/35" role="row">
            <span />
            <span>The old way</span>
            <span className="text-neon-lime">With Stelli</span>
          </div>
          {ROWS.map((r) => (
            <div key={r.stage} className="cs-row font-body text-[15px]" role="row">
              <span className="label-mono text-[10px] text-white/45">{r.stage}</span>
              <span className="cs-was"><span className="cs-ml label-mono text-[9px] text-white/30">before</span>{r.was}</span>
              <span className="cs-now">{r.now}</span>
            </div>
          ))}
        </motion.div>

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
