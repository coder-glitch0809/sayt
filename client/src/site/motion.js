import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export { gsap, ScrollTrigger, useGSAP };

export const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isDesktop = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 861px)').matches;

let lenis = null;
export const getLenis = () => lenis;

// Lenis drives the scroll position; ScrollTrigger reads it on every Lenis tick
export function startSmoothScroll() {
  if (lenis || reduceMotion()) return () => {};
  lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  const raf = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(raf);
    lenis.destroy();
    lenis = null;
  };
}

export function scrollToHash(hash) {
  const el = hash === '#top' ? 0 : document.querySelector(hash);
  if (el === null) return;
  if (lenis) lenis.scrollTo(el, { offset: -70, duration: 1.6 });
  else if (el === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
  else el.scrollIntoView({ behavior: 'smooth' });
}

/* aurora tone shared between sections and the canvas */
export const tone = { current: 0 };

export function toneTrigger(el, n) {
  ScrollTrigger.create({
    trigger: el, start: 'top center', end: 'bottom center',
    onToggle: (self) => { if (self.isActive) tone.current = n; },
  });
}

/* fade-and-rise for every .rv inside scope, staggered when several enter together */
export function revealIn(scope) {
  const els = gsap.utils.toArray('.rv', scope);
  if (!els.length) return;
  // one trigger per element with toggleActions: ScrollTrigger re-derives the right state after every
  // refresh (resize, language switch, jump links), so nothing can get stuck invisible
  els.forEach((el) => {
    const siblings = el.parentElement ? [...el.parentElement.children].filter((n) => n.classList.contains('rv')) : [el];
    gsap.from(el, {
      opacity: 0, y: 70, filter: 'blur(6px)', duration: 1.1, ease: 'expo.out',
      delay: Math.max(0, siblings.indexOf(el)) * 0.1,
      scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: 'play none none reverse' },
    });
  });
}

/* "$50K+" →{ prefix:"$", num:50, suffix:"K+", dec:0 }; returns null for things like "15–25×" */
export function parseCount(value) {
  const m = String(value ?? '').match(/^([^\d]*?)(\d[\d,]*(?:\.\d+)?)([^\d]*)$/);
  if (!m) return null;
  const raw = m[2].replace(/,/g, '');
  return { prefix: m[1], num: parseFloat(raw), suffix: m[3], dec: (raw.split('.')[1] || '').length, comma: m[2].includes(',') };
}

export function formatCount(p, v) {
  let s = p.dec ? v.toFixed(p.dec) : String(Math.round(v));
  if (p.comma || (!p.dec && v >= 1000)) s = Number(s).toLocaleString('en-US', { minimumFractionDigits: p.dec, maximumFractionDigits: p.dec });
  return p.prefix + s + p.suffix;
}
