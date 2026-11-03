import { useRef, useState } from 'react';
import { gsap, useGSAP, reduceMotion, toneTrigger, revealIn } from './motion.js';
import { Chars, CountUp, Rich, ScrubHeading, useFit } from './text.jsx';
import { Magnetic } from './fx.jsx';
import { api } from '../api.js';

/* two belts of client names pulled in opposite directions by the scroll */
export function Brands({ c }) {
  const ref = useRef(null);
  useGSAP(() => {
    toneTrigger(ref.current, 3);
    if (reduceMotion()) return;
    revealIn(ref.current);
    const st = { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: 0.5 };
    gsap.fromTo(ref.current.querySelector('.lane.a'), { xPercent: 0 }, { xPercent: -35, ease: 'none', scrollTrigger: st });
    gsap.fromTo(ref.current.querySelector('.lane.b'), { xPercent: -35 }, { xPercent: 0, ease: 'none', scrollTrigger: { ...st } });
  }, { scope: ref, dependencies: [c], revertOnUpdate: true });

  const lane = (items, cls) => (
    <div className={`lane ${cls}`}>
      {[0, 1].map((k) => <ul key={k} aria-hidden={k ? true : undefined}>{items.map((t, i) => <li key={i}>{t}</li>)}</ul>)}
    </div>
  );
  return (
    <section className="block brands" id="brands" ref={ref}>
      <div className="wrap">
        <div className="head">
          <p className="eyebrow rv"><span className="eb-line" />{c.eyebrow}</p>
          <h2 className="rv"><span className="mint"><CountUp value={c.count} /></span> {c.title}</h2>
          <p className="rv">{c.subtitle}</p>
        </div>
      </div>
      <div className="belt" aria-label="Client brands">
        {lane(c.laneA, 'a')}
        {lane(c.laneB, 'b')}
      </div>
    </section>
  );
}

/* the green band opens out from a rounded card to full bleed */
export function Band({ c }) {
  const ref = useRef(null);
  useGSAP(() => {
    toneTrigger(ref.current, 4);
    if (reduceMotion()) return;
    revealIn(ref.current);
    gsap.fromTo(ref.current.querySelector('.band-bg'),
      { clipPath: 'inset(12% 6% 12% 6% round 48px)' },
      { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top 95%', end: 'top 20%', scrub: 0.6 } });
    gsap.to(ref.current.querySelector('.band-orb'), {
      yPercent: -60, xPercent: 30, ease: 'none',
      scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }, { scope: ref, dependencies: [c], revertOnUpdate: true });

  return (
    <section className="band" ref={ref}>
      <div className="band-bg"><div className="band-orb" /></div>
      <div className="wrap">
        <p className="eyebrow rv">{c.eyebrow}</p>
        <ScrubHeading text={c.title} />
        <div className="three">
          {c.items.map((it, i) => <div className="rv" key={i}><h3>{it.title}</h3><p>{it.text}</p></div>)}
        </div>
      </div>
    </section>
  );
}

function CopyButton({ text, ui }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setDone(true); } catch { /* clipboard blocked */ }
    setTimeout(() => setDone(false), 1600);
  };
  return <button className={`copy${done ? ' done' : ''}`} type="button" onClick={copy}>{done ? ui.copied : ui.copy}</button>;
}

function ContactForm({ c, ui }) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setStatus('sending'); setError('');
    try {
      await api('/api/messages', { method: 'POST', body: Object.fromEntries(f) });
      setStatus('sent');
      e.target.reset();
    } catch (err) { setStatus('idle'); setError(err.message); }
  };
  if (status === 'sent') return <div className="form-ok rv"><span>✓</span>{c.formSuccess}</div>;
  return (
    <form className="cform rv" onSubmit={submit}>
      <p className="eyebrow">{c.formTitle}</p>
      <div className="frow">
        <label><span>{ui.formName}</span><input name="name" required maxLength={120} autoComplete="name" /></label>
        <label><span>{ui.formContact}</span><input name="contact" required maxLength={160} /></label>
      </div>
      <label><span>{ui.formMessage}</span><textarea name="message" required rows={4} maxLength={4000} /></label>
      <input name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
      {error && <p className="ferr">{error}</p>}
      <Magnetic strength={0.2}>
        <button className="btn btn-solid" disabled={status === 'sending'}>{status === 'sending' ? '…' : c.formButton}</button>
      </Magnetic>
    </form>
  );
}

export function Contact({ c, ui }) {
  const ref = useRef(null);
  const title = useRef(null);
  useFit(title, '.cw', [c.title1, c.title2]);
  useGSAP(() => {
    toneTrigger(ref.current, 0);
    if (reduceMotion()) return;
    revealIn(ref.current);
    // letters start scattered and snap into the headline as you arrive
    const chars = gsap.utils.toArray('.big-title .c', ref.current);
    gsap.fromTo(chars,
      { x: () => gsap.utils.random(-300, 300), y: () => gsap.utils.random(-200, 200), rotate: () => gsap.utils.random(-90, 90), opacity: 0, scale: () => gsap.utils.random(0.3, 1.8) },
      { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1, ease: 'power3.out', stagger: { each: 0.02, from: 'random' },
        scrollTrigger: { trigger: ref.current, start: 'top 85%', end: 'top 25%', scrub: 0.8 } });
    gsap.fromTo(ref.current.querySelectorAll('.line-item'), { clipPath: 'inset(0% 100% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'expo.out', stagger: 0.08,
      scrollTrigger: { trigger: ref.current.querySelector('.lines'), start: 'top 85%', toggleActions: 'play none none reverse' },
    });
  }, { scope: ref, dependencies: [c], revertOnUpdate: true });

  return (
    <section className="block contact" id="contact" ref={ref}>
      <div className="wrap">
        <div>
          <p className="eyebrow rv"><span className="eb-line" />{c.eyebrow}</p>
          <h2 className="big-title" ref={title}><Chars text={c.title1} /><br /><span className="mint"><Chars text={c.title2} /></span></h2>
          <p className="contact-text rv"><Rich text={c.text} /></p>
        </div>
        <div className="contact-right">
          <div className="lines">
            {c.items.map((it, i) => (
              <div className="line-item" key={i}>
                <small>{it.label}</small>
                {it.href
                  ? <a className="v" href={it.href} target={it.href.startsWith('http') ? '_blank' : undefined} rel="noopener">{it.value}</a>
                  : <span className="v">{it.value}</span>}
                {it.copy ? <CopyButton text={it.value} ui={ui} /> : <span />}
              </div>
            ))}
          </div>
          {c.formEnabled && <ContactForm c={c} ui={ui} />}
        </div>
      </div>
    </section>
  );
}

export function Footer({ c, ui }) {
  return (
    <footer>
      <div className="wrap">
        <span>{c.left}</span>
        <a href="#top" className="to-top mono">{ui.toTop}</a>
        <span className="mono">{c.right}</span>
      </div>
    </footer>
  );
}
