(function () {
  var I = window.I18N, LANGS = ['es', 'en', 'fr', 'de'];
  var LOCALE = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', de: 'de-DE' };
  var lang = 'es';
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function t(key) { return (I[lang].t[key] != null ? I[lang].t[key] : I.es.t[key]) || ''; }
  function L() { return I[lang]; }

  /* ---------- Ventanas ---------- */
  var wins = {}, openers = {}, z = 30, offset = 0;

  function fillWin(w, id) {
    w.setAttribute('aria-label', L().titles[id]);
    w.querySelector('.t').textContent = L().titles[id];
    w.querySelector('.close').setAttribute('aria-label', t('win.close'));
    w.querySelector('.min').setAttribute('aria-label', t('win.min'));
    w.querySelector('.max').setAttribute('aria-label', t('win.max'));
    var body = w.querySelector('.win-body');
    body.innerHTML = '';
    body.appendChild(document.getElementById('tpl-' + id).content.cloneNode(true));
    var copy = w.querySelector('.js-copy');
    if (copy) copy.onclick = function () {
      var em = w.querySelector('.js-email'), ok = w.querySelector('.js-ok');
      function sel() { var r = document.createRange(); r.selectNodeContents(em); var s = getSelection(); s.removeAllRanges(); s.addRange(r); ok.textContent = t('copy.sel'); }
      try { navigator.clipboard.writeText(em.textContent).then(function () { ok.textContent = t('copy.ok'); }, sel); } catch (e) { sel(); }
    };
  }

  function openWin(id) {
    if (wins[id]) { focus(wins[id]); wins[id].focus(); return; }
    openers[id] = document.activeElement;
    var w = document.createElement('div');
    w.className = 'win'; w.setAttribute('role', 'dialog'); w.tabIndex = -1;
    w.innerHTML = '<div class="titlebar"><div class="lights"><button class="close" type="button"></button><button class="min" type="button"></button><button class="max" type="button"></button></div><span class="t"></span></div><div class="win-body"></div>';
    fillWin(w, id);
    document.body.appendChild(w);
    var left = Math.max(12, (window.innerWidth - w.offsetWidth) / 2 + offset);
    w.style.left = left + 'px'; w.style.top = (70 + offset) + 'px';
    offset = (offset + 28) % 140;
    wins[id] = w; focus(w); markDock();
    w.addEventListener('pointerdown', function () { focus(w); });
    w.querySelector('.close').onclick = w.querySelector('.min').onclick = function () { closeWin(id); };
    w.querySelector('.max').onclick = function () { w.style.left = '12px'; w.style.top = '46px'; w.style.width = 'calc(100vw - 24px)'; };
    drag(w);
    w.focus();
  }
  function closeWin(id) {
    if (!wins[id]) return;
    wins[id].remove(); delete wins[id]; markDock();
    var o = openers[id]; delete openers[id];
    if (o && document.contains(o)) o.focus();
  }
  function focus(w) { w.style.zIndex = ++z; }
  function markDock() {
    document.querySelectorAll('.dock [data-open]').forEach(function (b) { b.classList.toggle('open', !!wins[b.dataset.open]); });
  }
  function drag(w) {
    var bar = w.querySelector('.titlebar'), sx, sy, ox, oy;
    bar.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button') || window.innerWidth <= 700) return;
      sx = e.clientX; sy = e.clientY; ox = w.offsetLeft; oy = w.offsetTop;
      bar.setPointerCapture(e.pointerId);
      bar.onpointermove = function (ev) {
        var nx = Math.min(Math.max(0, ox + ev.clientX - sx), window.innerWidth - 80);
        var ny = Math.min(Math.max(36, oy + ev.clientY - sy), window.innerHeight - 60);
        w.style.left = nx + 'px'; w.style.top = ny + 'px';
      };
      bar.onpointerup = function () { bar.onpointermove = null; };
    });
  }
  document.querySelectorAll('[data-open]').forEach(function (b) {
    b.addEventListener('click', function () { openWin(b.dataset.open); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var top = null, tz = -1;
    Object.keys(wins).forEach(function (k) { var zz = +wins[k].style.zIndex; if (zz > tz) { tz = zz; top = k; } });
    if (top) closeWin(top);
  });

  /* ---------- Reloj y calendario ---------- */
  function tick() {
    var d = new Date(), loc = LOCALE[lang];
    var hm = d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
    document.getElementById('w-clock').textContent = hm;
    document.getElementById('w-date').textContent = d.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' });
    document.getElementById('menu-clock').textContent = d.toLocaleDateString(loc, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' }) + '  ' + hm;
  }
  setInterval(tick, 15000);

  function renderCal() {
    var d = new Date(), y = d.getFullYear(), m = d.getMonth(), today = d.getDate(), loc = LOCALE[lang];
    var ml = d.toLocaleDateString(loc, { month: 'long', year: 'numeric' });
    document.getElementById('cal-month').textContent = ml.charAt(0).toUpperCase() + ml.slice(1);
    // Iniciales de los días, empezando en lunes (5 de enero de 2026 fue lunes)
    var head = '';
    for (var i = 0; i < 7; i++) {
      var wd = new Date(2026, 0, 5 + i).toLocaleDateString(loc, { weekday: 'short' }).replace('.', '');
      head += '<th>' + (lang === 'es' ? 'LMXJVSD'[i] : wd.charAt(0).toUpperCase() + wd.slice(1, 2)) + '</th>';
    }
    document.getElementById('cal-head').innerHTML = head;
    var first = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate(), prev = new Date(y, m, 0).getDate();
    var html = '', cell = 0;
    for (var r = 0; r < 6 && (r * 7 < first + days); r++) {
      html += '<tr>';
      for (var c = 0; c < 7; c++, cell++) {
        var n = cell - first + 1;
        if (n < 1) html += '<td class="dim">' + (prev + n) + '</td>';
        else if (n > days) html += '<td class="dim">' + (n - days) + '</td>';
        else html += '<td' + (n === today ? ' class="today"><span>' + n + '</span>' : '>' + n) + '</td>';
      }
      html += '</tr>';
    }
    document.getElementById('cal-body').innerHTML = html;
  }

  /* ---------- Galería de Yoopo ---------- */
  var main = document.getElementById('yoopo-main'), cap = document.getElementById('yoopo-cap');
  function setShot(k) {
    main.dataset.k = k;
    main.alt = t('shot.' + k + '.alt'); cap.textContent = t('shot.' + k + '.cap');
  }
  document.querySelectorAll('.thumb').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.thumb').forEach(function (o) { o.classList.remove('is-on'); o.setAttribute('aria-pressed', 'false'); });
      b.classList.add('is-on'); b.setAttribute('aria-pressed', 'true');
      main.src = b.dataset.src; setShot(b.dataset.k);
      main.classList.remove('swap'); void main.offsetWidth; main.classList.add('swap');
    });
  });

  /* ---------- Dock: se esconde al bajar en pantallas pequeñas ---------- */
  var dock = document.querySelector('.dock'), lastY = window.scrollY;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    if (window.innerWidth <= 700 && y > lastY + 4 && y > 80) dock.classList.add('is-hidden');
    else if (y < lastY - 4 || window.innerWidth > 700) dock.classList.remove('is-hidden');
    lastY = y;
  }, { passive: true });

  /* ---------- Terminal interactiva ---------- */
  var out = document.getElementById('term-out'), form = document.getElementById('term-form'), input = document.getElementById('term-in');
  var CV = 'cv/Curriculum_CarlosMateHidalgo.pdf';
  var hist = [], hi = 0, typed = false;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function print(html, cls) { var d = document.createElement('div'); if (cls) d.className = cls; d.innerHTML = html; out.appendChild(d); out.scrollTop = out.scrollHeight; }
  function fmt(s, x) { return s.replace('{x}', x).replace('{cv}', CV); }
  function cmdName(k) { return L().term.cmds[k] || k; }

  var ACTIONS = {
    help: function () {
      var T = L().term, order = ['sobre', 'proyectos', 'yoopo', 'experiencia', 'stack', 'contacto', 'cv', 'github', 'linkedin', 'fecha', 'clear'];
      print(T.help);
      print(order.map(function (k) { var n = cmdName(k); return '  <b>' + n + '</b>' + '            '.slice(n.length) + T.desc[k]; }).join('\n'));
    },
    sobre: function () { print(L().term.about); openWin('sobre'); },
    whoami: function () { print('junior full stack developer · Madrid'); },
    proyectos: function () { print(L().term.opening.proyectos); openWin('proyectos'); },
    yoopo: function () { print(L().term.yoopo); },
    experiencia: function () { print(L().term.opening.experiencia); openWin('experiencia'); },
    stack: function () { print('JavaScript · TypeScript · React · Node.js · Express · PostgreSQL · Git · Docker'); },
    contacto: function () { print(L().term.contact); openWin('contacto'); },
    cv: function () { print(fmt(L().term.cv)); var a = document.createElement('a'); a.href = CV; a.download = ''; document.body.appendChild(a); a.click(); a.remove(); },
    github: function () { print('<a href="https://github.com/Cmh003">github.com/Cmh003</a>'); window.open('https://github.com/Cmh003', '_blank', 'noopener'); },
    linkedin: function () { print('<a href="https://www.linkedin.com/in/carlos-mate-hidalgo-68b139395">LinkedIn</a>'); window.open('https://www.linkedin.com/in/carlos-mate-hidalgo-68b139395', '_blank', 'noopener'); },
    fecha: function () { print(new Date().toLocaleString(LOCALE[lang], { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Madrid' })); },
    ls: function () { print(L().term.ls); },
    clear: function () { out.innerHTML = ''; },
    sudo: function () { print(L().term.sudo, 'c'); }
  };
  // Cada comando funciona con su nombre en cualquiera de los cuatro idiomas
  var ALIAS = { help: 'help', ayuda: 'help', aide: 'help', hilfe: 'help', 'über': 'sobre', formacion: 'experiencia', 'formación': 'experiencia', formation: 'experiencia', education: 'experiencia', ausbildung: 'experiencia', resume: 'cv', 'résumé': 'cv', lebenslauf: 'cv', 'expérience': 'experiencia' };
  Object.keys(ACTIONS).forEach(function (k) { ALIAS[k] = k; });
  LANGS.forEach(function (l) { var c = I[l].term.cmds; Object.keys(c).forEach(function (k) { ALIAS[c[k]] = k; }); });

  function run(raw) {
    var cmd = raw.trim(); if (!cmd) return;
    typed = true;
    print('<span class="p">~ $</span> ' + esc(cmd));
    hist.push(cmd); hi = hist.length;
    var name = cmd.toLowerCase().split(/\s+/)[0];
    if (name === 'cat' && /\.txt/.test(cmd)) return print(L().term.goal);
    var k = ALIAS[name];
    if (k) ACTIONS[k]();
    else print(fmt(L().term.notFound, esc(name)), 'e');
  }
  function termIntro() {
    var T = L().term;
    out.innerHTML = '';
    print('<span class="p">~ $</span> whoami'); print('junior full stack developer · Madrid');
    print('<span class="p">~ $</span> cat ' + T.goalFile); print(T.goal);
    print(T.hint, 'c');
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); run(input.value); input.value = ''; });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp' && hi > 0) { hi--; input.value = hist[hi]; e.preventDefault(); }
    else if (e.key === 'ArrowDown') { hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ''; e.preventDefault(); }
    else if (e.key === 'Tab' && input.value) {
      var v = input.value.toLowerCase();
      var m = Object.keys(ALIAS).filter(function (a) { return a.indexOf(v) === 0; });
      var mine = m.filter(function (a) { return a === cmdName(ALIAS[a]); });
      var pick = mine.length === 1 ? mine[0] : (m.length === 1 ? m[0] : null);
      if (pick) { input.value = pick; e.preventDefault(); }
    }
  });
  document.getElementById('term').addEventListener('click', function (e) { if (!e.target.closest('a') && !getSelection().toString()) input.focus({ preventScroll: true }); });
  var chips = document.querySelectorAll('[data-cmd]');
  chips.forEach(function (b) { b.addEventListener('click', function () { run(cmdName(b.dataset.cmd)); }); });

  /* ---------- Idioma ---------- */
  var select = document.getElementById('lang-select');
  function applyLang(l) {
    lang = I[l] ? l : 'es';
    document.documentElement.lang = lang;
    document.title = L().meta.title;
    document.getElementById('meta-desc').setAttribute('content', L().meta.desc);
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) { el.innerHTML = t(el.dataset.i18nHtml); });
    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.dataset.i18nAttr.split(';').forEach(function (pair) { var p = pair.split(':'); el.setAttribute(p[0], t(p[1])); });
    });
    ['sobre', 'proyectos', 'experiencia', 'contacto'].forEach(function (id) { document.getElementById('tpl-' + id).innerHTML = L().tpl[id]; });
    Object.keys(wins).forEach(function (id) { fillWin(wins[id], id); });
    chips.forEach(function (b) { b.textContent = cmdName(b.dataset.cmd); });
    setShot(main.dataset.k || 'ranking');
    select.value = lang;
    tick(); renderCal(); updateThemeBtn();
    if (!typed) termIntro(); else print(L().term.hint, 'c');
  }
  select.addEventListener('change', function () { store('lang', select.value); applyLang(select.value); });

  /* ---------- Modo claro / oscuro ---------- */
  var root = document.documentElement, themeBtn = document.getElementById('theme-btn');
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  function isDark() { return root.dataset.theme ? root.dataset.theme === 'dark' : mq.matches; }
  function updateThemeBtn() {
    var dark = isDark();
    themeBtn.setAttribute('aria-label', t(dark ? 'theme.toLight' : 'theme.toDark'));
    themeBtn.title = themeBtn.getAttribute('aria-label');
    themeBtn.setAttribute('aria-pressed', String(dark));
    document.getElementById('meta-theme').setAttribute('content', dark ? '#141a21' : '#eef3f6');
  }
  themeBtn.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next; store('theme', next); updateThemeBtn();
  });
  if (mq.addEventListener) mq.addEventListener('change', updateThemeBtn);

  /* ---------- Arranque ---------- */
  // Pantalla de carga: se muestra una vez por visita, mínimo ~1,3 s y hasta que la página haya cargado
  var boot = document.getElementById('boot');
  if (boot && !root.classList.contains('no-boot')) {
    var t0 = Date.now(), MIN = 1300;
    var hideBoot = function () {
      setTimeout(function () {
        boot.classList.add('is-done');
        try { sessionStorage.setItem('booted', '1'); } catch (e) {}
        setTimeout(function () { boot.remove(); }, 600);
      }, Math.max(0, MIN - (Date.now() - t0)));
    };
    if (document.readyState === 'complete') hideBoot(); else window.addEventListener('load', hideBoot);
  } else if (boot) { boot.remove(); }
  var saved = load('lang');
  var nav = (navigator.languages && navigator.languages[0] || navigator.language || 'es').slice(0, 2).toLowerCase();
  applyLang(saved && I[saved] ? saved : (I[nav] ? nav : 'es'));
})();
