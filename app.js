(function () {
  'use strict';

  var DAYS = 7;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  // Browser storage can be blocked (private mode, previews); never let that break the page.
  var store = {
    get: function (k, fallback) {
      try { var v = localStorage.getItem('aze7.' + k); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set: function (k, v) { try { localStorage.setItem('aze7.' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };

  var announcer = $('#announce');
  function announce(msg) {
    if (!announcer) return;
    announcer.textContent = '';
    setTimeout(function () { announcer.textContent = msg; }, 30);
  }

  /* ---------- Dates ---------- */
  var startInput = $('#start');
  var dayLabels = [];

  function parseDate(s) {
    var p = String(s || '').split('-').map(Number);
    var d = new Date(Date.UTC(p[0], (p[1] || 1) - 1, p[2] || 1));
    return isNaN(d.getTime()) ? null : d;
  }
  function addDays(d, n) { return new Date(d.getTime() + n * 86400000); }
  function fmt(d, opts) { return d.toLocaleDateString('en-GB', Object.assign({ timeZone: 'UTC' }, opts)); }
  function iso(d) { return d.toISOString().slice(0, 10); }

  function applyDates() {
    var start = parseDate(startInput && startInput.value) || parseDate('2027-03-08');
    dayLabels = [];
    for (var i = 0; i < DAYS; i++) dayLabels.push(fmt(addDays(start, i), { weekday: 'short', day: 'numeric', month: 'short' }));
    $$('time[data-day]').forEach(function (t) {
      var d = addDays(start, Number(t.getAttribute('data-day')));
      t.textContent = dayLabels[Number(t.getAttribute('data-day'))];
      t.setAttribute('datetime', iso(d));
    });
    var end = addDays(start, DAYS - 1);
    var range = $('#range');
    if (range) range.textContent = fmt(start, { day: 'numeric', month: 'short' }) + ' – ' + fmt(end, { day: 'numeric', month: 'short', year: 'numeric' });
    $$('.tl-date').forEach(function (s) { s.textContent = dayLabels[Number(s.getAttribute('data-i'))]; });
  }
  if (startInput) {
    startInput.value = store.get('start', startInput.value);
    startInput.addEventListener('change', function () { store.set('start', startInput.value); applyDates(); });
  }

  /* ---------- Places ---------- */
  var SPOTS = [
    { id: 'airport', name: 'Heydar Aliyev Airport (GYD)', area: 'Baku', q: 'Heydar Aliyev International Airport' },
    { id: 'boulevard', name: 'Caspian Boulevard', area: 'Baku', q: 'Baku Boulevard' },
    { id: 'flame', name: 'Flame Towers', area: 'Baku', q: 'Flame Towers, Baku' },
    { id: 'maiden', name: 'Maiden Tower', area: 'Baku', q: 'Maiden Tower, Baku' },
    { id: 'shirvan', name: 'Palace of the Shirvanshahs', area: 'Baku', q: 'Palace of the Shirvanshahs, Baku' },
    { id: 'fountain', name: 'Fountain Square & Nizami St', area: 'Baku', q: 'Fountains Square, Baku' },
    { id: 'highland', name: 'Highland Park & funicular', area: 'Baku', q: 'Highland Park, Baku' },
    { id: 'carpet', name: 'Carpet Museum', area: 'Baku', q: 'Azerbaijan National Carpet Museum, Baku' },
    { id: 'hac', name: 'Heydar Aliyev Center', area: 'Baku', q: 'Heydar Aliyev Center, Baku' },
    { id: 'taza', name: 'Taza Bazaar', area: 'Baku', q: 'Taza Bazaar, Baku' },
    { id: 'gobustan', name: 'Gobustan rock art', area: 'Absheron', q: 'Gobustan National Park' },
    { id: 'mud', name: 'Mud volcanoes', area: 'Absheron', q: 'Gobustan mud volcanoes' },
    { id: 'bibiheybat', name: 'Bibi-Heybat Mosque', area: 'Absheron', q: 'Bibi-Heybat Mosque' },
    { id: 'ateshgah', name: 'Ateshgah Fire Temple', area: 'Absheron', q: 'Ateshgah Fire Temple, Surakhani' },
    { id: 'yanardag', name: 'Yanar Dag', area: 'Absheron', q: 'Yanar Dag, Azerbaijan' },
    { id: 'diribaba', name: 'Diri Baba Mausoleum', area: 'Shamakhi & Gabala', q: 'Diri Baba Mausoleum, Maraza' },
    { id: 'shamakhi', name: 'Juma Mosque, Shamakhi', area: 'Shamakhi & Gabala', q: 'Juma Mosque, Shamakhi' },
    { id: 'gabala', name: 'Gabala town', area: 'Shamakhi & Gabala', q: 'Gabala, Azerbaijan' },
    { id: 'tufandag', name: 'Tufandag gondola', area: 'Shamakhi & Gabala', q: 'Tufandag Mountain Resort, Gabala' },
    { id: 'nohur', name: 'Nohur Lake', area: 'Shamakhi & Gabala', q: 'Nohur Lake, Gabala' },
    { id: 'sheki', name: 'Palace of the Sheki Khans', area: 'Sheki', q: 'Palace of Shaki Khans' },
    { id: 'caravan', name: 'Upper Caravanserai', area: 'Sheki', q: 'Upper Caravanserai, Sheki' },
    { id: 'kish', name: 'Kish Albanian church', area: 'Sheki', q: 'Church of Kish' },
    { id: 'candy', name: 'Candy Cane Mountains', area: 'Swap-ins: north', q: 'Candy Cane Mountains, Khizi' },
    { id: 'shahdag', name: 'Shahdag ski resort', area: 'Swap-ins: north', q: 'Shahdag Mountain Resort' },
    { id: 'redvillage', name: 'Red Village, Quba', area: 'Swap-ins: north', q: 'Qirmizi Qesebe, Quba' }
  ];
  var BY_ID = {};
  SPOTS.forEach(function (s) { BY_ID[s.id] = s; });

  var SUGGESTED = [
    ['airport', 'boulevard', 'flame'],
    ['maiden', 'shirvan', 'fountain', 'highland'],
    ['gobustan', 'bibiheybat', 'ateshgah', 'yanardag'],
    ['diribaba', 'shamakhi', 'gabala'],
    ['sheki', 'caravan', 'kish'],
    ['tufandag', 'nohur'],
    ['hac', 'taza', 'airport']
  ];

  function mapsUrl(ids) {
    var stops = ids.map(function (id) { return BY_ID[id].q; });
    if (!stops.length) return null;
    if (stops.length === 1) return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(stops[0]);
    var url = 'https://www.google.com/maps/dir/?api=1&travelmode=driving'
      + '&origin=' + encodeURIComponent(stops[0])
      + '&destination=' + encodeURIComponent(stops[stops.length - 1]);
    var mid = stops.slice(1, -1).slice(0, 9);
    if (mid.length) url += '&waypoints=' + mid.map(encodeURIComponent).join('%7C');
    return url;
  }

  // Suggested plan links on the static day cards
  $$('a[data-map]').forEach(function (a) {
    var url = mapsUrl(SUGGESTED[Number(a.getAttribute('data-map')) - 1]);
    if (url) a.href = url;
  });

  /* ---------- Planner state ---------- */
  var uidN = 0;
  function item(id) { uidN += 1; return { uid: 'p' + uidN, id: id }; }
  function fromIds(days) {
    return days.map(function (d) { return d.filter(function (id) { return BY_ID[id]; }).map(item); });
  }
  var saved = store.get('plan', null);
  var plan = fromIds(Array.isArray(saved) && saved.length === DAYS ? saved : SUGGESTED);

  function save() { store.set('plan', plan.map(function (d) { return d.map(function (it) { return it.id; }); })); }
  function findItem(uid) {
    for (var d = 0; d < plan.length; d++) {
      for (var i = 0; i < plan[d].length; i++) if (plan[d][i].uid === uid) return { day: d, index: i };
    }
    return null;
  }

  /* ---------- Library ---------- */
  var library = $('#library');
  function dayOptions(selected) {
    var html = '';
    for (var i = 0; i < DAYS; i++) html += '<option value="' + i + '"' + (i === selected ? ' selected' : '') + '>Day ' + (i + 1) + '</option>';
    return html;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function renderLibrary() {
    if (!library) return;
    var groups = {};
    SPOTS.forEach(function (s) { (groups[s.area] = groups[s.area] || []).push(s); });
    var html = '';
    Object.keys(groups).forEach(function (area, gi) {
      html += '<div class="group" role="group" aria-labelledby="g' + gi + '"><h4 id="g' + gi + '">' + esc(area) + '</h4>';
      groups[area].forEach(function (s) {
        html += '<div class="spot" draggable="true" data-spot="' + s.id + '">'
          + '<span class="name">' + esc(s.name) + '</span>'
          + '<span class="ctrls"><label class="sr-only" for="pick-' + s.id + '">Day for ' + esc(s.name) + '</label>'
          + '<select id="pick-' + s.id + '">' + dayOptions(0) + '</select>'
          + '<button type="button" class="btn small" data-add="' + s.id + '" aria-label="Add ' + esc(s.name) + ' to the chosen day">Add</button>'
          + '</span></div>';
      });
      html += '</div>';
    });
    library.innerHTML = html;
  }

  /* ---------- Timeline ---------- */
  var timeline = $('#timeline');
  var ICON = {
    up: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>',
    down: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };

  function renderTimeline() {
    if (!timeline) return;
    var html = '';
    plan.forEach(function (day, d) {
      var url = mapsUrl(day.map(function (it) { return it.id; }));
      html += '<section class="tl-day" data-day="' + d + '" aria-labelledby="tl-h' + d + '">'
        + '<header><h4 id="tl-h' + d + '">Day ' + (d + 1) + '<span class="tl-date" data-i="' + d + '">' + (dayLabels[d] || '') + '</span></h4>'
        + (url
          ? '<a class="btn small ext" href="' + esc(url) + '" target="_blank" rel="noopener">Open day ' + (d + 1) + ' in Google Maps<span class="sr-only"> (opens in a new tab)</span></a>'
          : '')
        + '</header><ol class="tl-list" aria-label="Day ' + (d + 1) + ' places">';
      day.forEach(function (it, i) {
        var s = BY_ID[it.id];
        html += '<li class="tl-item" draggable="true" data-uid="' + it.uid + '">'
          + '<span class="ord" aria-hidden="true">' + (i + 1) + '</span>'
          + '<span class="name">' + esc(s.name) + '</span>'
          + '<span class="ctrls">'
          + '<button type="button" class="icon-btn" data-act="up" aria-label="Move ' + esc(s.name) + ' earlier"' + (i === 0 ? ' disabled' : '') + '>' + ICON.up + '</button>'
          + '<button type="button" class="icon-btn" data-act="down" aria-label="Move ' + esc(s.name) + ' later"' + (i === day.length - 1 ? ' disabled' : '') + '>' + ICON.down + '</button>'
          + '<label class="sr-only" for="mv-' + it.uid + '">Move ' + esc(s.name) + ' to day</label>'
          + '<select id="mv-' + it.uid + '" data-act="move">' + dayOptions(d) + '</select>'
          + '<button type="button" class="icon-btn" data-act="remove" aria-label="Remove ' + esc(s.name) + ' from day ' + (d + 1) + '">' + ICON.x + '</button>'
          + '</span></li>';
      });
      html += '</ol></section>';
    });
    timeline.innerHTML = html;
  }

  function refresh(focusSel) {
    save();
    renderTimeline();
    if (focusSel) {
      var el = timeline.querySelector(focusSel);
      if (el && !el.disabled) el.focus();
      else if (el) { var alt = el.closest('.tl-item').querySelector('select'); if (alt) alt.focus(); }
    }
  }

  function addSpot(id, day, index) {
    var it = item(id);
    var list = plan[day];
    if (index == null || index > list.length) index = list.length;
    list.splice(index, 0, it);
    announce(BY_ID[id].name + ' added to day ' + (day + 1) + ', position ' + (index + 1) + '.');
    return it;
  }
  function moveItem(uid, day, index) {
    var at = findItem(uid);
    if (!at) return;
    var it = plan[at.day].splice(at.index, 1)[0];
    if (at.day === day && index != null && index > at.index) index -= 1;
    var list = plan[day];
    if (index == null || index > list.length) index = list.length;
    list.splice(index, 0, it);
    announce(BY_ID[it.id].name + ' moved to day ' + (day + 1) + ', position ' + (index + 1) + '.');
  }

  if (library) {
    library.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-add]');
      if (!btn) return;
      var id = btn.getAttribute('data-add');
      var day = Number($('#pick-' + id).value);
      addSpot(id, day);
      refresh();
    });
  }

  if (timeline) {
    timeline.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-act]');
      if (!btn) return;
      var li = btn.closest('.tl-item');
      var uid = li.getAttribute('data-uid');
      var at = findItem(uid);
      var act = btn.getAttribute('data-act');
      if (act === 'up' && at.index > 0) { moveItem(uid, at.day, at.index - 1); refresh('[data-uid="' + uid + '"] [data-act="up"]'); }
      else if (act === 'down') { moveItem(uid, at.day, at.index + 2); refresh('[data-uid="' + uid + '"] [data-act="down"]'); }
      else if (act === 'remove') {
        var name = BY_ID[plan[at.day][at.index].id].name;
        plan[at.day].splice(at.index, 1);
        var next = plan[at.day][at.index] || plan[at.day][at.index - 1];
        announce(name + ' removed from day ' + (at.day + 1) + '.');
        refresh(next ? '[data-uid="' + next.uid + '"] [data-act="remove"]' : null);
        if (!next) { var h = $('#tl-h' + at.day); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); } }
      }
    });
    timeline.addEventListener('change', function (e) {
      var sel = e.target.closest('select[data-act="move"]');
      if (!sel) return;
      var uid = sel.closest('.tl-item').getAttribute('data-uid');
      moveItem(uid, Number(sel.value));
      refresh('#mv-' + uid);
    });
  }

  /* Drag and drop (mouse); keyboard and touch users have the buttons above */
  var dragData = null;
  document.addEventListener('dragstart', function (e) {
    var spot = e.target.closest && e.target.closest('.spot');
    var tl = e.target.closest && e.target.closest('.tl-item');
    if (spot) dragData = { spot: spot.getAttribute('data-spot') };
    else if (tl) dragData = { uid: tl.getAttribute('data-uid') };
    else return;
    (spot || tl).classList.add('dragging');
    try { e.dataTransfer.setData('text/plain', JSON.stringify(dragData)); e.dataTransfer.effectAllowed = 'move'; } catch (err) { /* ignore */ }
  });
  document.addEventListener('dragend', function () {
    dragData = null;
    $$('.dragging').forEach(function (el) { el.classList.remove('dragging'); });
    $$('.tl-day.over').forEach(function (el) { el.classList.remove('over'); });
  });
  if (timeline) {
    timeline.addEventListener('dragover', function (e) {
      var zone = e.target.closest('.tl-day');
      if (!zone || !dragData) return;
      e.preventDefault();
      $$('.tl-day.over').forEach(function (el) { if (el !== zone) el.classList.remove('over'); });
      zone.classList.add('over');
    });
    timeline.addEventListener('dragleave', function (e) {
      var zone = e.target.closest('.tl-day');
      if (zone && !zone.contains(e.relatedTarget)) zone.classList.remove('over');
    });
    timeline.addEventListener('drop', function (e) {
      var zone = e.target.closest('.tl-day');
      if (!zone || !dragData) return;
      e.preventDefault();
      var day = Number(zone.getAttribute('data-day'));
      var target = e.target.closest('.tl-item');
      var index = null;
      if (target) {
        var at = findItem(target.getAttribute('data-uid'));
        var r = target.getBoundingClientRect();
        index = at.index + (e.clientY > r.top + r.height / 2 ? 1 : 0);
      }
      if (dragData.spot) addSpot(dragData.spot, day, index);
      else if (dragData.uid) moveItem(dragData.uid, day, index);
      dragData = null;
      refresh();
    });
  }

  /* Planner tools */
  function planText() {
    return plan.map(function (day, d) {
      var lines = day.map(function (it, i) { return '  ' + (i + 1) + '. ' + BY_ID[it.id].name; });
      return 'Day ' + (d + 1) + ' (' + dayLabels[d] + ')\n' + (lines.length ? lines.join('\n') : '  (free day)');
    }).join('\n\n');
  }
  function onClick(id, fn) { var el = $(id); if (el) el.addEventListener('click', fn); }

  onClick('#reset-plan', function () { plan = fromIds(SUGGESTED); refresh(); announce('Plan reset to the suggested itinerary.'); });
  onClick('#clear-plan', function () {
    if (!window.confirm('Remove every place from all seven days?')) return;
    plan = fromIds([[], [], [], [], [], [], []]); refresh(); announce('All days cleared.');
  });
  onClick('#copy-plan', function () {
    var text = 'Azerbaijan – my 7-day plan\n\n' + planText();
    var done = function () { announce('Plan copied to the clipboard.'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { window.prompt('Copy your plan:', text); });
    } else { window.prompt('Copy your plan:', text); }
  });
  onClick('#csv-plan', function () {
    var rows = [['Day', 'Date', 'Order', 'Place', 'Location']];
    plan.forEach(function (day, d) {
      day.forEach(function (it, i) { var s = BY_ID[it.id]; rows.push(['Day ' + (d + 1), dayLabels[d], i + 1, s.name, s.q + ', Azerbaijan']); });
    });
    var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
    var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'azerbaijan-7-day-plan.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    announce('CSV downloaded. In Google My Maps, choose Import and select this file.');
  });

  /* ---------- Budget ---------- */
  // Rough USD planning figures per unit; not quotes.
  var STYLES = [
    { name: 'Shoestring', desc: 'Guesthouses and budget hotels, metro, Bolt and shared minibuses, cafés and bakeries.', room: 40, food: 15, transit: 45, act: 8, baby: 8 },
    { name: 'Comfort', desc: 'Mid-range hotels, private van with driver, local restaurants.', room: 80, food: 30, transit: 90, act: 15, baby: 12 },
    { name: 'Premium', desc: 'Four-star hotels and resorts, a newer van and experienced driver, good restaurants, some guided visits.', room: 150, food: 55, transit: 130, act: 30, baby: 15 },
    { name: 'Luxury', desc: 'Five-star hotels, premium van, fine dining and a private guide each day.', room: 300, food: 100, transit: 200, act: 60, baby: 20 }
  ];
  // Fallback rates (2 Nov 2026); refreshed from open.er-api.com when the page loads.
  var RATES = { USD: 1, INR: 95.08, AZN: 1.70 };
  var LOCALE = { USD: 'en-US', INR: 'en-IN', AZN: 'en-GB' };
  var rateDate = '2 Nov 2026';
  var styleIn = $('#style'), adultsIn = $('#adults'), nightsIn = $('#nights'), curIn = $('#currency'), infantIn = $('#infant');

  function clampInt(el, min, max, fallback) {
    var n = parseInt(el.value, 10);
    if (isNaN(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  function renderBudget() {
    if (!styleIn) return;
    var st = STYLES[Number(styleIn.value)] || STYLES[1];
    var adults = clampInt(adultsIn, 1, 12, 5);
    var nights = clampInt(nightsIn, 1, 21, 6);
    var days = nights + 1;
    var infant = infantIn.checked;
    var cur = RATES[curIn.value] ? curIn.value : 'INR';
    var rate = RATES[cur];
    var money = new Intl.NumberFormat(LOCALE[cur], { style: 'currency', currency: cur, maximumFractionDigits: 0 });
    // Rupee figures rounded to the nearest ₹100 so estimates don't look falsely precise
    var step = cur === 'INR' ? 100 : 1;
    var m = function (usd) { return money.format(Math.round(usd * rate / step) * step); };

    var rooms = Math.ceil(adults / 2);
    var vehicles = Math.ceil(adults / 6);
    var lines = [
      { k: 'Accommodation', sub: rooms + ' room' + (rooms > 1 ? 's' : '') + ' per night', v: rooms * st.room, nightsOnly: true },
      { k: 'Food & drink', sub: adults + ' adult' + (adults > 1 ? 's' : '') + ', three meals and snacks', v: adults * st.food },
      { k: 'Transport', sub: vehicles > 1 ? vehicles + ' vehicles with drivers' : (st.name === 'Shoestring' ? 'Taxis, metro and minibuses' : 'Van with driver'), v: vehicles * st.transit },
      { k: 'Activities & tickets', sub: 'Entry fees, gondola, guides', v: adults * st.act }
    ];
    if (infant) lines.push({ k: 'Baby supplies', sub: 'Nappies, food, extras', v: st.baby });

    var perDay = lines.reduce(function (a, l) { return a + l.v; }, 0);
    var trip = lines.reduce(function (a, l) { return a + l.v * (l.nightsOnly ? nights : days); }, 0);
    var max = Math.max.apply(null, lines.map(function (l) { return l.v; }));

    $('#style-name').textContent = st.name;
    $('#style-desc').textContent = st.desc;
    styleIn.setAttribute('aria-valuetext', st.name);

    $('#totals').innerHTML =
      '<div class="total"><span>Per day, whole group</span><strong>' + m(perDay) + '</strong></div>'
      + '<div class="total"><span>Per adult, per day</span><strong>' + m(perDay / adults) + '</strong></div>'
      + '<div class="total"><span>Whole trip · ' + days + ' days</span><strong>' + m(trip) + '</strong></div>';

    $('#bars').innerHTML = lines.map(function (l) {
      return '<li><span class="lbl">' + l.k + '<small>' + l.sub + '</small></span>'
        + '<span class="val">' + m(l.v) + (l.nightsOnly ? ' / night' : ' / day') + '</span>'
        + '<span class="bar" aria-hidden="true"><i style="width:' + Math.max(4, Math.round(l.v / max * 100)) + '%"></i></span></li>';
    }).join('');

    var note = $('#rate-note');
    if (note) note.textContent = 'Exchange rate: 1 USD ≈ ₹' + RATES.INR.toFixed(2) + ' ≈ ' + RATES.AZN.toFixed(2) + ' AZN (' + rateDate + ').';

    store.set('budget2', { style: styleIn.value, adults: adults, nights: nights, cur: cur, infant: infant });
  }

  function refreshRates() {
    if (!window.fetch) return;
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.rates || !(j.rates.INR > 0) || !(j.rates.AZN > 0)) return;
        RATES.INR = j.rates.INR;
        RATES.AZN = j.rates.AZN;
        var d = new Date((j.time_last_update_unix || 0) * 1000);
        if (!isNaN(d.getTime()) && d.getTime() > 0) rateDate = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        renderBudget();
      })
      .catch(function () { /* keep fallback rates */ });
  }

  if (styleIn) {
    var b = store.get('budget2', null);
    if (b) {
      styleIn.value = b.style; adultsIn.value = b.adults; nightsIn.value = b.nights; curIn.value = b.cur; infantIn.checked = b.infant;
    }
    [styleIn, adultsIn, nightsIn, curIn, infantIn].forEach(function (el) {
      el.addEventListener('input', renderBudget);
      el.addEventListener('change', renderBudget);
    });
  }

  /* ---------- Checklist ---------- */
  var checks = store.get('checks', {});
  $$('input[data-check]').forEach(function (c) {
    var k = c.getAttribute('data-check');
    c.checked = !!checks[k];
    c.addEventListener('change', function () { checks[k] = c.checked; store.set('checks', checks); });
  });

  /* ---------- Go ---------- */
  applyDates();
  renderLibrary();
  renderTimeline();
  renderBudget();
  refreshRates();
})();
