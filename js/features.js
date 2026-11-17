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
      if (left <= 0) { sec.classList.add('is-open'); box.hidden = true; $('.rl-open', sec).hidden = false; $('.rl-k', sec).textContent = 'Released'; $('.rl-note', sec).hidden = true; return false; }
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
      $('[data-oracle-draw]', sec).addEventListener('click', () => { let i; do { i = Math.floor(Math.random() * lines.length); } while (lines.length > 1 && i === todayIdx); show(i, false); });
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

function mount() { timers.forEach((t) => { clearInterval(t); clearTimeout(t); }); timers = []; const r = document.getElementById('swap') || document; release(r); oracle(r); musicbox(r); numbers(r); }
document.addEventListener('pb:page', mount);
mount();
