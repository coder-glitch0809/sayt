import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { LANG_CODES, langPref, pathFor } from '../i18n.js';
import { gsap, ScrollTrigger, startSmoothScroll, scrollToHash, getLenis, reduceMotion } from './motion.js';
import { Aurora, Cursor, Preloader, Progress } from './fx.jsx';
import { Nav, Hero, Ticker } from './Hero.jsx';
import { Stats, Cases, ReturnChart } from './Results.jsx';
import { Proof, Process, Tools } from './Work.jsx';
import { Brands, Band, Contact, Footer } from './Closing.jsx';
import './site.css';

// inside the admin's live-preview iframe the draft arrives by postMessage
const isPreview = new URLSearchParams(location.search).has('preview');

export default function Site() {
  const [content, setContent] = useState(null);
  const [previewLang, setPreviewLang] = useState(null);
  const [error, setError] = useState('');
  const [introDone, setIntroDone] = useState(isPreview);
  const curtain = useRef(null);
  const redirected = useRef(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const seg = pathname.split('/')[1];
  const urlLang = LANG_CODES.includes(seg) ? seg : null;
  const enabled = content?.languages || [];
  const def = content?.defaultLang || 'en';
  const wanted = isPreview ? previewLang : urlLang;
  const lang = wanted && enabled.includes(wanted) ? wanted : def;
  const loc = content?.locales?.[lang];

  const load = useCallback(() => {
    setError('');
    api('/api/content').then(setContent).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
    if (!isPreview) return;
    const onMsg = (e) => {
      if (e.origin !== location.origin || e.data?.type !== 'preview-content') return;
      setContent(e.data.content);
      setPreviewLang(e.data.lang);
    };
    addEventListener('message', onMsg);
    window.parent?.postMessage({ type: 'preview-ready' }, location.origin);
    return () => removeEventListener('message', onMsg);
  }, [load]);

  // first visit to "/": follow the saved choice, else the browser language
  useEffect(() => {
    if (!content || isPreview || urlLang || redirected.current) return;
    redirected.current = true;
    const browser = (navigator.language || '').slice(0, 2).toLowerCase();
    const pick = [langPref.get(), browser].find((l) => l && content.languages.includes(l));
    if (pick && pick !== content.defaultLang) navigate(pathFor(pick, content.defaultLang), { replace: true });
  }, [content, urlLang, navigate]);

  useEffect(() => {
    document.documentElement.lang = lang;
    if (loc?.meta?.title) document.title = loc.meta.title;
    const d = document.querySelector('meta[name="description"]');
    if (d && loc?.meta?.description) d.setAttribute('content', loc.meta.description);
  }, [lang, loc?.meta]);

  useEffect(() => startSmoothScroll(), []);

  // in-page anchors go through Lenis so they glide instead of jumping
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      e.preventDefault();
      scrollToHash(a.getAttribute('href'));
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // late fonts / images shift layout, so re-measure every trigger once they settle
  useEffect(() => {
    if (!content) return;
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    addEventListener('load', refresh);
    const t = setTimeout(refresh, 600);
    return () => { removeEventListener('load', refresh); clearTimeout(t); };
  }, [content, lang]);

  // a green panel sweeps up, the language swaps underneath, then it sweeps away
  const switchLang = useCallback((code) => {
    if (code === lang) return;
    langPref.set(code);
    const go = () => {
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(0, { immediate: true, force: true }); else window.scrollTo(0, 0);
      navigate(pathFor(code, def));
    };
    if (reduceMotion() || !curtain.current) return go();
    gsap.timeline()
      .set(curtain.current, { display: 'grid', yPercent: 100 })
      .to(curtain.current, { yPercent: 0, duration: 0.6, ease: 'expo.inOut' })
      .call(go)
      .to(curtain.current, { yPercent: -100, duration: 0.7, ease: 'expo.inOut', delay: 0.25 })
      .set(curtain.current, { display: 'none' });
  }, [lang, def, navigate]);

  return (
    <div className="site">
      <Aurora />
      <div className="grain" aria-hidden="true" />
      {!isPreview && <Preloader ready={!!loc} name={loc?.nav?.name || document.title} onDone={() => setIntroDone(true)} />}
      <div className="lang-curtain" ref={curtain} aria-hidden="true"><span>{loc?.nav?.initials}</span></div>
      {error && (
        <div className="load-error">
          <p>Kontentni yuklab bo'lmadi: {error}</p>
          <button className="btn btn-solid" onClick={load}>Qayta urinish</button>
        </div>
      )}
      {loc && (
        <>
          <Progress />
          <Cursor />
          <Nav c={loc.nav} ui={loc.ui} lang={lang} languages={enabled} onLang={switchLang} />
          {/* remounting on language change replays every intro and rebuilds the scroll triggers */}
          <main id="top" key={lang}>
            <Hero c={loc.hero} ui={loc.ui} play={introDone} />
            <Ticker items={loc.ticker} />
            <Stats c={loc.stats} />
            <Cases c={loc.cases} />
            <ReturnChart c={loc.chart} />
            <Proof c={loc.proof} />
            <Process c={loc.process} ui={loc.ui} />
            <Tools c={loc.tools} />
            <Brands c={loc.brands} />
            <Band c={loc.band} />
            <Contact c={loc.contact} ui={loc.ui} />
          </main>
          <Footer c={loc.footer} ui={loc.ui} />
        </>
      )}
    </div>
  );
}
