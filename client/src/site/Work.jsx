import { useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP, reduceMotion, toneTrigger, revealIn } from './motion.js';
import { CountUp } from './text.jsx';
import { Head } from './Results.jsx';
import { asset } from '../api.js';

export function Proof({ c }) {
  const ref = useRef(null);
  const [active, setActive] = useState(0);
  const acc = c.accounts[Math.min(active, c.accounts.length - 1)];

  useGSAP(() => {
    toneTrigger(ref.current, 3);
    if (reduceMotion()) return;
    revealIn(ref.current);
    // the screenshot starts tipped back like a laptop lid and opens flat as you scroll
    gsap.fromTo(ref.current.querySelector('.shot-wrap'),
      { rotateX: 32, scale: 0.84, y: 60 },
      { rotateX: 0, scale: 1, y: 0, ease: 'none', scrollTrigger: { trigger: ref.current.querySelector('.shot-wrap'), start: 'top 95%', end: 'top 30%', scrub: 0.6 } });
  }, { scope: ref, dependencies: [c], revertOnUpdate: true });

  const { contextSafe } = useGSAP({ scope: ref });
  const pick = contextSafe((i) => {
    if (i === active) return;
    if (reduceMotion()) return setActive(i);
    const panel = ref.current.querySelector('.panel');
    gsap.to(panel, {
      clipPath: 'inset(0% 0% 0% 100% round 18px)', duration: 0.45, ease: 'power3.in',
      onComplete: () => {
        setActive(i);
        gsap.fromTo(panel, { clipPath: 'inset(0% 100% 0% 0% round 18px)' }, { clipPath: 'inset(0% 0% 0% 0% round 18px)', duration: 0.8, ease: 'expo.out' });
        gsap.from(panel.querySelectorAll('.sum > div'), { y: 30, opacity: 0, stagger: 0.06, duration: 0.7, ease: 'expo.out' });
      },
    });
  });

  const onKey = (e, i) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + c.accounts.length) % c.accounts.length;
    pick(n);
    e.currentTarget.parentElement.children[n]?.focus();
  };

  return (
    <section className="block" id="proof" ref={ref}>
      <div className="wrap">
        <Head eyebrow={c.eyebrow} title={c.title}>
          <p className="rv">{c.subtitle} {c.subtitleStrong && <strong>{c.subtitleStrong}</strong>}</p>
        </Head>
        <div className="proof">
          <div className="tabs rv" role="tablist" aria-label="Ad accounts">
            {c.accounts.map((a, i) => (
              <button key={i} role="tab" aria-selected={i === active} tabIndex={i === active ? 0 : -1}
                onClick={() => pick(i)} onKeyDown={(e) => onKey(e, i)}>{a.name}</button>
            ))}
          </div>
          {acc && (
            <div className="panel" role="tabpanel" aria-label={acc.name}>
              <div className="sum">
                {acc.summary.map((s, i) => <div key={`${active}-${i}`}><b><CountUp value={s.value} duration={1} /></b><span>{s.label}</span></div>)}
              </div>
              <div className="shot-wrap">
                <div className="shot" data-cursor="Ads Manager">
                  <div className="bar-top"><i /><i /><i /><span>{acc.caption}</span></div>
                  <div className="scroll" data-lenis-prevent-horizontal><img src={asset(acc.image)} alt={acc.alt} /></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* desktop: the section pins and the steps travel sideways; mobile: a vertical line fills */
export function Process({ c, ui }) {
  const ref = useRef(null);
  useGSAP(() => {
    toneTrigger(ref.current, 2);
    if (reduceMotion()) return;
    revealIn(ref.current.querySelector('.head'));
    const track = ref.current.querySelector('.hz-track');
    const steps = gsap.utils.toArray('.step', ref.current);
    const mm = gsap.matchMedia();

    mm.add('(min-width: 861px)', () => {
      const distance = () => Math.max(0, track.scrollWidth - track.parentElement.clientWidth);
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ref.current.querySelector('.hz-pin'), start: 'center 55%', end: () => `+=${distance() + innerHeight * 0.6}`,
          pin: ref.current.querySelector('.hz-pin'), scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (self) => {
            const idx = Math.min(steps.length - 1, Math.floor(self.progress * steps.length * 0.999));
            steps.forEach((s, i) => s.classList.toggle('on', i <= idx));
          },
        },
      });
      tl.to(track, { x: () => -distance(), ease: 'none' }, 0)
        .fromTo(ref.current.querySelector('.hz-line i'), { scaleX: 0 }, { scaleX: 1, ease: 'none' }, 0)
        .fromTo(steps.map((s) => s.querySelector('.num')), { xPercent: 40 }, { xPercent: -20, ease: 'none' }, 0);
    });

    mm.add('(max-width: 860px)', () => {
      gsap.fromTo(ref.current.querySelector('.hz-line i'), { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: track, start: 'top 75%', end: 'bottom 60%', scrub: true },
      });
      steps.forEach((s) => ScrollTrigger.create({ trigger: s, start: 'top 70%', onToggle: (self) => s.classList.toggle('on', self.isActive || self.progress > 0), end: 'max' }));
    });
  }, { scope: ref, dependencies: [c], revertOnUpdate: true });

  return (
    <section className="block process" id="process" ref={ref}>
      <div className="wrap">
        <Head eyebrow={c.eyebrow} title={c.title} />
      </div>
      <div className="hz-pin">
        <div className="hz-view">
          <div className="hz-line"><i /></div>
          <div className="hz-track">
            {c.steps.map((s, i) => (
              <div className="step" key={i}>
                <span className="num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <span className="dot" />
                <span className="k">{ui.step} {i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Tools({ c }) {
  const ref = useRef(null);
  useGSAP(() => {
    toneTrigger(ref.current, 1);
    if (reduceMotion()) return;
    revealIn(ref.current.querySelector('.head'));
    const cards = gsap.utils.toArray('.tool', ref.current);
    // cards stand up from the floor in sequence, tied to the scroll
    gsap.timeline({ scrollTrigger: { trigger: ref.current.querySelector('.tools'), start: 'top 90%', end: 'top 35%', scrub: 0.7 } })
      .from(cards, { rotateX: -75, y: 120, opacity: 0, transformOrigin: '50% 100%', stagger: 0.18, ease: 'power2.out' })
      .from(ref.current.querySelectorAll('.chips span'), { scale: 0.4, opacity: 0, stagger: 0.015, ease: 'back.out(2)' }, 0.35);

    // pointer spotlight + tilt on each card
    const offs = cards.map((card) => {
      const rx = gsap.quickTo(card, 'rotationX', { duration: 0.5 }), ry = gsap.quickTo(card, 'rotationY', { duration: 0.5 });
      const move = (e) => {
        const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', `${px * 100}%`);
        card.style.setProperty('--my', `${py * 100}%`);
        rx((py - 0.5) * -10); ry((px - 0.5) * 12);
      };
      const leave = () => { rx(0); ry(0); };
      card.addEventListener('pointermove', move);
      card.addEventListener('pointerleave', leave);
      return () => { card.removeEventListener('pointermove', move); card.removeEventListener('pointerleave', leave); };
    });
    return () => offs.forEach((f) => f());
  }, { scope: ref, dependencies: [c], revertOnUpdate: true });

  return (
    <section className="block" ref={ref}>
      <div className="wrap">
        <Head eyebrow={c.eyebrow} title={c.title} />
        <div className="tools">
          {c.groups.map((g, i) => (
            <div className="tool" key={i}>
              <span className="mono tool-n">{String(i + 1).padStart(2, '0')}</span>
              <h3>{g.title}</h3>
              <div className="chips">{g.chips.map((t, j) => <span key={j}>{t}</span>)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
