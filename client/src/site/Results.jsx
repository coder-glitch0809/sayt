import { useRef } from 'react';
import { gsap, useGSAP, reduceMotion, toneTrigger, revealIn, isDesktop } from './motion.js';
import { CountUp, ScrubHeading, Rich, useFit } from './text.jsx';

export function Head({ eyebrow, title, sub, children }) {
  return (
    <div className="head">
      <p className="eyebrow rv"><span className="eb-line" />{eyebrow}</p>
      <ScrubHeading text={title} />
      {sub && <p className="rv">{sub}</p>}
      {children}
    </div>
  );
}

function StatValue({ s }) {
  const ref = useRef(null);
  // measure an invisible copy of the final value, since the live number is mid count-up
  useFit(ref, '.n-ghost', [s.value]);
  return (
    <span className="n-mask" ref={ref}>
      <span className={`n${s.highlight ? ' hi' : ''}`}><CountUp value={s.value} /></span>
      <span className="n n-ghost" aria-hidden="true">{s.value}</span>
    </span>
  );
}

function Roas({ k }) {
  const ref = useRef(null);
  useFit(ref, '.big', [k.roas]);
  return <div className="roas" ref={ref}><span className="big">{k.roas}</span><small>{k.roasLabel}</small></div>;
}

export function Stats({ c }) {
  const ref = useRef(null);
  useGSAP(() => {
    toneTrigger(ref.current, 1);
    if (reduceMotion()) return;
    revealIn(ref.current);
    // grid lines draw themselves in before the numbers land
    gsap.from(ref.current.querySelectorAll('.stat'), {
      '--line': 0, duration: 1.4, ease: 'expo.out', stagger: 0.1,
      scrollTrigger: { trigger: ref.current.querySelector('.stats'), start: 'top 85%', toggleActions: 'play none none reverse' },
    });
    gsap.from(ref.current.querySelectorAll('.stat .n'), {
      yPercent: 100, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08,
      scrollTrigger: { trigger: ref.current.querySelector('.stats'), start: 'top 80%', toggleActions: 'play none none reverse' },
    });
  }, { scope: ref, dependencies: [c], revertOnUpdate: true });

  return (
    <section className="block" ref={ref}>
      <div className="wrap">
        <Head eyebrow={c.eyebrow} title={c.title} />
        <div className="stats">
          {c.items.map((s, i) => (
            <div className="stat" key={i}>
              <StatValue s={s} />
              <span className="l">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* stacked cards: each one pins, then shrinks and darkens as the next slides over it */
export function Cases({ c }) {
  const ref = useRef(null);
  useGSAP(() => {
    toneTrigger(ref.current, 2);
    if (reduceMotion()) return;
    revealIn(ref.current);
    const cards = gsap.utils.toArray('.case', ref.current);
    const mm = gsap.matchMedia();
    mm.add('(min-width: 861px)', () => {
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        if (next) {
          gsap.to(card, {
            scale: 0.9 + i * 0.02, rotateX: 5, filter: 'brightness(0.55)', transformOrigin: '50% 0%', ease: 'none',
            scrollTrigger: { trigger: next, start: 'top 65%', end: 'top 90px', scrub: true },
          });
        }
        // the big ROAS figure swings in as the card arrives
        gsap.from(card.querySelector('.big'), {
          yPercent: 60, rotate: -6, opacity: 0, ease: 'expo.out', duration: 1.4,
          scrollTrigger: { trigger: card, start: 'top 70%', toggleActions: 'play none none reverse' },
        });
        gsap.from(card.querySelectorAll('li, .kv > div'), {
          x: -30, opacity: 0, stagger: 0.05, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 65%', toggleActions: 'play none none reverse' },
        });
      });
    });
    mm.add('(max-width: 860px)', () => {
      cards.forEach((card) => gsap.from(card, {
        y: 80, opacity: 0, scale: 0.94, duration: 1.1, ease: 'expo.out',
        scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none reverse' },
      }));
    });
  }, { scope: ref, dependencies: [c], revertOnUpdate: true });

  return (
    <section className="block" id="cases" ref={ref}>
      <div className="wrap">
        <Head eyebrow={c.eyebrow} title={c.title} sub={c.subtitle} />
        <div className="cases">
          {c.items.map((k, i) => (
            <article className="case" key={i} style={{ '--n': i }}>
              <span className="case-idx mono">{String(i + 1).padStart(2, '0')} / {String(c.items.length).padStart(2, '0')}</span>
              <div className="left">
                <p className="eyebrow">{k.category}</p>
                <h3>{k.name}</h3>
                <ul>{k.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
              </div>
              <div className="right">
                <Roas k={k} />
                <div className="kv">{k.kv.map((x, j) => <div key={j}><b>{x.value}</b><span>{x.label}</span></div>)}</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* bars grow with the scroll position rather than on a timer */
export function ReturnChart({ c }) {
  const ref = useRef(null);
  const max = Number(c.max) || 1;
  useGSAP(() => {
    toneTrigger(ref.current, 1);
    if (reduceMotion()) return;
    revealIn(ref.current);
    const chart = ref.current.querySelector('.chart');
    gsap.timeline({ scrollTrigger: { trigger: chart, start: 'top 80%', end: isDesktop() ? 'center 45%' : 'bottom 75%', scrub: 0.6 } })
      .from(chart.querySelectorAll('.fill, .ext'), { scaleX: 0, transformOrigin: '0 50%', stagger: 0.15, ease: 'power2.out' }, 0)
      .from(chart.querySelectorAll('.val'), { opacity: 0, x: -20, stagger: 0.15 }, 0.2)
      .from(chart.querySelectorAll('.ticks span'), { opacity: 0, y: 10, stagger: 0.04 }, 0);
  }, { scope: ref, dependencies: [c], revertOnUpdate: true });

  const ticks = Array.from({ length: 6 }, (_, i) => Math.round((max / 5) * i));
  return (
    <section className="block" ref={ref}>
      <div className="wrap">
        <Head eyebrow={c.eyebrow} title={c.title} />
        <div className="chart rv">
          <div className="bars">
            {c.items.map((b, i) => (
              <div className="bar" key={i}>
                <div className="name">{b.name}<small>{b.sub}</small></div>
                <div className="rail">
                  {Number(b.rangeTo) > 0 && <div className="ext" style={{ width: `${Math.min(100, (b.rangeTo / max) * 100)}%` }} />}
                  <div className="fill" style={{ width: `${Math.min(100, (b.value / max) * 100)}%` }} />
                </div>
                <div className="val">{b.display}</div>
              </div>
            ))}
          </div>
          <div className="axis">
            <div />
            <div className="ticks">{ticks.map((t, i) => <span key={i} style={{ left: `${i * 20}%` }}>${t}</span>)}</div>
            <div />
          </div>
          <p className="note"><Rich text={c.note} /></p>
        </div>
      </div>
    </section>
  );
}
