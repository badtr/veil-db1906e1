// Porcelain Ballerina — small fittings: release seal, daily oracle, music box, numbers room, hidden room door.
import { ROOT } from './env.js';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pad = (n) => String(n).padStart(2, '0');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// preview hook for local screenshots only: ?pbnow=2026-12-05T00:00:01%2B01:00
const NOW = (() => { const q = new URLSearchParams(location.search).get('pbnow'); const t = q ? Date.parse(q) : NaN; const off = isNaN(t) ? 0 : t - Date.now(); return () => new Date(Date.now() + off); })();
let timers = [];

// ---------- release seal ----------
function release(root) {
  $$('[data-release]', root).forEach((sec) => {
    const at = Date.parse(sec.dataset.release); const box = $('[data-release-count]', sec);
    const tick = () => {
      const left = at - NOW().getTime();
      if (left <= 0) { $$('.rl-links', sec).forEach((l) => { l.hidden = l.dataset.when !== 'after'; }); sec.classList.add('is-open'); box.hidden = true; $('.rl-open', sec).hidden = false; $('.rl-k', sec).textContent = 'Released'; $('.rl-note', sec).hidden = true; return false; }
      const s = Math.floor(left / 1000);
      $('[data-u="d"]', box).textContent = Math.floor(s / 86400); $('[data-u="h"]', box).textContent = pad(Math.floor(s / 3600) % 24);
      $('[data-u="m"]', box).textContent = pad(Math.floor(s / 60) % 60); $('[data-u="s"]', box).textContent = pad(s % 60);
      return true;
    };
    if (tick()) { const id = setInterval(() => { if (!tick()) clearInterval(id); }, 1000); timers.push(id); }
  });
}

// ---------- daily oracle ----------
let ORACLE = null;
const loadOracle = () => ORACLE || (ORACLE = fetch(new URL('oracle.json?v=' + (document.querySelector('link[href*="style.css"]')?.getAttribute('href').split('?v=')[1] || ''), ROOT)).then((r) => r.json()));
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
function oracle(root) {
  $$('[data-oracle]', root).forEach(async (sec) => {
    let lines; try { lines = await loadOracle(); } catch (e) { sec.hidden = true; return; }
    if (!lines.length) { sec.hidden = true; return; }
    let todayIdx = 0;
    const show = (i, daily) => {
      const o = lines[i];
      $('[data-oracle-en]', sec).textContent = o.en;
      const oo = $('[data-oracle-o]', sec); oo.textContent = o.o ? `${o.o}${o.lang ? ' · ' + o.lang : ''}` : ''; oo.hidden = !o.o;
      const song = o.url ? `<a href="${new URL(o.url, ROOT).href}">${esc(o.song)}</a>` : esc(o.song);
      $('[data-oracle-src]', sec).innerHTML = `From ${song} &middot; ${esc(o.album)}`;
      $('[data-oracle-today]', sec).hidden = daily;
      $('.oracle-k span', sec).textContent = daily ? NOW().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'a line drawn for you';
      sec.classList.remove('is-drawn'); void sec.offsetWidth; sec.classList.add('is-drawn');
    };
    const today = () => { todayIdx = hash(dayKey(NOW())) % lines.length; show(todayIdx, true); };
    today();
    if (!sec.dataset.bound) {
      sec.dataset.bound = '1';
      $('[data-oracle-draw]', sec).addEventListener('click', () => { rite('oracle'); let i; do { i = Math.floor(Math.random() * lines.length); } while (lines.length > 1 && i === todayIdx); show(i, false); });
      $('[data-oracle-today]', sec).addEventListener('click', today);
    }
    // turn the page at midnight
    const n = NOW(); const mid = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, 0, 2) - n;
    timers.push(setTimeout(today, Math.min(mid, 2147483000)));
  });
}

// ---------- music box (only plays a local released file when one exists) ----------
function musicbox(root) {
  $$('[data-musicbox].has-audio', root).forEach((mb) => {
    const au = $('audio', mb), btn = $('.mb-play', mb), bar = $('.mb-bar i', mb), tm = $('.mb-time', mb);
    const fmt = (t) => `${Math.floor(t / 60)}:${pad(Math.floor(t % 60))}`;
    btn.addEventListener('click', () => { if (au.paused) au.play(); else au.pause(); });
    au.addEventListener('play', () => { mb.classList.add('is-playing'); $('.mb-play-t', mb).textContent = 'Stop the box'; });
    au.addEventListener('pause', () => { mb.classList.remove('is-playing'); $('.mb-play-t', mb).textContent = 'Wind the box'; });
    au.addEventListener('timeupdate', () => { bar.style.width = (au.duration ? (au.currentTime / au.duration) * 100 : 0) + '%'; tm.textContent = fmt(au.currentTime); });
  });
}

// ---------- numbers room ----------
function numbers(root) {
  const room = $('[data-numbers]', root); if (!room || room.dataset.bound) return; room.dataset.bound = '1';
  const D = JSON.parse($('#num-data', room).textContent); const M = new Set(D.masters);
  const digits = (n) => String(n).split('').reduce((a, b) => a + +b, 0);
  const reduce = (n, steps) => { while (n > 9 && !M.has(n)) { const m = digits(n); steps.push(`${String(n).split('').join(' + ')} = ${m}`); n = m; } return n; };
  const form = $('.num-form', room), out = $('.num-results', room), err = $('.num-err', room);
  const card = (kind, n, how) => { const r = D.readings[String(n)]; return `<article class="num-card"><p class="nc-k">${kind}</p><p class="nc-n">${n}${M.has(n) ? '<small>master number</small>' : ''}</p><h2 class="nc-t">${esc(r.title)}</h2><div class="nc-text">${r.text.split('\n').map((l) => `<p>${esc(l)}</p>`).join('')}</div><p class="nc-how">${how}</p></article>`; };
  form.addEventListener('submit', (e) => {
    e.preventDefault(); err.hidden = true; let html = '';
    const dv = form.date.value, nv = form.name.value.trim();
    if (!dv && !nv) { err.textContent = 'Give the room a birth date, a name, or both.'; err.hidden = false; out.innerHTML = ''; return; }
    if (dv) {
      const [y, m, d] = dv.split('-').map(Number); const st = [];
      const rd = reduce(d, st.slice()), rm = reduce(m, []), ry = reduce(y, []);
      const sum = rd + rm + ry; const steps = []; const lp = reduce(sum, steps);
      html += card('Life path', lp, `Day ${d} &rarr; ${rd}. Month ${m} &rarr; ${rm}. Year ${y} &rarr; ${ry}. Then ${rd} + ${rm} + ${ry} = ${sum}${steps.length ? ' &rarr; ' + lp : ''}.`);
    }
    if (nv) {
      const clean = nv.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/Æ/g, 'AE').replace(/Ø/g, 'O').replace(/ß/g, 'SS').replace(/[^A-Z]/g, '');
      if (!clean) { err.textContent = 'The room only counts the letters A to Z.'; err.hidden = false; }
      else { const tot = [...clean].reduce((a, c) => a + D.table[c], 0); const steps = []; const ex = reduce(tot, steps); html += card('Expression', ex, `${clean.length} letters, valued and added: ${tot}${tot !== ex ? ' &rarr; ' + ex : ''}.`); }
    }
    if (html) rite('numbers');
    out.innerHTML = html; out.classList.remove('is-drawn'); void out.offsetWidth; out.classList.add('is-drawn');
    out.firstElementChild?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  });
  form.addEventListener('reset', () => { out.innerHTML = ''; err.hidden = true; });
}

// ---------- hidden room door (only exists in a local build made with PB_HIDDEN_ROOM=1) ----------
const ROOM = () => document.body.dataset.room === '1';
const SECRET = 'sub lucerna';
const goRoom = () => { location.href = new URL('sealed-room.html', ROOT).href; };
document.addEventListener('click', (e) => { if (ROOM() && e.target.closest('.foot-sigil, .fig-sigil')) goRoom(); });
document.addEventListener('keydown', (e) => {
  if (!ROOM() || e.key !== 'Enter' || e.target.id !== 'ss-input') return;
  if (e.target.value.trim().toLowerCase().replace(/\s+/g, ' ') === SECRET) { e.preventDefault(); e.stopImmediatePropagation(); goRoom(); }
}, true);


// ---------- album search on albums.html: live filter + suggestions (reuses search-index.json) ----------
let IDX = null;
const loadIdx = () => IDX || (IDX = fetch(new URL('search-index.json?v=' + (document.querySelector('link[href*="style.css"]')?.getAttribute('href').split('?v=')[1] || ''), ROOT)).then((r) => r.json()).then((d) => d.items));
const nrm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\u0370-\u03ff\u0590-\u05ff ]+/g, ' ').replace(/\s+/g, ' ').trim();
function albumSearch(root) {
  const box = $('[data-album-search]', root); if (!box || box.dataset.bound) return; box.dataset.bound = '1';
  const input = $('#al-s-input', box), sugg = $('.al-s-sugg', box), status = $('.al-s-status', box);
  const rows = $$('.al-row', root);
  let songs = []; let hits = []; let active = -1;
  loadIdx().then((items) => { songs = items.filter((i) => i.type === 'Song'); }).catch(() => {});
  const go = (h) => { if (h) location.href = new URL(h.url, ROOT).href; };
  const render = () => {
    const q = nrm(input.value); active = -1;
    if (!q) { rows.forEach((r) => { r.hidden = false; $('.al-s-songs', r)?.remove(); }); sugg.hidden = true; input.setAttribute('aria-expanded', 'false'); status.textContent = ''; hits = []; return; }
    hits = []; let shown = 0;
    rows.forEach((r) => {
      const al = r.dataset.album; const aHit = nrm(al).includes(q);
      const sHits = songs.filter((s) => s.album === al && nrm(s.title).includes(q));
      const on = aHit || sHits.length > 0; r.hidden = !on; if (on) shown++;
      $('.al-s-songs', r)?.remove();
      if (aHit) hits.push({ kind: 'Album', title: al, url: $('.al-link', r).getAttribute('href') });
      if (sHits.length) {
        const p = document.createElement('p'); p.className = 'al-s-songs';
        p.innerHTML = 'Songs: ' + sHits.map((s) => `<a href="${new URL(s.url, ROOT).href}">${esc(s.title)}</a>`).join(' &middot; ');
        $('.al-body', r).after(p);
        sHits.forEach((s) => hits.push({ kind: 'Song · ' + al, title: s.title, url: s.url }));
      }
    });
    hits.sort((a, b) => (nrm(b.title).startsWith(q) - nrm(a.title).startsWith(q)) || (a.kind === 'Album' ? -1 : 1));
    const top = hits.slice(0, 8);
    sugg.innerHTML = top.map((h, i) => `<li role="option" id="al-s-o${i}"><a href="${new URL(h.url, ROOT).href}"><span class="al-s-k">${esc(h.kind)}</span><span class="al-s-t">${esc(h.title)}</span></a></li>`).join('');
    sugg.hidden = !top.length; input.setAttribute('aria-expanded', String(!!top.length));
    status.textContent = shown ? `${shown} album${shown === 1 ? '' : 's'} match. Enter opens the first suggestion.` : 'Nothing here answers to that name.';
  };
  const mark = () => { $$('li', sugg).forEach((li, i) => li.classList.toggle('is-active', i === active)); input.setAttribute('aria-activedescendant', active >= 0 ? 'al-s-o' + active : ''); };
  input.addEventListener('input', render);
  input.addEventListener('keydown', (e) => {
    const n = Math.min(hits.length, 8);
    if (e.key === 'ArrowDown' && n) { e.preventDefault(); active = (active + 1) % n; mark(); }
    else if (e.key === 'ArrowUp' && n) { e.preventDefault(); active = (active - 1 + n) % n; mark(); }
    else if (e.key === 'Enter') { e.preventDefault(); go(hits[active >= 0 ? active : 0]); }
    else if (e.key === 'Escape') { input.value = ''; render(); }
  });
  document.addEventListener('click', (e) => { if (!box.contains(e.target)) { sugg.hidden = true; input.setAttribute('aria-expanded', 'false'); } });
  input.addEventListener('focus', () => { if (sugg.children.length && input.value) { sugg.hidden = false; input.setAttribute('aria-expanded', 'true'); } });
}

// ---------- moon phase (computed here, no outside service) ----------
const SYN = 29.530588853, NEW0 = Date.UTC(2000, 0, 6, 18, 14);
function moonState(d) {
  let age = ((d.getTime() - NEW0) / 86400000) % SYN; if (age < 0) age += SYN;
  const f = age / SYN, illum = (1 - Math.cos(2 * Math.PI * f)) / 2;
  const names = [[1.0, 'New moon'], [6.4, 'Waxing crescent'], [8.4, 'First quarter'], [13.8, 'Waxing gibbous'], [15.8, 'Full moon'], [21.1, 'Waning gibbous'], [23.1, 'Last quarter'], [28.5, 'Waning crescent'], [99, 'New moon']];
  return { f, illum, age, name: names.find(([a]) => age < a)[1] };
}
function moonSVG(f, r = 15) {
  const k = Math.cos(2 * Math.PI * f), rx = (Math.abs(k) * r).toFixed(2), wax = f < 0.5;
  const outer = wax ? 1 : 0, term = wax ? (k > 0 ? 0 : 1) : (k > 0 ? 1 : 0);
  return `<svg viewBox="-18 -18 36 36" width="36" height="36" aria-hidden="true"><circle r="${r}" fill="#1a0d0d" stroke="#7a1a12" stroke-width="1"/><path d="M0 ${-r} A ${r} ${r} 0 0 ${outer} 0 ${r} A ${rx} ${r} 0 0 ${term} 0 ${-r} Z" fill="#e6d2b0"/><circle r="${r}" fill="none" stroke="rgba(220,170,110,.6)" stroke-width="1"/></svg>`;
}
function moon(root) {
  document.querySelectorAll('.moon-phase').forEach((m) => m.remove());
  const m = moonState(NOW());
  const el = document.createElement('p'); el.className = 'moon-phase';
  el.innerHTML = `${moonSVG(m.f)}<span class="mp-t"><span class="mp-n">${m.name}</span><span class="mp-i">${Math.round(m.illum * 100)}% lit</span></span>`;
  el.title = `${m.name}, ${Math.round(m.illum * 100)}% lit`;
  const bar = $('.backbar .wrap', root), hero = $('.hero', root);
  if (bar) bar.appendChild(el); else if (hero) { el.classList.add('mp-hero'); hero.appendChild(el); } else return;
  document.documentElement.classList.toggle('pb-full-moon', m.illum >= 0.97);
}

// ---------- the ritual path: tarot + numbers + oracle (kept in this browser only) ----------
const RITE = 'pb-rite';
function riteState() { try { return JSON.parse(localStorage.getItem(RITE) || '{}'); } catch (e) { return {}; } }
function rite(step) {
  const s = riteState(); if (s[step]) return; s[step] = 1;
  try { localStorage.setItem(RITE, JSON.stringify(s)); } catch (e) {}
  if (s.tarot && s.numbers && s.oracle) { riteLine(true); }
}
document.addEventListener('pb:rite', (e) => rite(e.detail));
function riteLine(fresh) {
  const s = riteState(); if (!(s.tarot && s.numbers && s.oracle)) return;
  const foot = $('.site-footer .wrap'); if (foot && !$('.rite-secret', foot)) {
    const p = document.createElement('p'); p.className = 'rite-secret';
    p.innerHTML = '<span class="rs-k">The rite is complete</span><span class="rs-l">Close your eyes. It still reaches you.</span>';
    const c = $('.copyright', foot); c ? c.before(p) : foot.appendChild(p);
  }
  if (fresh) {
    const t = document.createElement('div'); t.className = 'rite-toast'; t.setAttribute('role', 'status');
    t.innerHTML = '<span class="rs-k">The rite is complete</span><span class="rs-l">Close your eyes. It still reaches you.</span>';
    document.body.appendChild(t); requestAnimationFrame(() => t.classList.add('is-in'));
    setTimeout(() => { t.classList.remove('is-in'); setTimeout(() => t.remove(), 900); }, 7000);
  }
}

// ---------- lyric card: pick a line, get a parchment PNG with the M.A. seal (made in the browser) ----------
const img = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = new URL(src, ROOT).href; });
function wrapText(ctx, text, maxW) { const words = text.split(/\s+/); const lines = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; }
async function drawCard(canvas, line, song, album) {
  const W = 1080, H = 1350; canvas.width = W; canvas.height = H; const c = canvas.getContext('2d');
  await Promise.all(['500 60px Garamond', '400 72px Fondamento', '30px "Fell SC"'].map((f) => document.fonts.load(f).catch(() => {})));
  const [paper, seal] = await Promise.all([img('images/letter/paper-real.jpg'), img('images/letter/seal-ma.webp')]);
  c.fillStyle = '#0b0606'; c.fillRect(0, 0, W, H);
  // deckled sheet
  const m = 60; c.save(); c.beginPath();
  const pts = []; const jag = (a, b, n, axis) => { for (let i = 0; i <= n; i++) { const t = i / n; pts.push(axis(a + (b - a) * t, (Math.sin(i * 12.9898) * 43758.5453 % 1) * 9)); } };
  jag(m, W - m, 60, (x, j) => [x, m + j]); jag(m, H - m, 70, (y, j) => [W - m - j, y]); jag(W - m, m, 60, (x, j) => [x, H - m - j]); jag(H - m, m, 70, (y, j) => [m + j, y]);
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.clip();
  c.fillStyle = c.createPattern(paper, 'repeat'); c.fillRect(0, 0, W, H);
  const g = c.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75); g.addColorStop(0, 'rgba(255,246,222,.18)'); g.addColorStop(0.7, 'rgba(110,60,15,.18)'); g.addColorStop(1, 'rgba(60,25,5,.85)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // folds
  [[0, H / 3, W, H / 3], [0, (2 * H) / 3, W, (2 * H) / 3], [W / 2, 0, W / 2, H]].forEach(([x1, y1, x2, y2]) => { c.strokeStyle = 'rgba(90,50,14,.18)'; c.lineWidth = 3; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.strokeStyle = 'rgba(255,247,226,.35)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x1 + 2, y1 + 2); c.lineTo(x2 + 2, y2 + 2); c.stroke(); });
  c.restore();
  // text
  c.textAlign = 'center'; c.fillStyle = '#5a1208'; c.font = '30px "Fell SC", Georgia, serif'; c.fillText('PORCELAIN BALLERINA', W / 2, 190);
  c.fillStyle = '#1a0c05'; let size = 64; c.font = `500 ${size}px Garamond, Georgia, serif`; let lines = wrapText(c, '\u201c' + line + '\u201d', W - 260);
  while (lines.length > 6 && size > 40) { size -= 4; c.font = `500 ${size}px Garamond, Georgia, serif`; lines = wrapText(c, '\u201c' + line + '\u201d', W - 260); }
  const lh = size * 1.45; let y = H / 2 - ((lines.length - 1) * lh) / 2 - 40; lines.forEach((l) => { c.fillText(l, W / 2, y); y += lh; });
  c.strokeStyle = '#6e0f0a'; c.lineWidth = 2; c.beginPath(); c.moveTo(W / 2 - 110, y + 10); c.lineTo(W / 2 + 110, y + 10); c.stroke();
  c.fillStyle = '#4a0a06'; c.font = '400 58px Fondamento, Georgia, serif'; c.fillText(song, W / 2, y + 90, W - 200);
  c.fillStyle = '#3b1d0c'; c.font = '30px "Fell SC", Georgia, serif'; c.fillText(album, W / 2, y + 140, W - 200);
  const sw = 150, sh = sw * seal.height / seal.width; c.shadowColor = 'rgba(40,6,0,.55)'; c.shadowBlur = 14; c.shadowOffsetY = 5; c.drawImage(seal, W / 2 - sw / 2, H - 120 - sh, sw, sh); c.shadowColor = 'transparent';
}
function lyricCard(root) {
  const body = $('.ly-body', root); if (!body || $('.lc-open', root)) return;
  const lines = [...new Set($$('.ly-t:not(.ly-tocome)', body).map((p) => p.textContent.trim()).filter((t) => t.length > 3 && t.length < 160))];
  if (!lines.length) return;
  const song = ($('.ly-title', root)?.textContent || document.title.split(' — ')[0]).trim(); const album = ($('.ly-alb', root)?.textContent || '').trim();
  const wrap = document.createElement('div'); wrap.className = 'lc-tools';
  wrap.innerHTML = `<button type="button" class="btn lc-open">Make a lyric card</button>
    <div class="lc-panel" role="dialog" aria-label="Make a lyric card" hidden>
      <label class="lc-label" for="lc-pick">Choose a line</label>
      <select id="lc-pick" class="lc-pick">${lines.map((l, i) => `<option value="${i}">${esc(l)}</option>`).join('')}</select>
      <div class="lc-view"><canvas class="lc-canvas" aria-hidden="true"></canvas><img class="lc-img" alt=""></div>
      <p class="lc-act"><a class="btn btn-solid lc-dl" download>Download the card</a> <button type="button" class="btn lc-close">Close</button></p>
    </div>`;
  const anchor = $('.song-codex .wrap', root); if (!anchor) return; anchor.prepend(wrap);
  const panel = $('.lc-panel', wrap), pick = $('.lc-pick', wrap), cv = $('.lc-canvas', wrap), im = $('.lc-img', wrap), dl = $('.lc-dl', wrap);
  const slug = song.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const render = async () => { const l = lines[+pick.value]; await drawCard(cv, l, song, album); const url = cv.toDataURL('image/png'); im.src = url; im.alt = `Lyric card: ${l}`; dl.href = url; dl.download = `porcelain-ballerina-${slug}.png`; };
  $('.lc-open', wrap).addEventListener('click', async () => { panel.hidden = false; await render(); pick.focus(); });
  pick.addEventListener('change', render);
  $('.lc-close', wrap).addEventListener('click', () => { panel.hidden = true; $('.lc-open', wrap).focus(); });
}

// ---------- installable app: the service worker always follows the newest build ----------
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  addEventListener('load', () => { navigator.serviceWorker.register(new URL('sw.js', ROOT).href, { scope: ROOT.href, updateViaCache: 'none' }).then((r) => r.update()).catch(() => {}); });
}

function mount() { timers.forEach((t) => { clearInterval(t); clearTimeout(t); }); timers = []; const r = document.getElementById('swap') || document; release(r); oracle(r); musicbox(r); numbers(r); albumSearch(r); moon(r); lyricCard(r); riteLine(false); }
document.addEventListener('pb:page', mount);
mount();
