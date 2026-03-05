// ── Scroll reveal ──
const revealEls = document.querySelectorAll<HTMLElement>('.reveal');
const observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); }
  });
}, { threshold: 0, rootMargin: '0px 0px -60px 0px' });
revealEls.forEach(el => observer.observe(el));

// ── Mobile menu ──
const menuBtn = document.getElementById('menuBtn') as HTMLButtonElement | null;
const navLinks = document.getElementById('navLinks') as HTMLUListElement | null;
menuBtn?.addEventListener('click', () => {
  navLinks?.classList.toggle('open');
});
navLinks?.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ── Nav scroll ──
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar') as HTMLElement | null;
  if (!nav) return;
  nav.style.background = window.scrollY > 40
    ? 'rgba(2,4,8,0.85)'
    : 'rgba(2,4,8,0.6)';
});

// ── Form submit ──
const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement | null;
submitBtn?.addEventListener('click', (e: MouseEvent) => {
  e.preventDefault();
  if (!submitBtn) return;
  submitBtn.textContent = '✓ Message Sent!';
  submitBtn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
  submitBtn.style.boxShadow = '0 0 28px rgba(16,185,129,0.4)';
  setTimeout(() => {
    submitBtn.textContent = 'Send Message →';
    submitBtn.style.background = '';
    submitBtn.style.boxShadow = '';
  }, 3000);
});

// ── Smooth anchor scroll ──
document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e: MouseEvent) => {
    const id = a.getAttribute('href');
    if (!id || id === '#') return;
    const el = document.querySelector(id);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ── Active nav links on scroll ──
const sections = document.querySelectorAll<HTMLElement>('section[id]');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 100) current = s.id;
  });
  document.querySelectorAll<HTMLAnchorElement>('.nav-links a').forEach(a => {
    a.style.color = '';
    if (a.getAttribute('href') === '#' + current) {
      a.style.color = '#fff';
    }
  });
});

// ── Hover-only Neon Glow Border on glass cards ──
(function () {
  const RADIUS   = 18;
  const SPEED    = 0.000245;
  const TAIL_LEN = 0.18;
  const FADE_MS  = 220;

  document.querySelectorAll<HTMLElement>('.glass-card').forEach(card => {
    const cvs = document.createElement('canvas');
    cvs.style.cssText =
      'position:absolute;inset:-1px;width:calc(100% + 2px);height:calc(100% + 2px);' +
      'pointer-events:none;z-index:10;border-radius:inherit;';
    card.appendChild(cvs);

    let raf: number | null = null;
    let hovered  = false;
    let opacity  = 0;
    let pos      = 0;
    let lastTs: number | null = null;

    function buildPath(ctx: CanvasRenderingContext2D, W: number, H: number): void {
      const r = RADIUS;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(W - r, 0);
      ctx.arcTo(W, 0, W, r, r);
      ctx.lineTo(W, H - r);
      ctx.arcTo(W, H, W - r, H, r);
      ctx.lineTo(r, H);
      ctx.arcTo(0, H, 0, H - r, r);
      ctx.lineTo(0, r);
      ctx.arcTo(0, 0, r, 0, r);
      ctx.closePath();
    }

    function perimToXY(d: number, W: number, H: number): { x: number; y: number } {
      const r      = RADIUS;
      const arcLen = 0.5 * Math.PI * r;
      const segs   = [W-2*r, arcLen, H-2*r, arcLen, W-2*r, arcLen, H-2*r, arcLen];
      let acc = 0;
      for (let i = 0; i < segs.length; i++) {
        if (d <= acc + segs[i] + 1e-9) {
          const f = Math.min((d - acc) / segs[i], 1);
          switch (i) {
            case 0: return { x: r + f*(W-2*r),       y: 0 };
            case 1: { const a=-Math.PI/2+f*Math.PI/2; return { x:W-r+Math.cos(a)*r, y:r+Math.sin(a)*r }; }
            case 2: return { x: W,                     y: r + f*(H-2*r) };
            case 3: { const a=f*Math.PI/2;             return { x:W-r+Math.cos(a)*r, y:H-r+Math.sin(a)*r }; }
            case 4: return { x: W-r-f*(W-2*r),        y: H };
            case 5: { const a=Math.PI/2+f*Math.PI/2;  return { x:r+Math.cos(a)*r,   y:H-r+Math.sin(a)*r }; }
            case 6: return { x: 0,                     y: H-r-f*(H-2*r) };
            case 7: { const a=Math.PI+f*Math.PI/2;    return { x:r+Math.cos(a)*r,   y:r+Math.sin(a)*r }; }
          }
        }
        acc += segs[i];
      }
      return { x: r, y: 0 };
    }

    function render(ts: number): void {
      if (lastTs === null) lastTs = ts;
      const dt = ts - lastTs;
      lastTs = ts;

      const step = dt / FADE_MS;
      opacity = hovered
        ? Math.min(1, opacity + step)
        : Math.max(0, opacity - step);

      if (opacity > 0) pos = (pos + SPEED * dt) % 1;

      const W = cvs.offsetWidth;
      const H = cvs.offsetHeight;
      if (cvs.width !== W || cvs.height !== H) { cvs.width = W; cvs.height = H; }

      const ctx = cvs.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      if (opacity > 0) {
        const perim = 2*(W-2*RADIUS + H-2*RADIUS) + 2*Math.PI*RADIUS;

        ctx.save();
        const pad = 18;
        const r2  = RADIUS + pad;
        ctx.beginPath();
        ctx.moveTo(r2, -pad);
        ctx.lineTo(W-r2, -pad);
        ctx.arcTo(W+pad, -pad, W+pad, r2, r2);
        ctx.lineTo(W+pad, H-r2);
        ctx.arcTo(W+pad, H+pad, W-r2, H+pad, r2);
        ctx.lineTo(r2, H+pad);
        ctx.arcTo(-pad, H+pad, -pad, H-r2, r2);
        ctx.lineTo(-pad, r2);
        ctx.arcTo(-pad, -pad, r2, -pad, r2);
        ctx.closePath();

        const shrink = 5;
        const ri = Math.max(1, RADIUS - shrink);
        ctx.moveTo(ri, shrink);
        ctx.lineTo(W-ri, shrink);
        ctx.arcTo(W-shrink, shrink, W-shrink, ri, ri);
        ctx.lineTo(W-shrink, H-ri);
        ctx.arcTo(W-shrink, H-shrink, W-ri, H-shrink, ri);
        ctx.lineTo(ri, H-shrink);
        ctx.arcTo(shrink, H-shrink, shrink, H-ri, ri);
        ctx.lineTo(shrink, ri);
        ctx.arcTo(shrink, shrink, ri, shrink, ri);
        ctx.closePath();
        ctx.clip('evenodd');

        const STEPS = 64;
        // Pass 1: wide outer bloom
        for (let s = 0; s < STEPS; s++) {
          const frac  = s / STEPS;
          const tDist = ((pos - frac * TAIL_LEN + 1) % 1) * perim;
          const pt    = perimToXY(tDist, W, H);
          const alpha = (1 - frac) * (1 - frac) * opacity;
          const bloomR = 28 + (1 - frac) * 18;
          const bg = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, bloomR);
          bg.addColorStop(0,    `rgba(60,160,255,${(alpha * 0.55).toFixed(3)})`);
          bg.addColorStop(0.35, `rgba(20,90,255,${(alpha * 0.28).toFixed(3)})`);
          bg.addColorStop(0.7,  `rgba(0,50,200,${(alpha * 0.10).toFixed(3)})`);
          bg.addColorStop(1,    'rgba(0,20,120,0)');
          ctx.fillStyle = bg;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, bloomR, 0, Math.PI * 2);
          ctx.fill();
        }

        // Pass 2: tight bright neon core
        for (let s = 0; s < STEPS; s++) {
          const frac  = s / STEPS;
          const tDist = ((pos - frac * TAIL_LEN + 1) % 1) * perim;
          const pt    = perimToXY(tDist, W, H);
          const alpha = (1 - frac) * (1 - frac) * opacity;
          const coreR = 7 + (1 - frac) * 6;
          const cg = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, coreR);
          cg.addColorStop(0,    `rgba(255,255,255,${(alpha * 1.00).toFixed(3)})`);
          cg.addColorStop(0.15, `rgba(200,240,255,${(alpha * 0.95).toFixed(3)})`);
          cg.addColorStop(0.35, `rgba(80,180,255,${(alpha * 0.85).toFixed(3)})`);
          cg.addColorStop(0.65, `rgba(30,110,255,${(alpha * 0.55).toFixed(3)})`);
          cg.addColorStop(1,    'rgba(0,60,200,0)');
          ctx.fillStyle = cg;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, coreR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      if (opacity > 0 || hovered) {
        raf = requestAnimationFrame(render);
      } else {
        raf = null;
        lastTs = null;
      }
    }

    function startLoop(): void {
      if (!raf) {
        lastTs = null;
        raf = requestAnimationFrame(render);
      }
    }

    card.addEventListener('mouseenter', () => { hovered = true; startLoop(); });
    card.addEventListener('mouseleave', () => { hovered = false; });
  });
})();
