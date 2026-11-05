/**
 * The curved wall of prints on a creator's public page.
 *
 * Prints sit on a true drum (a circle seen from inside), so spacing along the
 * curve stays even; rows drift slowly in opposite directions, ease to a stop
 * on hover or grab, can be flung, and rise out of the dark when they appear.
 * Plain DOM + one animation frame loop, so it stays smooth with any portfolio.
 */

export const CURVES = { flat: 0, soft: 0.5, full: 1 };
export const MATS = { paper: '#f2f1ec', sky: '#cfe6fb', blush: '#fbdde4', lilac: '#e2defa', mint: '#dcf5dc', ink: '#1b2238' };
const MIXED = ['#cfe6fb', '#fbdde4', '#e2defa', '#dcf5dc', '#f6e7cf'];
const DRIFT = [-10, 7.5, -12]; // px per second
const easeOut = (x) => 1 - Math.pow(1 - x, 3);

export function matFor(i, mat) {
  return mat === 'mixed' || !MATS[mat] ? MIXED[i % MIXED.length] : MATS[mat];
}
export function inkFor(hex) {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 110 ? '#ffffff' : '#141824';
}
export function printClass(settings) {
  return `pw-print ${settings.frame === 'bleed' ? 'pw-bleed' : 'pw-mat'}${settings.captions ? '' : ' pw-nocap'}`;
}

/** Row height for a given wall width: big on desktop, still readable on a phone. */
export function rowHeightFor(width, compact) {
  if (compact) return Math.max(92, Math.min(150, width * 0.2));
  // Three rows plus room for shadows should fit a laptop screen without scrolling.
  const byHeight = typeof window !== 'undefined' ? window.innerHeight * 0.235 : 236;
  return Math.max(138, Math.min(236, width * 0.2, byHeight));
}

function dress(el, photo, i, settings, label) {
  const mat = matFor(i, settings.mat);
  el.className = `pw-card ${printClass(settings)}`;
  el.style.setProperty('--mat', mat);
  el.style.setProperty('--matInk', inkFor(mat));

  const ph = document.createElement('div');
  ph.className = 'pw-ph';
  if (photo.src) {
    const img = document.createElement('img');
    img.src = photo.src;
    img.alt = '';
    img.draggable = false;
    img.decoding = 'async';
    ph.appendChild(img);
  } else if (photo.bg) {
    ph.style.background = photo.bg;
  }
  el.appendChild(ph);

  const lab = document.createElement('div');
  lab.className = 'pw-lab';
  const { title, meta } = label(i);
  const b = document.createElement('b');
  b.textContent = title;
  const span = document.createElement('span');
  span.textContent = meta;
  lab.append(b, span);
  el.appendChild(lab);

  const gloss = document.createElement('div');
  gloss.className = 'pw-gloss';
  const shade = document.createElement('div');
  shade.className = 'pw-shade';
  el.append(gloss, shade);
}

function orderFor(r, n) {
  // Each row starts at a different point in the set, so neighbours differ row to row.
  const base = [...Array(n).keys()];
  const shift = Math.round((r * n) / 3) + r;
  return base.map((_, k) => base[(k * (n > 4 ? 3 : 1) + shift) % n]);
}

export function createWall({ wall, rowsEl, photos, settings, label, onOpen, compact = false }) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let rows = [];
  let vw = 0;
  let rowH = 230;
  let cardW = 184;
  let gap = 16;
  let built = 0;
  let raf = 0;
  let onScreen = true;

  function build() {
    rowsEl.textContent = '';
    const n = photos.length;
    if (!n) return;
    const single = settings.layout === 'strip' || (compact && n < 4);
    const rowCount = single ? 1 : 3;
    vw = wall.clientWidth;
    rowH = rowHeightFor(vw, compact) * (single ? 1.45 : 1);
    cardW = rowH * 0.8;
    gap = rowH * 0.075;
    const rowStep = rowH + gap * 1.7;
    // Room above and below for the prints' shadows and the hover lift.
    const pad = Math.max(compact ? 34 : 64, rowH * 0.42);
    wall.style.height = `${Math.round((rowCount - 1) * rowStep + rowH + pad * 2)}px`;
    wall.style.setProperty('--row', `${rowH}px`);
    built = performance.now();

    rows = [...Array(rowCount)].map((_, r) => {
      const order = orderFor(r, n);
      const items = [];
      let width = 0;
      while (width < vw * 2.4 + cardW * 4) {
        for (const i of order) {
          items.push({ i, base: width, h: 0 });
          width += cardW + gap;
        }
      }
      for (const it of items) {
        const el = document.createElement('div');
        el.style.height = `${rowH}px`;
        el.style.width = `${cardW}px`;
        el.style.marginLeft = `${-cardW / 2}px`;
        el.style.marginTop = `${-rowH / 2}px`;
        el.style.opacity = '0';
        dress(el, photos[it.i], it.i, settings, label);
        el.style.setProperty('--row', `${rowH}px`);
        el.dataset.i = String(it.i);
        rowsEl.appendChild(el);
        it.el = el;
      }
      const y = rowCount === 1 ? 0 : (r - 1) * rowStep;
      return { items, width, offset: -width / 4 + r * cardW * 0.5, y };
    });
  }

  let vel = 0;
  let dragging = false;
  let lastX = 0;
  let lastMoveT = 0;
  let moved = 0;
  let hover = false;
  let lastT = 0;
  let nudge = 0;
  let drift = 1;
  let hovEl = null;
  let hovAny = 0;

  function render(now) {
    raf = requestAnimationFrame(render);
    const dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0;
    lastT = now;
    if (!onScreen || !rows.length) return;

    if (!dragging) {
      vel *= Math.pow(0.05, dt);
      if (Math.abs(nudge) > 0.3) {
        const s = nudge * Math.min(1, dt * 7);
        nudge -= s;
        vel = 0;
        rows.forEach((row) => (row.offset += s));
      }
    }
    drift += ((reduced || hover || dragging ? 0 : 1) - drift) * Math.min(1, dt * 2.5);
    hovAny += ((hovEl ? 1 : 0) - hovAny) * Math.min(1, dt * 8);
    const half = vw / 2;
    const c = CURVES[settings.curve] ?? 0.5;
    const single = rows.length === 1;
    const maxA = (single ? 0.62 : 0.8) * c;
    const R = maxA > 0.01 ? half / Math.sin(maxA) : 0;
    const k = Math.min(1, dt * 10);

    rows.forEach((row, r) => {
      if (!dragging) row.offset += (DRIFT[r] * drift + vel * (1 + r * 0.08)) * dt;
      for (const it of row.items) {
        let s = (((it.base + row.offset) % row.width) + row.width) % row.width;
        if (s > row.width / 2) s -= row.width;
        s += cardW / 2;
        if (Math.abs(s) > half * 1.25 + cardW || (R && Math.abs(s / R) > 1.45)) {
          if (it.vis !== false) {
            it.el.style.visibility = 'hidden';
            it.vis = false;
          }
          continue;
        }
        if (it.vis === false) {
          it.el.style.visibility = 'visible';
          it.vis = true;
        }
        let x = s;
        let z = 0;
        let th = 0;
        if (R) {
          th = s / R;
          x = R * Math.sin(th);
          z = -R * (1 - Math.cos(th));
        }
        it.h += ((it.el === hovEl ? 1 : 0) - it.h) * k;
        const e = reduced ? 1 : easeOut(Math.min(1, Math.max(0, (now - built - Math.abs(s) * 0.35 - r * 70) / 950)));
        const zz = z + it.h * 46 - (1 - e) * 260;
        const yy = row.y + (1 - e) * 26;
        const sc = 1 + it.h * 0.03;
        it.el.style.transform = `translate3d(${x.toFixed(2)}px, ${yy.toFixed(2)}px, ${zz.toFixed(2)}px) rotateY(${(th * 57.2958).toFixed(3)}deg) scale(${sc.toFixed(4)})`;
        it.el.style.opacity = e.toFixed(3);
        const turn = Math.min(1, Math.abs(th) / 1.1);
        const dim = Math.min(0.6, turn * turn * 0.8 + hovAny * (1 - it.h) * 0.16);
        const nearEdge = (dim * 0.4).toFixed(3);
        const farEdge = (dim * 1.1).toFixed(3);
        it.el.style.setProperty('--sl', th > 0 ? nearEdge : farEdge);
        it.el.style.setProperty('--sr', th > 0 ? farEdge : nearEdge);
        it.el.style.setProperty('--gx', `${(50 + th * 70).toFixed(1)}%`);
        it.el.style.setProperty('--hv', it.h.toFixed(3));
      }
    });
  }

  const step = () => cardW + gap;
  const cardAt = (x, y) => document.elementFromPoint(x, y)?.closest('.pw-card') || null;

  const onDown = (e) => {
    if (e.target.closest('.pw-round')) return;
    dragging = true;
    moved = 0;
    lastX = e.clientX;
    lastMoveT = performance.now();
    vel = 0;
    nudge = 0;
    wall.setPointerCapture?.(e.pointerId);
    wall.classList.add('is-dragging');
  };
  const onMove = (e) => {
    if (!dragging) {
      if (e.pointerType === 'mouse') hovEl = cardAt(e.clientX, e.clientY);
      return;
    }
    const t = performance.now();
    const dx = e.clientX - lastX;
    const dtm = Math.max(8, t - lastMoveT) / 1000;
    lastX = e.clientX;
    lastMoveT = t;
    moved += Math.abs(dx);
    rows.forEach((row, r) => (row.offset += dx * (1 + r * 0.08)));
    vel = vel * 0.5 + (dx / dtm) * 0.5;
    hovEl = null;
  };
  const onUp = (e) => {
    if (!dragging) return;
    dragging = false;
    wall.classList.remove('is-dragging');
    if (performance.now() - lastMoveT > 90) vel = 0;
    vel = Math.max(-2600, Math.min(2600, vel));
    if (moved < 6) {
      wall.releasePointerCapture?.(e.pointerId);
      const el = cardAt(e.clientX, e.clientY);
      if (el) onOpen?.(Number(el.dataset.i), el);
    }
  };
  const onCancel = () => {
    dragging = false;
    wall.classList.remove('is-dragging');
  };
  const onEnter = (e) => {
    if (e.pointerType === 'mouse') hover = true;
  };
  const onLeave = () => {
    hover = false;
    hovEl = null;
  };
  const onWheel = (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // vertical scroll keeps scrolling the page
    e.preventDefault();
    nudge -= e.deltaX * 1.2;
  };
  const onKey = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nudge += step();
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nudge -= step();
    }
  };

  wall.addEventListener('pointerdown', onDown);
  wall.addEventListener('pointermove', onMove);
  wall.addEventListener('pointerup', onUp);
  wall.addEventListener('pointercancel', onCancel);
  wall.addEventListener('pointerenter', onEnter);
  wall.addEventListener('pointerleave', onLeave);
  wall.addEventListener('wheel', onWheel, { passive: false });
  wall.addEventListener('keydown', onKey);

  let lastW = 0;
  let rt = 0;
  const ro = new ResizeObserver(() => {
    const w = wall.clientWidth;
    if (Math.abs(w - lastW) < 2) return;
    lastW = w;
    clearTimeout(rt);
    rt = setTimeout(build, rows.length ? 150 : 0);
  });
  ro.observe(wall);
  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
  });
  io.observe(wall);

  lastW = wall.clientWidth;
  build();
  raf = requestAnimationFrame(render);

  return {
    prev: () => (nudge += step()),
    next: () => (nudge -= step()),
    destroy() {
      cancelAnimationFrame(raf);
      clearTimeout(rt);
      ro.disconnect();
      io.disconnect();
      wall.removeEventListener('pointerdown', onDown);
      wall.removeEventListener('pointermove', onMove);
      wall.removeEventListener('pointerup', onUp);
      wall.removeEventListener('pointercancel', onCancel);
      wall.removeEventListener('pointerenter', onEnter);
      wall.removeEventListener('pointerleave', onLeave);
      wall.removeEventListener('wheel', onWheel);
      wall.removeEventListener('keydown', onKey);
      rowsEl.textContent = '';
    },
  };
}
