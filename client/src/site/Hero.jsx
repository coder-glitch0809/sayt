import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP, reduceMotion, toneTrigger } from './motion.js';
import { Chars, CountUp, useFit } from './text.jsx';
import { Magnetic } from './fx.jsx';
import { asset } from '../api.js';
import { LANGS } from '../i18n.js';

/* EN / RU / UZ pill; the mint thumb slides under the active language */
function LangSwitch({ lang, languages, onLang, className = '' }) {
  const list = LANGS.filter((l) => languages.includes(l.code));
  if (list.length < 2) return null;
  const idx = Math.max(0, list.findIndex((l) => l.code === lang));
  return (
    <div className={`lang ${className}`} role="group" aria-label="Language" style={{ '--n': list.length, '--i': idx }}>
      <span className="lang-thumb" aria-hidden="true" />
      {list.map((l) => (
        <button key={l.code} type="button" lang={l.code} title={l.name} aria-pressed={l.code === lang} onClick={() => onLang(l.code)}>{l.short}</button>
      ))}
    </div>
  );
}

export function Nav({ c, ui, lang, languages, onLang }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);

  useGSAP(() => {
    // hides while reading downward, returns the moment you scroll up
    const show = gsap.to(ref.current, { yPercent: -110, paused: true, duration: 0.45, ease: 'power3.inOut' });
    ScrollTrigger.create({
      start: 'top -120', end: 'max',
      onUpdate: (self) => (self.direction === 1 ? show.play() : show.reverse()),
      onLeaveBack: () => show.reverse(),
      onToggle: (self) => ref.current.classList.toggle('scrolled', self.isActive),
    });
  }, { scope: ref });

  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', open);
  }, [open]);

  return (
    <>
      <header className="nav" ref={ref}>
        <div className="wrap">
          <a className="mark" href="#top" onClick={() => setOpen(false)}><b>{c.initials}</b><span>{c.name}</span></a>
          <ul>
            {c.links.map((l, i) => (
              <li key={i}><a href={l.href} className="roll"><span data-t={l.label}>{l.label}</span></a></li>
            ))}
          </ul>
          <div className="nav-right">
            <LangSwitch lang={lang} languages={languages} onLang={onLang} />
            <Magnetic><a className="btn btn-solid" href={c.ctaHref}>{c.ctaLabel}</a></Magnetic>
            <button className={`burger${open ? ' on' : ''}`} aria-label={ui.menu} aria-expanded={open} onClick={() => setOpen(!open)}>
              <i /><i />
            </button>
          </div>
        </div>
      </header>
      <div className={`mmenu${open ? ' open' : ''}`} onClick={(e) => e.target.closest('a') && setOpen(false)}>
        <nav>
          {c.links.map((l, i) => (
            <a key={i} href={l.href} style={{ '--i': i }}><small className="mono">0{i + 1}</small>{l.label}</a>
          ))}
          <a href={c.ctaHref} style={{ '--i': c.links.length }}><small className="mono">→</small>{c.ctaLabel}</a>
          <LangSwitch lang={lang} languages={languages} onLang={(l) => { setOpen(false); onLang(l); }} className="lang-lg" />
        </nav>
      </div>
    </>
  );
}

export function Hero({ c, ui, play }) {
  const ref = useRef(null);
  const intro = useRef(null);
  const h1 = useRef(null);
  useFit(h1, '.cw', [c.line1, c.line2]);

  useGSAP(() => {
    toneTrigger(ref.current, 0);
    if (reduceMotion()) return;
    const q = gsap.utils.selector(ref);

    // intro: built once, paused until the preloader lifts
    intro.current = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } })
      .from(q('h1 .c'), { yPercent: 115, rotate: 12, duration: 1.3, stagger: 0.022 })
      .from(q('.eyebrow, .lede, .cta, .hero-meta'), { y: 40, opacity: 0, duration: 1.1, stagger: 0.08 }, 0.25)
      .from(q('.frame'), { clipPath: 'inset(100% 0% 0% 0% round 220px 220px 28px 28px)', duration: 1.5, ease: 'expo.inOut' }, 0.1)
      .from(q('.frame img'), { scale: 1.5, duration: 1.8 }, 0.2)
      .from(q('.readout'), { x: -80, opacity: 0, duration: 1.2 }, 0.8)
      .from(q('.halo'), { opacity: 0, scale: 0.4, duration: 2 }, 0.3);

    // scroll: the copy drifts up and dims, portrait sinks slower, card floats faster — depth through speed
    gsap.timeline({ scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: 0.8 } })
      .to(q('.l1'), { xPercent: -12, ease: 'none' }, 0)
      .to(q('.l2'), { xPercent: 10, ease: 'none' }, 0)
      .to(q('.hero-copy'), { y: -120, opacity: 0.1, ease: 'none' }, 0)
      .to(q('.frame'), { y: 140, rotate: -4, scale: 0.92, ease: 'none' }, 0)
      .to(q('.frame img'), { scale: 1.25, ease: 'none' }, 0)
      .to(q('.readout'), { y: -160, x: 40, ease: 'none' }, 0)
      .to(q('.scroll-cue'), { opacity: 0, ease: 'none' }, 0);

    // portrait tilts toward the pointer
    const card = q('.portrait')[0];
    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.8, ease: 'power3' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.8, ease: 'power3' });
    const move = (e) => {
      rx(((e.clientY / innerHeight) - 0.5) * -10);
      ry(((e.clientX / innerWidth) - 0.5) * 14);
    };
    addEventListener('pointermove', move, { passive: true });
    return () => removeEventListener('pointermove', move);
  }, { scope: ref });

  useEffect(() => {
    if (!intro.current) return;
    if (play) intro.current.play(); else intro.current.progress(0).pause();
  }, [play]);

  return (
    <section className="hero" ref={ref}>
      <div className="wrap">
        <div className="hero-copy">
          <p className="eyebrow">{c.eyebrow}</p>
          <h1 ref={h1}>
            <span className="line l1"><Chars text={c.line1} /></span>
            <span className="line l2 soft"><Chars text={c.line2} /></span>
          </h1>
          <p className="lede">{c.lede} {c.ledeStrong && <strong>{c.ledeStrong}</strong>}</p>
          <div className="cta">
            <Magnetic><a className="btn btn-solid" href={c.primaryHref}>{c.primaryLabel}</a></Magnetic>
            <Magnetic><a className="btn btn-ghost" href={c.secondaryHref}>{c.secondaryLabel}</a></Magnetic>
          </div>
          <div className="hero-meta">{c.meta.map((m, i) => <span key={i}>{m}</span>)}</div>
        </div>
        <div className="portrait">
          <div className="halo" />
          <div className="frame"><img src={asset(c.portrait)} alt={c.portraitAlt} /></div>
          <div className="readout" aria-label={c.readoutTitle}>
            <div className="top"><b>{c.readoutTitle}</b><span className="tag">{c.readoutTag}</span></div>
            <div className="row">
              {c.readout.map((r, i) => (
                <div key={i}><b className="mono"><CountUp value={r.value} duration={2.2} /></b><small>{r.label}</small></div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="scroll-cue mono" aria-hidden="true"><span />{ui.scroll}</div>
    </section>
  );
}

/* marquee that speeds up, reverses and leans with the scroll velocity */
export function Ticker({ items }) {
  const ref = useRef(null);
  useGSAP(() => {
    if (reduceMotion()) return;
    const track = ref.current.querySelector('.track');
    let x = 0, dir = 1, boost = 0;
    const skew = gsap.quickTo(track, 'skewX', { duration: 0.4 });
    const st = ScrollTrigger.create({
      trigger: ref.current, start: 'top bottom', end: 'bottom top',
      onUpdate: (self) => {
        const v = self.getVelocity();
        dir = self.direction;
        boost = Math.min(Math.abs(v) / 120, 18);
        skew(gsap.utils.clamp(-12, 12, v / -260));
      },
    });
    const tick = (time, delta) => {
      boost *= 0.94;
      if (Math.abs(boost) < 0.05) skew(0);
      x -= (0.04 + boost * 0.02) * dir * (delta / 16);
      x = gsap.utils.wrap(-50, 0, x);
      gsap.set(track, { xPercent: x });
    };
    gsap.ticker.add(tick);
    return () => { gsap.ticker.remove(tick); st.kill(); };
  }, { scope: ref, dependencies: [items.join('|')], revertOnUpdate: true });

  const list = (hidden) => <ul aria-hidden={hidden || undefined}>{items.map((t, i) => <li key={i}>{t}</li>)}</ul>;
  return (
    <div className="ticker" ref={ref} aria-label="Niches">
      <div className="track">{list(false)}{list(true)}</div>
    </div>
  );
}
