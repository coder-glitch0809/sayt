import { useLayoutEffect, useRef } from 'react';
import { gsap, useGSAP, parseCount, formatCount, reduceMotion } from './motion.js';

/* "*word*" marks a highlighted (mint) part of any title */
export function segments(text) {
  return String(text ?? '').split(/(\*[^*]+\*)/).filter(Boolean)
    .map((s) => (s.startsWith('*') && s.endsWith('*') ? { text: s.slice(1, -1), hl: true } : { text: s, hl: false }));
}

export function Rich({ text }) {
  return segments(text).map((s, i) => (s.hl ? <em key={i} className="hl">{s.text}</em> : <span key={i}>{s.text}</span>));
}

/* every word in its own mask so it can slide/fade independently */
export function Words({ text, className = '' }) {
  // a word can span highlight boundaries ("*revenue*," stays one unbreakable word)
  const words = [[]];
  for (const seg of segments(text)) {
    seg.text.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) { if (words[words.length - 1].length) words.push([]); }
      else words[words.length - 1].push({ text: part, hl: seg.hl });
    });
  }
  const list = words.filter((w) => w.length);
  return (
    <span className={`words ${className}`} aria-label={String(text ?? '').replace(/\*/g, '')}>
      {list.map((pieces, i) => (
        <span key={i}>
          <span className="w" aria-hidden="true">
            <span className="wi">{pieces.map((p, j) => (p.hl ? <em key={j} className="hl">{p.text}</em> : p.text))}</span>
          </span>
          {i < list.length - 1 ? ' ' : null}
        </span>
      ))}
    </span>
  );
}

/* chars grouped per word, so lines only ever break between words */
export function Chars({ text, className = '' }) {
  return (
    <span className={`chars ${className}`} aria-label={text}>
      {String(text ?? '').split(/(\s+)/).map((w, wi) =>
        /^\s+$/.test(w) ? ' ' : w ? (
          <span className="cw" key={wi} aria-hidden="true">
            {Array.from(w).map((c, i) => <span className="c" key={i}>{c}</span>)}
          </span>
        ) : null
      )}
    </span>
  );
}

/*
  Shrinks a heading only when its longest word would not fit the box, so long Russian or Uzbek
  words never spill out of their column. Words are inline-blocks, and offsetWidth ignores the
  transforms the scroll animations apply, so measuring stays stable mid-animation.
*/
export function useFit(ref, selector, deps = []) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let lastW = -1;
    const fit = (force) => {
      const avail = el.clientWidth;
      if (!avail || (!force && avail === lastW)) return;
      lastW = avail;
      el.style.fontSize = '';
      const items = selector ? el.querySelectorAll(selector) : [el];
      let widest = 0;
      items.forEach((n) => { widest = Math.max(widest, n.offsetWidth); });
      if (widest > avail) {
        const size = parseFloat(getComputedStyle(el).fontSize);
        el.style.fontSize = `${Math.floor(size * (avail / widest) * 0.97)}px`;
      }
    };
    fit(true);
    const ro = new ResizeObserver(() => fit(false));
    ro.observe(el);
    document.fonts?.ready.then(() => fit(true));
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* Heading whose words light up one by one as it scrolls through the viewport */
export function ScrubHeading({ as: Tag = 'h2', text, className = '' }) {
  const ref = useRef(null);
  useGSAP(() => {
    if (reduceMotion()) return;
    const words = ref.current.querySelectorAll('.wi');
    gsap.fromTo(words,
      { opacity: 0.12, yPercent: 40, rotate: 4 },
      {
        opacity: 1, yPercent: 0, rotate: 0, stagger: 0.08, ease: 'power2.out',
        scrollTrigger: { trigger: ref.current, start: 'top 88%', end: 'top 45%', scrub: 0.6 },
      });
  }, { scope: ref, dependencies: [text], revertOnUpdate: true });
  useFit(ref, '.w', [text]);
  return <Tag ref={ref} className={className}><Words text={text} /></Tag>;
}

/* number that counts up from zero the first time it scrolls into view */
export function CountUp({ value, className = '', duration = 1.6 }) {
  const ref = useRef(null);
  useGSAP(() => {
    const p = parseCount(value);
    if (!p || reduceMotion()) return;
    const o = { v: 0 };
    gsap.to(o, {
      v: p.num, duration, ease: 'power3.out',
      onUpdate: () => { if (ref.current) ref.current.textContent = formatCount(p, o.v); },
      onComplete: () => { if (ref.current) ref.current.textContent = value; },
      scrollTrigger: { trigger: ref.current, start: 'top 90%', once: true },
    });
  }, { dependencies: [value], revertOnUpdate: true });
  // key: remount on change so React owns a fresh text node after GSAP wrote to it
  return <span ref={ref} key={value} className={className}>{value}</span>;
}
