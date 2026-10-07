/* RNDS — site vitrine : en-tête, menu, apparitions. Aucun suivi. */
(() => {
  /* Adresse de RNDS sur l'App Store : à coller ici le jour de la sortie (ex. https://apps.apple.com/fr/app/rnds/id0000000000). */
  const APP_STORE_URL = '';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const en = root.lang === 'en';

  /* Badges App Store : vrais liens dès que l'adresse est connue, sinon renvoi vers « Être prévenu » */
  document.querySelectorAll('[data-app-store]').forEach(a => {
    if (APP_STORE_URL) { a.href = APP_STORE_URL; return; }
    a.setAttribute('aria-disabled', 'true');
    a.title = root.lang === 'en' ? 'Available at launch' : 'Disponible à la sortie';
  });
  if (APP_STORE_URL) root.classList.add('a-une-adresse');

  /* Bannière vidéo : chargée seulement si les animations sont permises et sans mode économie de données */
  const video = $('.hero__video');
  if (video) {
    const calme = matchMedia('(prefers-reduced-motion: reduce)').matches || (navigator.connection && navigator.connection.saveData);
    if (!calme) {
      video.src = innerWidth > 860 ? video.dataset.large : video.dataset.small;
      const lire = () => video.play().catch(() => {});
      lire();
      new IntersectionObserver(es => es.forEach(e => (e.isIntersecting ? lire() : video.pause()))).observe(video);
    }
  }

  /* Apparitions au défilement */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    io.unobserve(e.target);
  }), { rootMargin: '0px 0px -8% 0px' });
  $$('[data-in]').forEach(n => io.observe(n));

  /* En-tête opaque après le haut de page */
  const header = $('#header');
  const clair = $('.prive');
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('is-solid', scrollY > 24);
    const r = clair && clair.getBoundingClientRect();
    header.classList.toggle('is-clair', !!r && r.top <= 32 && r.bottom >= 32);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Menu mobile */
  const btn = $('#menuBtn') || Object.assign(document.createElement('button'), { innerHTML: '<span class="sr-only"></span>' });
  const setMenu = open => {
    root.classList.toggle('menu-ouvert', open);
    document.body.classList.toggle('is-locked', open);
    btn.setAttribute('aria-expanded', open);
    btn.querySelector('.sr-only').textContent = open ? (en ? 'Close menu' : 'Fermer le menu') : 'Menu';
  };
  btn.addEventListener('click', () => setMenu(!root.classList.contains('menu-ouvert')));
  $$('#menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('menu-ouvert')) { setMenu(false); btn.focus(); } });

  /* Lien de la section affichée */
  const liens = $$('.nav a');
  const navIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) liens.forEach(a => a.classList.toggle('is-on', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-50% 0px -50% 0px' });
  $$('main > section[id]').forEach(s => navIO.observe(s));

  /* Barres de progression : une par section, comme les rounds du timer */
  const sections = ['top', 'timer', 'programmes', 'run', 'prepa', 'suivi', 'montre', 'vie-privee', 'coulisses', 'telecharger'].map(id => $('#' + id)).filter(Boolean);
  const barre = $('#progression');
  if (barre) {
    barre.innerHTML = sections.map(() => '<i></i>').join('');
    $('#total').textContent = sections.length;
    const barres = $$('i', barre);
    const suivre = () => {
      const milieu = scrollY + innerHeight / 2;
      let courant = 0;
      sections.forEach((s, k) => {
        const f = Math.min(1, Math.max(0, (milieu - s.offsetTop) / s.offsetHeight));
        barres[k].style.setProperty('--f', f.toFixed(3));
        if (f > 0) courant = k;
      });
      $('#compteur').textContent = courant + 1;
    };
    addEventListener('scroll', () => requestAnimationFrame(suivre), { passive: true });
    addEventListener('resize', suivre);
    suivre();
  }

  /* Copier l'adresse e-mail */
  $$('[data-copier]').forEach(b => b.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(b.dataset.copier);
      b.textContent = en ? 'Copied' : 'Copié';
      b.classList.add('is-ok');
      setTimeout(() => { b.textContent = en ? 'Copy' : 'Copier'; b.classList.remove('is-ok'); }, 1800);
    } catch { location.href = 'mailto:' + b.dataset.copier; }
  }));

  /* Heure de Lyon */
  const heure = $('#heure');
  if (heure) {
    const fmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
    const maj = () => { const [h, m] = fmt.format(new Date()).split(':'); heure.innerHTML = `${h}<i>:</i>${m}`; };
    maj();
    setInterval(maj, 15000);
  }

  $$('[data-annee]').forEach(n => (n.textContent = new Date().getFullYear()));

  console.log('%cRNDS%c\nRound après round. Fait à Lyon.\nUne idée, un bug, envie d’aider ? contact@rnds.app',
    'font: 600 28px "Kode Mono", monospace; color: #f2eae3; background: #000; padding: 6px 12px;',
    'font: 13px Inter, sans-serif; color: #8f8a85; line-height: 1.6;');
})();
