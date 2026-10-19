(function () {
  var TITLES = { sobre: 'Sobre mí', proyectos: 'Proyectos', experiencia: 'Experiencia', contacto: 'Contacto' };
  var wins = {}, z = 30, offset = 0;

  function openWin(id) {
    if (wins[id]) { focus(wins[id]); return; }
    var w = document.createElement('div');
    w.className = 'win'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', TITLES[id]);
    w.innerHTML = '<div class="titlebar"><div class="lights"><button class="close" aria-label="Cerrar"></button><button class="min" aria-label="Minimizar"></button><button class="max" aria-label="Ampliar"></button></div><span class="t">' + TITLES[id] + '</span></div><div class="win-body"></div>';
    w.querySelector('.win-body').appendChild(document.getElementById('tpl-' + id).content.cloneNode(true));
    document.body.appendChild(w);
    var vw = window.innerWidth;
    var left = Math.max(12, (vw - w.offsetWidth) / 2 + offset);
    w.style.left = left + 'px'; w.style.top = (70 + offset) + 'px';
    offset = (offset + 28) % 140;
    wins[id] = w; focus(w); markDock();
    w.addEventListener('pointerdown', function () { focus(w); });
    w.querySelector('.close').onclick = w.querySelector('.min').onclick = function () { closeWin(id); };
    w.querySelector('.max').onclick = function () {
      w.style.left = '12px'; w.style.top = '46px'; w.style.width = 'calc(100vw - 24px)';
    };
    drag(w);
    var copy = w.querySelector('.js-copy');
    if (copy) copy.onclick = function () {
      var em = w.querySelector('.js-email'), ok = w.querySelector('.js-ok');
      function sel() { var r = document.createRange(); r.selectNodeContents(em); var s = getSelection(); s.removeAllRanges(); s.addRange(r); ok.textContent = 'Seleccionado, pulsa Ctrl+C'; }
      try { navigator.clipboard.writeText(em.textContent).then(function () { ok.textContent = 'Copiado'; }, sel); } catch (e) { sel(); }
    };
  }
  function closeWin(id) { if (wins[id]) { wins[id].remove(); delete wins[id]; markDock(); } }
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

  // Reloj y fecha
  function tick() {
    var d = new Date();
    var hm = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
    document.getElementById('w-clock').textContent = hm;
    document.getElementById('w-date').textContent = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' });
    document.getElementById('menu-clock').textContent = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) + '  ' + hm;
  }
  tick(); setInterval(tick, 15000);

  // Calendario del mes actual
  (function () {
    var d = new Date(), y = d.getFullYear(), m = d.getMonth(), today = d.getDate();
    document.getElementById('cal-month').textContent = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
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
  })();

  // Actividad GitHub de ejemplo (semilla fija)
  (function () {
    var seed = 7, total = 0, grid = document.getElementById('gh-grid'), frag = document.createDocumentFragment();
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var colors = ['var(--g0)', 'var(--g1)', 'var(--g2)', 'var(--g3)', 'var(--g4)'];
    for (var i = 0; i < 53 * 7; i++) {
      var ramp = i / (53 * 7), v = rnd() * (0.6 + ramp), lvl = v < .45 ? 0 : v < .75 ? 1 : v < 1 ? 2 : v < 1.25 ? 3 : 4;
      total += [0, 1, 3, 6, 10][lvl];
      var el = document.createElement('i'); el.style.background = colors[lvl]; frag.appendChild(el);
    }
    grid.appendChild(frag);
    document.getElementById('gh-total').textContent = total;
    var sc = grid.parentElement; sc.scrollLeft = sc.scrollWidth;
  })();

  // Notas
  var ta = document.getElementById('notes'), nc = document.getElementById('notes-count');
  function count() { nc.textContent = ta.value.length; }
  ta.addEventListener('input', count); count();
})();
