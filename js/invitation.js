/* Page d'invitation rnds.app/u/pseudo (servie par 404.html). */
(() => {
  const m = location.pathname.match(/^\/u\/([a-z0-9._]{3,20})\/?$/i);
  if (!m) { document.title = 'Page introuvable · RNDS'; return; }
  const pseudo = '@' + m[1].toLowerCase();
  const en = /^en\b/i.test(navigator.language || '');
  const t = en ? {
    label: 'Invitation', titre: 'invites you to RNDS.', lede: 'A boxing timer and training journal where you can follow their sessions.',
    appareils: 'On iPhone and Apple Watch.', decouvrir: 'See the app', bientot: 'Coming soon to the App Store',
    aide: `Once the app is installed, search for ${pseudo} in Social › Friends to follow them.`,
    badge: '/img/badges/app-store-en-us.svg', badgeAlt: 'Download on the App Store', badgeW: 144, accueil: '/en/', page: 'Invitation · RNDS'
  } : {
    label: 'Invitation', titre: 't’invite sur RNDS.', lede: 'Un timer de boxe et un journal d’entraînement, où tu pourras suivre ses séances.',
    appareils: 'Sur iPhone et Apple Watch.', decouvrir: 'Voir l’app', bientot: 'Sortie prochaine sur l’App Store',
    aide: `Une fois l’app installée, cherche ${pseudo} dans Social › Amis pour le suivre.`,
    badge: '/img/badges/app-store-fr-fr.svg', badgeAlt: 'Télécharger dans l’App Store', badgeW: 152, accueil: '/', page: 'Invitation · RNDS'
  };
  const vue = document.getElementById('invitation').content.cloneNode(true);
  vue.querySelectorAll('[data-t]').forEach(n => { n.textContent = t[n.dataset.t]; });
  vue.querySelector('.pseudo').textContent = pseudo;
  const img = vue.querySelector('.badge-store img');
  Object.assign(img, { src: t.badge, alt: t.badgeAlt, width: t.badgeW, height: 48 });
  vue.querySelector('[data-t="decouvrir"]').href = t.accueil;
  document.querySelector('main').replaceChildren(vue);
  document.documentElement.lang = en ? 'en' : 'fr';
  document.title = `${pseudo} · ${t.page}`;
})();
