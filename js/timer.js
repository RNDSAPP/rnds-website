/* RNDS — timer de rounds en ligne. Tout tourne dans le navigateur, rien n'est envoyé. */
(() => {
  const root = document.documentElement;
  const en = root.lang === 'en';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $('#timer');
  if (!app) return;

  const T = en ? {
    ready: 'Get ready', round: 'Round', rest: 'Rest', done: 'Done', last: 'Last round',
    start: 'Start', pause: 'Pause', resume: 'Resume',
    nextRest: 'Then: rest', nextRound: 'Then: round', nextEnd: 'Then: end of session',
    sound: 'Sound on', muted: 'Sound off', summary: (r, t, p) => `${r} × ${t}, ${p} rest`,
  } : {
    ready: 'Prêt', round: 'Round', rest: 'Repos', done: 'Terminé', last: 'Dernier round',
    start: 'Démarrer', pause: 'Pause', resume: 'Reprendre',
    nextRest: 'Ensuite : repos', nextRound: 'Ensuite : round', nextEnd: 'Ensuite : fin de séance',
    sound: 'Son activé', muted: 'Son coupé', summary: (r, t, p) => `${r} × ${t}, repos ${p}`,
  };

  const PREP = 10;      // compte à rebours avant le premier round
  const WARN = 10;      // signal 10 s avant la fin du round

  const el = {
    presets: $$('[data-preset]', app),
    perso: $('.tm__perso', app),
    rounds: $('#tm-rounds', app), min: $('#tm-min', app), sec: $('#tm-sec', app), rest: $('#tm-rest', app),
    phase: $('.tm__phase', app), compte: $('.tm__compte', app), temps: $('.tm__temps', app),
    barre: $('.tm__barre i', app), suite: $('.tm__suite', app), resume: $('.tm__resume', app),
    go: $('[data-action="go"]', app), reset: $('[data-action="reset"]', app),
    plein: $('[data-action="plein"]', app), son: $('[data-action="son"]', app), ecran: $('.tm__ecran', app),
  };

  const fmt = s => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const fmtCourt = s => (s < 60 ? `${s} s` : s % 60 ? fmt(s) : `${s / 60} min`);

  /* ---------- Réglages ---------- */
  let cfg = { rounds: 3, round: 180, rest: 60 };

  const lireUrl = () => {
    const q = new URLSearchParams(location.search);
    const r = +q.get('r'), t = +q.get('t'), p = +q.get('p');
    if (r >= 1 && r <= 30 && t >= 10 && t <= 1800 && p >= 0 && p <= 600) return { rounds: r, round: t, rest: p };
    return null;
  };
  const ecrireUrl = () => {
    const q = `?r=${cfg.rounds}&t=${cfg.round}&p=${cfg.rest}`;
    history.replaceState(null, '', location.pathname + q);
  };

  const remplirPerso = () => {
    el.rounds.value = cfg.rounds;
    el.min.value = Math.floor(cfg.round / 60);
    el.sec.value = cfg.round % 60;
    el.rest.value = cfg.rest;
  };

  let touche = false; // l'adresse ne change qu'après un choix de l'utilisateur
  const choisir = (bouton) => {
    el.presets.forEach(b => b.setAttribute('aria-pressed', b === bouton));
    const perso = bouton.dataset.preset === 'perso';
    el.perso.hidden = !perso;
    if (!perso) {
      const [r, t, p] = bouton.dataset.preset.split(',').map(Number);
      cfg = { rounds: r, round: t, rest: p };
      remplirPerso();
    }
    appliquer();
  };

  const depuisPerso = () => {
    const r = Math.min(30, Math.max(1, Math.round(+el.rounds.value || 1)));
    const t = Math.max(10, (+el.min.value || 0) * 60 + (+el.sec.value || 0));
    cfg = { rounds: r, round: t, rest: +el.rest.value || 0 };
    appliquer();
  };

  /* ---------- Séquence ---------- */
  let phases = [], i = 0, fin = 0, reste = 0, marche = false, tick = null, avertiDone = false, bipsRepos = new Set();

  const construire = () => {
    phases = [{ type: 'prep', d: PREP }];
    for (let n = 1; n <= cfg.rounds; n++) {
      phases.push({ type: 'round', n, d: cfg.round });
      if (n < cfg.rounds && cfg.rest > 0) phases.push({ type: 'rest', n, d: cfg.rest });
    }
    phases.push({ type: 'done', d: 0 });
  };

  const appliquer = () => {
    arreter();
    construire();
    i = 0; reste = phases[0].d;
    el.resume.textContent = T.summary(cfg.rounds, fmtCourt(cfg.round), fmtCourt(cfg.rest));
    if (touche) ecrireUrl();
    afficher();
  };

  const afficher = () => {
    const p = phases[i];
    const total = cfg.rounds;
    let phase = '', compte = '';
    if (p.type === 'prep') phase = T.ready;
    if (p.type === 'round') { phase = p.n === total && total > 1 ? T.last : `${T.round}`; compte = `${p.n}/${total}`; }
    if (p.type === 'rest') { phase = T.rest; compte = `${p.n}/${total}`; }
    if (p.type === 'done') { phase = T.done; compte = `${total}/${total}`; }
    if (el.phase.textContent !== phase) el.phase.textContent = phase;
    el.compte.textContent = compte;
    el.temps.textContent = p.type === 'done' ? '0:00' : fmt(reste);
    el.barre.style.transform = `scaleX(${p.d ? 1 - reste / p.d : 1})`;
    app.dataset.etat = p.type;
    app.classList.toggle('is-fin', p.type === 'round' && reste <= WARN && reste > 0);

    const n = phases[i + 1];
    el.suite.textContent = !n || p.type === 'done' ? '' :
      n.type === 'rest' ? `${T.nextRest} ${fmt(n.d)}` :
      n.type === 'round' ? `${T.nextRound} ${n.n}` : T.nextEnd;

    el.go.textContent = marche ? T.pause : (i === 0 && reste === phases[0].d ? T.start : (p.type === 'done' ? T.start : T.resume));
  };

  const boucle = () => {
    reste = (fin - performance.now()) / 1000;
    const p = phases[i];
    if (p.type === 'round' && !avertiDone && reste <= WARN && p.d > WARN + 5) { avertiDone = true; son.avertir(); }
    if ((p.type === 'rest' || p.type === 'prep') && reste <= 3 && reste > 0) {
      const s = Math.ceil(reste);
      if (!bipsRepos.has(s)) { bipsRepos.add(s); son.bip(880, .12); }
    }
    if (reste <= 0) suivante(); else afficher();
  };

  const suivante = () => {
    const ancienne = phases[i];
    i++;
    const p = phases[i];
    avertiDone = false; bipsRepos = new Set();
    if (p.type === 'round') son.cloche(1);
    if (p.type === 'rest' || (p.type === 'done' && ancienne.type === 'round')) son.cloche(3);
    if (p.type === 'done') { reste = 0; arreter(); afficher(); return; }
    fin = performance.now() + p.d * 1000;
    reste = p.d;
    afficher();
  };

  const demarrer = () => {
    son.debloquer();
    if (phases[i].type === 'done') { i = 0; reste = phases[0].d; }
    marche = true;
    fin = performance.now() + reste * 1000;
    clearInterval(tick);
    tick = setInterval(boucle, 100);
    veille.garder();
    afficher();
  };

  const arreter = () => {
    marche = false;
    clearInterval(tick);
    veille.lacher();
  };

  el.go.addEventListener('click', () => { if (marche) { arreter(); afficher(); } else demarrer(); });
  el.reset.addEventListener('click', () => { arreter(); i = 0; reste = phases[0].d; avertiDone = false; afficher(); });

  /* ---------- Son (Web Audio, aucun fichier) ---------- */
  const son = (() => {
    let ctx = null, actif = true;
    const debloquer = () => {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      if (!ctx) ctx = new C();
      if (ctx.state === 'suspended') ctx.resume();
    };
    const note = (f, t0, dur, vol, type = 'sine') => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t0); o.stop(t0 + dur + 0.05);
    };
    /* Cloche de ring : quelques partiels inharmoniques qui s'éteignent lentement */
    const coup = t0 => [[1, .5, 1.6], [2.76, .22, 1.1], [5.4, .12, .7], [8.93, .06, .4]]
      .forEach(([r, v, d]) => note(740 * r, t0, d, v));
    return {
      debloquer,
      cloche(n) { if (!actif || !ctx) return; const t = ctx.currentTime; for (let k = 0; k < n; k++) coup(t + k * 0.42); },
      bip(f, d) { if (!actif || !ctx) return; note(f, ctx.currentTime, d, .35, 'square'); },
      avertir() { if (!actif || !ctx) return; const t = ctx.currentTime; [0, .18].forEach(dt => note(1320, t + dt, .09, .3, 'square')); },
      basculer() { actif = !actif; return actif; },
    };
  })();

  el.son.addEventListener('click', () => {
    const on = son.basculer();
    el.son.setAttribute('aria-pressed', on);
    el.son.textContent = on ? T.sound : T.muted;
  });

  /* ---------- Écran allumé pendant la séance ---------- */
  const veille = (() => {
    let lock = null;
    const garder = async () => {
      try { if ('wakeLock' in navigator && !lock) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } } catch (e) { lock = null; }
    };
    const lacher = () => { if (lock) lock.release().catch(() => {}); lock = null; };
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && marche) garder(); });
    return { garder, lacher };
  })();

  /* ---------- Plein écran (télé de la salle) ---------- */
  if (document.fullscreenEnabled && el.ecran.requestFullscreen) {
    el.plein.hidden = false;
    el.plein.addEventListener('click', () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else el.ecran.requestFullscreen().catch(() => {});
    });
  }

  /* ---------- Clavier : espace, R, F ---------- */
  addEventListener('keydown', e => {
    if (e.target.closest('input, select, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code === 'Space') { e.preventDefault(); el.go.click(); }
    if (e.key === 'r' || e.key === 'R') el.reset.click();
    if ((e.key === 'f' || e.key === 'F') && !el.plein.hidden) el.plein.click();
  });

  /* ---------- Départ ---------- */
  el.presets.forEach(b => b.addEventListener('click', () => { touche = true; choisir(b); }));
  [el.rounds, el.min, el.sec, el.rest].forEach(c => c.addEventListener('change', () => { touche = true; depuisPerso(); }));

  const depuisLien = lireUrl();
  if (depuisLien) {
    cfg = depuisLien;
    const cle = `${cfg.rounds},${cfg.round},${cfg.rest}`;
    const b = el.presets.find(x => x.dataset.preset === cle) || el.presets.find(x => x.dataset.preset === 'perso');
    el.presets.forEach(x => x.setAttribute('aria-pressed', x === b));
    el.perso.hidden = b.dataset.preset !== 'perso';
    remplirPerso();
    appliquer();
  } else {
    choisir(el.presets.find(b => b.getAttribute('aria-pressed') === 'true') || el.presets[0]);
  }
})();
