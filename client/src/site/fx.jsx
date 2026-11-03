import { useEffect, useRef, useState } from 'react';
import { gsap, useGSAP, tone, reduceMotion } from './motion.js';

/* slow green blobs; their colour eases toward the tone of the section in view */
const TONES = [
  [[15, 59, 44], [47, 158, 110], [10, 30, 24]],
  [[12, 40, 32], [30, 110, 80], [8, 22, 18]],
  [[18, 70, 52], [70, 190, 135], [9, 30, 26]],
  [[10, 48, 46], [40, 150, 140], [6, 24, 24]],
  [[20, 80, 58], [90, 210, 150], [12, 44, 34]],
];
const BLOBS = [
  { x: 0.18, y: 0.18, r: 0.55, s: 0.00011, c: 0, a: 0.55 },
  { x: 0.82, y: 0.32, r: 0.48, s: 0.00015, c: 1, a: 0.28 },
  { x: 0.5, y: 0.85, r: 0.62, s: 0.00009, c: 2, a: 0.6 },
  { x: 0.9, y: 0.9, r: 0.35, s: 0.00019, c: 1, a: 0.2 },
];

export function Aurora() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current, ctx = cv.getContext('2d');
    const cur = TONES[0].map((c) => c.slice());
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W, H, raf, mx = 0.5, my = 0.5;
    const size = () => {
      W = innerWidth; H = innerHeight;
      cv.width = (W * dpr) / 2; cv.height = (H * dpr) / 2;
      ctx.setTransform(dpr / 2, 0, 0, dpr / 2, 0, 0);
    };
    const move = (e) => { mx = e.clientX / W; my = e.clientY / H; };
    const draw = (t) => {
      const target = TONES[tone.current] || TONES[0];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cur[i][j] += (target[i][j] - cur[i][j]) * 0.03;
      ctx.fillStyle = '#070B09';
      ctx.fillRect(0, 0, W, H);
      BLOBS.forEach((b, i) => {
        // blobs drift on their own and lean slightly toward the pointer
        const x = (b.x + Math.sin(t * b.s + i) * 0.12 + (mx - 0.5) * 0.06 * (i + 1)) * W;
        const y = (b.y + Math.cos(t * b.s * 1.3 + i * 2) * 0.1 + (my - 0.5) * 0.05 * (i + 1)) * H;
        const r = b.r * Math.max(W, H), c = cur[b.c];
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${c.map(Math.round).join(',')},${b.a})`);
        g.addColorStop(1, 'rgba(7,11,9,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      });
      if (!reduceMotion()) raf = requestAnimationFrame(draw);
    };
    size();
    addEventListener('resize', size);
    addEventListener('pointermove', move, { passive: true });
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', size); removeEventListener('pointermove', move); };
  }, []);
  return <canvas id="aurora" ref={ref} aria-hidden="true" />;
}

/* thin bar at the very top that fills with page progress */
export function Progress() {
  const ref = useRef(null);
  useGSAP(() => {
    gsap.fromTo(ref.current, { scaleX: 0 }, {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: document.documentElement, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
    });
  });
  return <div className="progress" ref={ref} aria-hidden="true" />;
}

/* dot + trailing ring; the ring swells over anything clickable */
export function Cursor() {
  const dot = useRef(null), ring = useRef(null), label = useRef(null);
  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches || reduceMotion()) return;
    document.documentElement.classList.add('has-cursor');
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.08 }), dy = gsap.quickTo(dot.current, 'y', { duration: 0.08 });
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.45, ease: 'power3' }), ry = gsap.quickTo(ring.current, 'y', { duration: 0.45, ease: 'power3' });
    const move = (e) => {
      document.documentElement.classList.add('cursor-on');
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    };
    const over = (e) => {
      const hit = e.target.closest('a, button, [data-cursor]');
      ring.current.classList.toggle('hover', !!hit);
      const text = hit?.dataset.cursor || '';
      label.current.textContent = text;
      ring.current.classList.toggle('labeled', !!text);
    };
    const down = () => ring.current.classList.add('down'), up = () => ring.current.classList.remove('down');
    addEventListener('pointermove', move, { passive: true });
    addEventListener('pointerover', over);
    addEventListener('pointerdown', down);
    addEventListener('pointerup', up);
    return () => {
      document.documentElement.classList.remove('has-cursor', 'cursor-on');
      removeEventListener('pointermove', move); removeEventListener('pointerover', over);
      removeEventListener('pointerdown', down); removeEventListener('pointerup', up);
    };
  }, []);
  return (
    <>
      <div className="cursor-dot" ref={dot} aria-hidden="true" />
      <div className="cursor-ring" ref={ring} aria-hidden="true"><span ref={label} /></div>
    </>
  );
}

/* buttons lean toward the pointer while it is near them */
export function Magnetic({ children, strength = 0.35 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !matchMedia('(pointer: fine)').matches || reduceMotion()) return;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const move = (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * strength);
      yTo((e.clientY - r.top - r.height / 2) * strength);
    };
    const leave = () => { xTo(0); yTo(0); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, [strength]);
  return <span className="magnetic" ref={ref}>{children}</span>;
}

/* intro screen: counts to 100 while content loads, then lifts away like a curtain */
export function Preloader({ ready, name, onDone }) {
  const root = useRef(null), num = useRef(null);
  const [gone, setGone] = useState(false);
  const counter = useRef({ v: 0 });

  useGSAP(() => {
    gsap.to(counter.current, {
      v: 82, duration: 1.4, ease: 'power2.out',
      onUpdate: () => { num.current.textContent = String(Math.round(counter.current.v)).padStart(3, '0'); },
    });
  }, { scope: root });

  useGSAP(() => {
    if (!ready) return;
    const tl = gsap.timeline({ onComplete: () => { setGone(true); onDone(); } });
    tl.to(counter.current, {
      v: 100, duration: 0.5, ease: 'power2.inOut',
      onUpdate: () => { num.current.textContent = String(Math.round(counter.current.v)).padStart(3, '0'); },
    })
      .to('.pl-name .c', { yPercent: -110, stagger: 0.015, duration: 0.5, ease: 'power3.in' }, '+=0.05')
      .to('.pl-num', { opacity: 0, duration: 0.3 }, '<')
      .to(root.current, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '-=0.15')
      .to('.pl-curve', { scaleY: 0, duration: 0.9, ease: 'expo.inOut' }, '<');
  }, { scope: root, dependencies: [ready] });

  if (gone) return null;
  return (
    <div className="preloader" ref={root} aria-hidden="true">
      <div className="pl-name">{Array.from(name || '').map((c, i) => <span className="c" key={i}>{c === ' ' ? ' ' : c}</span>)}</div>
      <div className="pl-num mono" ref={num}>000</div>
      <div className="pl-curve" />
    </div>
  );
}
