/* Pages rnds.app/u/pseudo (invitation) et rnds.app/s/id (séance partagée), servies par 404.html.
   Avec l'app installée, iOS ouvre directement l'app (fichier .well-known/apple-app-site-association). */
(() => {
  const m = location.pathname.match(/^\/u\/([a-z0-9._]{3,20})\/?$/i);
  const seance = /^\/s\/[0-9a-f-]{36}\/?$/i.test(location.pathname);
  if (!m && !seance) { document.title = 'Page introuvable · RNDS'; return; }
  const pseudo = m ? '@' + m[1].toLowerCase() : '';
  const en = /^en\b/i.test(navigator.language || '');
  const s = seance ? (en ? {
    label: 'Shared session', titre: 'A session on RNDS.', lede: 'Install RNDS to see it and follow your friend’s training.',
    aide: 'Once the app is installed, open this link again: the session opens in Social.'
  } : {
    label: 'Séance partagée', titre: 'Une séance sur RNDS.', lede: 'Installe RNDS pour la voir et suivre l’entraînement de ton ami.',
    aide: 'Une fois l’app installée, rouvre ce lien : la séance s’ouvre dans le Social.'
  }) : {};
  const t0 = en ? {
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
  const t = Object.assign(t0, s);
  const vue = document.getElementById('invitation').content.cloneNode(true);
  vue.querySelectorAll('[data-t]').forEach(n => { n.textContent = t[n.dataset.t]; });
  vue.querySelector('.pseudo').textContent = pseudo;
  const img = vue.querySelector('.badge-store img');
  Object.assign(img, { src: t.badge, alt: t.badgeAlt, width: t.badgeW, height: 48 });
  vue.querySelector('[data-t="decouvrir"]').href = t.accueil;
  document.querySelector('main').replaceChildren(vue);
  document.documentElement.lang = en ? 'en' : 'fr';
  document.title = seance ? `${t.label} · RNDS` : `${pseudo} · ${t.page}`;
})();
