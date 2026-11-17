// Porcelain Ballerina — small fittings: release seal, daily oracle, music box, numbers room, hidden room door.
import { ROOT } from './env.js';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pad = (n) => String(n).padStart(2, '0');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// preview hook for local screenshots only: ?pbnow=2026-12-05T00:00:01%2B01:00
const NOW = (() => { const q = new URLSearchParams(location.search).get('pbnow'); const t = q ? Date.parse(q) : NaN; const off = isNaN(t) ? 0 : t - Date.now(); return () => new Date(Date.now() + off); })();
let timers = [];

// ---------- upcoming releases: countdown, LIVE NOW on the day, gone from Upcoming 14 days later ----------
function release(root) {
  $$('[data-release]', root).forEach((card) => {
    const at = Date.parse(card.dataset.release), until = Date.parse(card.dataset.expire || '') || Infinity; const box = $('[data-release-count]', card);
    const tick = () => {
      const now = NOW().getTime();
      if (now >= until) { card.hidden = true; const sec = card.closest('[data-upcoming]'); if (sec && !$$('[data-release]', sec).some((c) => !c.hidden)) sec.hidden = true; return false; }
      const left = at - now;
      if (left <= 0) {
        $$('.rl-links', card).forEach((l) => { l.hidden = l.dataset.when !== 'after'; });
        card.classList.add('is-open'); box.hidden = true; $('.rl-open', card).hidden = false; $('.rl-live', card).hidden = false;
        $('.rl-k', card).textContent = lang() === 'no' ? 'Ute nå' : 'Released'; $('.rl-note', card).hidden = true; return true;
      }
      const s = Math.floor(left / 1000);
      $('[data-u="d"]', box).textContent = Math.floor(s / 86400); $('[data-u="h"]', box).textContent = pad(Math.floor(s / 3600) % 24);
      $('[data-u="m"]', box).textContent = pad(Math.floor(s / 60) % 60); $('[data-u="s"]', box).textContent = pad(s % 60);
      return true;
    };
    if (tick()) { const id = setInterval(() => { if (!tick()) clearInterval(id); }, 1000); timers.push(id); }
  });
  // overview: new releases appear from their day (only built when live on Suno); albums on the site get a LIVE NOW badge for 14 days
  const now = NOW().getTime();
  $$('.al-row[data-show-from]', root).forEach((r) => { r.hidden = now < Date.parse(r.dataset.showFrom); });
  $$('.al-row[data-live-from]', root).forEach((r) => {
    const on = now >= Date.parse(r.dataset.liveFrom) && now < Date.parse(r.dataset.liveUntil);
    let b = $('.al-live', r); if (on && !b) { b = document.createElement('span'); b.className = 'al-live'; b.textContent = lang() === 'no' ? 'Ute nå' : 'Live now'; $('.al-body', r)?.prepend(b); }
    if (!on && b) b.remove();
  });
}

// ---------- The Coven List: a form that sends and keeps nothing (not connected yet) ----------
function coven(root) {
  $$('[data-coven] form', root).forEach((f) => {
    if (f.dataset.bound) return; f.dataset.bound = '1';
    f.addEventListener('submit', (e) => { e.preventDefault(); const m = f.parentElement.querySelector('.coven-msg'); f.reset(); m.textContent = lang() === 'no' ? 'Listen åpner snart.' : 'The list opens soon.'; f.closest('.coven-sheet').classList.add('is-sealed'); });
  });
}

// ---------- ink-reveal lyrics: real, selectable text; the ink only spreads when motion is welcome ----------
function inkLyrics(root) {
  const lines = $$('.ly-body .ly-o, .ly-body .ly-t', root); if (!lines.length) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-inked'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  lines.forEach((l, i) => { if (l.getBoundingClientRect().top < innerHeight * 0.92) return; l.classList.add('ink-wait'); l.style.setProperty('--ink-d', (i % 2) * 0.12 + 's'); io.observe(l); });
  // a jump (End key, anchor, fast fling) can skip lines without them ever crossing the view: ink everything above the fold edge
  let raf = 0;
  const sweep = () => { raf = 0; const edge = innerHeight * 0.92; let left = 0; lines.forEach((l) => { if (!l.classList.contains('ink-wait') || l.classList.contains('is-inked')) return; if (l.getBoundingClientRect().top < edge) { l.classList.add('is-inked'); io.unobserve(l); } else left++; }); if (!left) removeEventListener('scroll', onScroll); };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(sweep); };
  addEventListener('scroll', onScroll, { passive: true });
  timers.push(setTimeout(() => { removeEventListener('scroll', onScroll); lines.forEach((l) => l.classList.add('is-inked')); }, 60000)); // never leave lines hidden
}

// ---------- EN / NO for navigation and interface labels only (lyrics and texts stay English) ----------
const NO = {
  'Home': 'Hjem', 'Albums': 'Album', 'Archive': 'Arkiv', 'Tarot': 'Tarot', 'Numbers': 'Tall', 'Journal': 'Dagbok', 'About': 'Om', 'Images': 'Bilder', 'Six signed etchings': 'Seks signerte raderinger',
  'The threshold': 'Terskelen', 'Every record, every song': 'Hver plate, hver sang', 'Sealed plates': 'Forseglede trykk', 'Three cards, turned': 'Tre kort, snudd',
  'A date, a name, counted': 'En dato, et navn, talt', 'In his own hand': 'Med egen hånd', 'The one behind it': 'Den som står bak',
  'The rooms of the rite': 'Ritualets rom', 'Search': 'Søk', 'Guide': 'Meny', 'Back': 'Tilbake', 'Find us': 'Finn oss', 'Press': 'Presse',
  'Replay the threshold': 'Gå over terskelen igjen', 'Upcoming': 'Kommer snart', 'Under seal until': 'Forseglet til', 'days': 'dager', 'hours': 'timer',
  'minutes': 'minutter', 'seconds': 'sekunder', 'Live now': 'Ute nå', 'Listen now': 'Lytt nå', 'Pre-save': 'Forhåndslagre', 'Open the album': 'Åpne albumet',
  'The seal breaks by itself at midnight on release day.': 'Seglet brytes av seg selv ved midnatt på utgivelsesdagen.',
  'The oracle': 'Orakelet', 'Draw another line': 'Trekk en ny linje', 'Today\u2019s line': 'Dagens linje', 'One line from the songs for each day. It changes at midnight.': 'Én linje fra sangene hver dag. Den skifter ved midnatt.',
  'The Coven List': 'Coven-listen', 'Join the list': 'Bli med på listen', 'A letter when a record breaks its seal. Nothing more.': 'Et brev når en plate bryter seglet. Ikke noe mer.',
  'Sign the list': 'Skriv deg på', 'Nothing you type is sent or kept.': 'Ingenting du skriver blir sendt eller lagret.',
  'A sealed promise': 'Et forseglet løfte', 'For the press': 'For pressen', 'Short bio': 'Kort biografi', 'Download the press kit': 'Last ned pressepakken',
  'Sigil (SVG)': 'Sigill (SVG)', 'Wax seal (PNG)': 'Voksegl (PNG)', 'Album covers': 'Albumomslag', 'Download': 'Last ned',
  'Make a lyric card': 'Lag et tekstkort', 'Count': 'Tell', 'Clear': 'Tøm', 'Ask the board': 'Spør brettet', 'Medium off': 'Medium av', 'Medium on': 'Medium på', 'Tap for the medium': 'Trykk for mediet', 'Sound off': 'Lyd av', 'Sound on': 'Lyd på', 'Tap for sound': 'Trykk for lyd', 'Sound off': 'Lyd av', 'Sound on': 'Lyd på', 'Tap for sound': 'Trykk for lyd'
};
const PH = { 'An album, a song, a line, a card\u2026': 'Et album, en sang, en linje, et kort\u2026', 'An album or a song title\u2026': 'Et album eller en sangtittel\u2026' };
const lang = () => { try { return localStorage.getItem('pb-lang') === 'no' ? 'no' : 'en'; } catch (e) { return 'en'; } };
Object.assign(NO, {
  'Search albums, songs, lyrics, tarot cards and pages': 'Søk i album, sanger, tekster, tarotkort og sider', 'Search the albums and their songs': 'Søk i albumene og sangene deres',
  'Enter the albums': 'Gå inn til albumene', 'Open the archive': 'Åpne arkivet', 'Enter the tarot room': 'Gå inn i tarotrommet', 'Return to the threshold': 'Tilbake til terskelen',
  'Let the rite choose': 'La ritualet velge', 'Listen on Spotify': 'Lytt på Spotify', 'Listen on Suno': 'Lytt på Suno', 'Back to the album': 'Tilbake til albumet',
  'Break the seal': 'Bryt seglet', 'Leave it sealed': 'La det forbli forseglet', 'Close': 'Lukk', 'Email address': 'E-postadresse',
  'Birth date': 'Fødselsdato', 'Full birth name': 'Fullt fødselsnavn', 'How the numbers are counted': 'Slik telles tallene',
  'Ask again': 'Spør igjen', 'Begin the reading': 'Begynn lesningen', 'Choose for me': 'Velg for meg', 'Turn the next card': 'Snu neste kort', 'Your question': 'Ditt spørsmål',
  'Visit the archive': 'Besøk arkivet', 'Draw the cards': 'Trekk kortene', 'Choose an altar': 'Velg et alter', 'Return to the albums': 'Tilbake til albumene',
  'The rite is complete': 'Ritualet er fullført', 'Count': 'Tell', 'Clear': 'Tøm', 'Back to the altar': 'Tilbake til alteret',
});
const MOON_NO = { 'New moon': 'Nymåne', 'Waxing crescent': 'Voksende månesigd', 'First quarter': 'Første kvarter', 'Waxing gibbous': 'Voksende måne', 'Full moon': 'Fullmåne', 'Waning gibbous': 'Minkende måne', 'Last quarter': 'Siste kvarter', 'Waning crescent': 'Minkende månesigd' };
const NO_PREFIX = [['Next altar: ', 'Neste alter: '], ['Next · ', 'Neste · ']];
const AUTO_I18N = 'button, label, a.btn, summary, .next-title, .next-step .kicker, .mt-label, .sound-label';
const toNo = (t) => NO[t] || (NO_PREFIX.find(([a]) => t.startsWith(a)) || [])[1]?.concat(t.slice(NO_PREFIX.find(([a]) => t.startsWith(a))[0].length));
function applyLang() {
  const no = lang() === 'no';
  const els = new Set([...$$('[data-i18n]'), ...$$(AUTO_I18N)]);
  els.forEach((el) => {
    if (el.children.length || el.closest('[data-lang-toggle]')) return;
    const cur = el.textContent.trim();
    if (no) {
      if (el.dataset.no && cur === el.dataset.no) return;          // already ours
      const t = toNo(cur); if (!t) return;
      el.dataset.en = cur; el.dataset.no = t; el.textContent = t; el.setAttribute('lang', 'nb');
    } else if (el.dataset.no && cur === el.dataset.no) {            // only undo what we set; other scripts may have changed the text since
      el.textContent = el.dataset.en; el.removeAttribute('lang');
    }
  });
  $$('input[placeholder]').forEach((i) => { if (!i.dataset.en) i.dataset.en = i.placeholder; const t = PH[i.dataset.en]; if (t) i.placeholder = no ? t : i.dataset.en; });
  $$('[data-lang-toggle]').forEach((b) => { b.classList.toggle('is-no', no); b.setAttribute('aria-pressed', String(no)); b.setAttribute('aria-label', no ? 'Switch to English' : 'Bytt til norsk'); });
}
// labels that other scripts write later (tarot buttons, viewers) follow the chosen language too
let langRaf = 0;
new MutationObserver(() => { if (lang() !== 'no' || langRaf) return; langRaf = requestAnimationFrame(() => { langRaf = 0; applyLang(); }); }).observe(document.body, { subtree: true, childList: true, characterData: true });
document.addEventListener('click', (e) => { if (!e.target.closest('[data-lang-toggle]')) return; try { localStorage.setItem('pb-lang', lang() === 'no' ? 'en' : 'no'); } catch (_) {} applyLang(); moon(document.getElementById('swap') || document); });

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
      $('[data-oracle-date]', sec).textContent = daily ? NOW().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'a line drawn for you';
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
    if (html) { rite('numbers'); const got = [...html.matchAll(/class="nc-n">(\d+)/g)].map((m) => m[1]).join(''); try { document.dispatchEvent(new CustomEvent('pb:board', { detail: got })); } catch (e) {} }
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
  const no = lang() === 'no', nm = no ? (MOON_NO[m.name] || m.name) : m.name, lit = `${Math.round(m.illum * 100)}% ${no ? 'opplyst' : 'lit'}`;
  el.innerHTML = `${moonSVG(m.f)}<span class="mp-t"><span class="mp-n"${no ? ' lang="nb"' : ''}>${nm}</span><span class="mp-i">${lit}</span></span>`;
  el.title = `${nm}, ${lit}`;
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
  await Promise.all(['60px Fell', '400 64px Fondamento', '30px "Fell SC"'].map((f) => document.fonts.load(f).catch(() => {})));
  const [paper, seal] = await Promise.all([img('images/letter/paper-real.jpg'), img('images/letter/seal-logo.png')]);
  let sd = [...(song + line)].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const rnd = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; };
  const nz = (t, k) => Math.sin(t * 1.7 + k) * .5 + Math.sin(t * 4.3 + k * 2.1) * .3 + Math.sin(t * 11.9 + k * .7) * .2;
  c.fillStyle = '#0b0606'; c.fillRect(0, 0, W, H);
  // torn, burnt deckle edge
  const m = 56; const pts = [];
  const side = (n, f) => { for (let i = 0; i < n; i++) pts.push(f(i / n)); };
  const tear = (t, k) => 14 * nz(t * 9, k) + 7 * (rnd() - .5) + (rnd() < .05 ? 16 * rnd() : 0);
  side(90, (t) => [m + t * (W - 2 * m), m + tear(t, 1)]); side(110, (t) => [W - m - tear(t, 2), m + t * (H - 2 * m)]);
  side(90, (t) => [W - m - t * (W - 2 * m), H - m - tear(t, 3)]); side(110, (t) => [m + tear(t, 4), H - m - t * (H - 2 * m)]);
  const path = new Path2D(); pts.forEach(([x, y], i) => (i ? path.lineTo(x, y) : path.moveTo(x, y))); path.closePath();
  c.save(); c.shadowColor = 'rgba(0,0,0,.8)'; c.shadowBlur = 30; c.shadowOffsetY = 12; c.fillStyle = '#c9b07a'; c.fill(path); c.restore();
  c.save(); c.clip(path);
  c.fillStyle = c.createPattern(paper, 'repeat'); c.fillRect(0, 0, W, H);
  // laid lines and chain lines of handmade paper
  c.globalAlpha = .05; c.fillStyle = '#3a2208'; for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 1);
  c.globalAlpha = .07; for (let x = 40; x < W; x += 94) c.fillRect(x + nz(x, 5) * 3, 0, 2, H); c.globalAlpha = 1;
  // age, smudges, foxing
  const g = c.createRadialGradient(W / 2, H / 2, H * .22, W / 2, H / 2, H * .72); g.addColorStop(0, 'rgba(255,246,222,.16)'); g.addColorStop(.75, 'rgba(110,60,15,.16)'); g.addColorStop(1, 'rgba(70,30,5,.55)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let k = 0; k < 7; k++) { const x = rnd() * W, y = rnd() * H, rr = 30 + rnd() * 120; const s = c.createRadialGradient(x, y, 0, x, y, rr); s.addColorStop(0, `rgba(80,45,15,${.05 + rnd() * .07})`); s.addColorStop(1, 'rgba(80,45,15,0)'); c.fillStyle = s; c.beginPath(); c.ellipse(x, y, rr, rr * (.5 + rnd() * .5), rnd() * 3, 0, 7); c.fill(); }
  for (let k = 0; k < 40; k++) { c.fillStyle = `rgba(120,70,25,${.08 + rnd() * .15})`; c.beginPath(); c.arc(rnd() * W, rnd() * H, 1 + rnd() * 3.5, 0, 7); c.fill(); }
  // folds
  [[0, H / 3, W, H / 3], [0, (2 * H) / 3, W, (2 * H) / 3], [W / 2, 0, W / 2, H]].forEach(([x1, y1, x2, y2]) => { c.strokeStyle = 'rgba(90,50,14,.16)'; c.lineWidth = 3; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.strokeStyle = 'rgba(255,247,226,.3)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x1 + 2, y1 + 2); c.lineTo(x2 + 2, y2 + 2); c.stroke(); });
  // burnt edge: scorch inward from the tear
  c.save(); c.lineJoin = 'round'; [[46, 'rgba(70,30,6,.35)', 18], [18, 'rgba(40,14,2,.6)', 8], [5, 'rgba(15,4,0,.85)', 2]].forEach(([lw, col, bl]) => { c.strokeStyle = col; c.lineWidth = lw; c.shadowColor = col; c.shadowBlur = bl; c.stroke(path); }); c.restore();
  for (let k = 0; k < 26; k++) { const [x, y] = pts[Math.floor(rnd() * pts.length)]; const rr = 25 + rnd() * 70; const s = c.createRadialGradient(x, y, 0, x, y, rr); s.addColorStop(0, 'rgba(25,8,0,.75)'); s.addColorStop(.45, 'rgba(90,40,8,.35)'); s.addColorStop(1, 'rgba(90,40,8,0)'); c.fillStyle = s; c.beginPath(); c.arc(x, y, rr, 0, 7); c.fill(); }
  c.restore();
  // hand-inked lettering: quill serif, per-letter jitter, uneven baseline, pooled ink
  const ink = (text, x0, y0, font, size, col, maxW) => {
    c.font = `${font.replace('@', size + 'px')}`; const wTot = Math.min(c.measureText(text).width, maxW || 1e9); let x = x0 - wTot / 2; const slope = (rnd() - .5) * .012;
    const sc = maxW && c.measureText(text).width > maxW ? maxW / c.measureText(text).width : 1;
    for (const ch of text) {
      const fs = size * sc * (1 + (rnd() - .5) * .05); c.font = font.replace('@', fs.toFixed(1) + 'px');
      const cw = c.measureText(ch).width; const y = y0 + (x - x0) * slope + (rnd() - .5) * 3.4; const rot = (rnd() - .5) * .07;
      c.save(); c.translate(x + cw / 2, y); c.rotate(rot);
      c.globalAlpha = .28; c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 2.2; c.fillText(ch, -cw / 2 + .6, .8);   // bleed
      c.globalAlpha = .82 + rnd() * .18; c.shadowBlur = 0; c.fillText(ch, -cw / 2, 0);
      if (rnd() < .18) { c.globalAlpha = .35; c.fillText(ch, -cw / 2 + .4, .3); }                                              // pooled ink
      c.restore(); x += cw;
    }
    c.globalAlpha = 1;
  };
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  ink('PORCELAIN BALLERINA', W / 2, 180, '@ "Fell SC", Georgia, serif', 30, '#5a1208');
  let size = 66; c.font = `${size}px Fell, Georgia, serif`; let lines = wrapText(c, '\u201c' + line + '\u201d', W - 280);
  while (lines.length > 6 && size > 42) { size -= 4; c.font = `${size}px Fell, Georgia, serif`; lines = wrapText(c, '\u201c' + line + '\u201d', W - 280); }
  const lh = size * 1.42; let y = H / 2 - ((lines.length - 1) * lh) / 2 - 60;
  lines.forEach((l) => { ink(l, W / 2 + (rnd() - .5) * 8, y, '@ Fell, Georgia, serif', size, '#1c0d06'); y += lh; });
  c.strokeStyle = 'rgba(110,15,10,.85)'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(W / 2 - 120, y + 6); c.bezierCurveTo(W / 2 - 40, y + 2, W / 2 + 40, y + 12, W / 2 + 120, y + 5); c.stroke();
  ink(song, W / 2, y + 86, '400 @ Fondamento, Georgia, serif', 60, '#4a0a06', W - 220);
  ink(album.toUpperCase(), W / 2, y + 136, '@ "Fell SC", Georgia, serif', 28, '#3b1d0c', W - 220);
  // the wax seal, stamped with the mark
  const sw = 270, sh = sw * seal.height / seal.width; c.save(); c.translate(W / 2 + 160, H - 150 - sh / 2); c.rotate(-.12 + rnd() * .08);
  c.shadowColor = 'rgba(30,4,0,.6)'; c.shadowBlur = 16; c.shadowOffsetY = 6; c.drawImage(seal, -sw / 2, -sh / 2, sw, sh); c.restore();
  c.save(); c.globalAlpha = .9; ink('\u2014 M.A.', W / 2 - 150, H - 150, '400 @ Fondamento, Georgia, serif', 46, '#3a0a05'); c.restore();
}
function lyricCard(root) {
  const body = $('.ly-body', root); if (!body || $('.lc-open', root)) return;
  const lines = [...new Set($$('.ly-t:not(.ly-tocome)', body).map((p) => p.textContent.trim()).filter((t) => t.length > 3 && t.length < 160))];
  if (!lines.length) return;
  const song = ($('.ly-title', root)?.textContent || document.title.split(' — ')[0]).trim(); const album = ($('.ly-alb', root)?.textContent || '').trim();
  const wrap = document.createElement('div'); wrap.className = 'lc-tools';
  wrap.innerHTML = `<button type="button" class="btn lc-open" data-i18n>Make a lyric card</button>
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

// ---------- the séance parlour: smoke, candle light, ectoplasm, the spirit board, channelled headings ----------
const RM = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function parlour() {
  if (document.querySelector('.seance-fx')) return;
  const fx = document.createElement('div'); fx.className = 'seance-fx'; fx.setAttribute('aria-hidden', 'true');
  fx.innerHTML = '<i class="fx-smoke fx-s1"></i><i class="fx-smoke fx-s2"></i><i class="fx-ecto fx-e1"></i><i class="fx-ecto fx-e2"></i><i class="fx-candle fx-c1"></i><i class="fx-candle fx-c2"></i><i class="fx-plate"></i>';
  document.body.appendChild(fx);
}
function board(root) {
  $$('[data-board]', root).forEach((b) => {
    if (b.dataset.bound) return; b.dataset.bound = '1';
    const pl = $('.sb-planchette', b); const chs = $$('[data-ch]', b);
    let cur = null, tgt = null, raf = 0, busy = false;
    const lens = () => ({ x: pl.offsetWidth / 2, y: pl.offsetHeight * 0.43 });
    const home = () => { const r = b.getBoundingClientRect(); return { x: r.width * 0.5, y: r.height * 0.86 }; };
    const put = (p) => { const l = lens(); pl.style.transform = `translate(${(p.x - l.x).toFixed(1)}px, ${(p.y - l.y).toFixed(1)}px) rotate(${((p.x / b.clientWidth) - 0.5) * 16}deg)`; };
    const lit = (p) => { let best = null, bd = 1e9; const r = b.getBoundingClientRect(); chs.forEach((c) => { const q = c.getBoundingClientRect(); const d = Math.hypot(q.left + q.width / 2 - r.left - p.x, q.top + q.height / 2 - r.top - p.y); if (d < bd) { bd = d; best = c; } }); chs.forEach((c) => c.classList.toggle('is-lit', c === best && bd < Math.max(26, b.clientWidth * 0.04))); };
    const step = () => { raf = 0; if (!tgt) return; if (!cur) cur = { ...tgt }; const k = RM() ? 1 : 0.14; cur.x += (tgt.x - cur.x) * k; cur.y += (tgt.y - cur.y) * k; put(cur); lit(cur); if (Math.hypot(tgt.x - cur.x, tgt.y - cur.y) > 0.5) raf = requestAnimationFrame(step); };
    const go = (p) => { tgt = p; if (!raf) raf = requestAnimationFrame(step); };
    const at = (el) => { const r = b.getBoundingClientRect(), q = el.getBoundingClientRect(); return { x: q.left + q.width / 2 - r.left, y: q.top + q.height / 2 - r.top }; };
    cur = home(); put(cur);
    b.addEventListener('pointermove', (e) => { if (busy || e.pointerType === 'touch') return; const r = b.getBoundingClientRect(); go({ x: e.clientX - r.left, y: e.clientY - r.top }); b.classList.add('is-touched'); });
    b.addEventListener('pointerleave', () => { if (!busy) go(home()); });
    b.addEventListener('click', (e) => { const c = e.target.closest('[data-ch]'); if (c && !busy) go(at(c)); });
    b.spell = async (word, keep) => {
      const seq = []; let s = String(word).toUpperCase();
      while (s) { const t = ['YES', 'NO', 'BYE'].find((w) => s.startsWith(w) && $(`[data-ch="${w}"]`, b)); const k = t || s[0]; s = s.slice(k.length); const el = $(`[data-ch="${CSS.escape(k)}"]`, b); if (el) seq.push(el); }
      busy = true; b.classList.add('is-spelling');
      for (const el of seq) { go(at(el)); await new Promise((r) => setTimeout(r, RM() ? 450 : 1050)); el.classList.add('is-spoken'); setTimeout(() => el.classList.remove('is-spoken'), 1400); }
      if (keep) return; await new Promise((r) => setTimeout(r, 900)); busy = false; b.classList.remove('is-spelling'); go(home());
    };
    addEventListener('resize', () => { cur = null; go(home()); }, { passive: true });
    b.rest = async () => { await new Promise((r) => setTimeout(r, 900)); busy = false; b.classList.remove('is-spelling'); go(home()); };
  });
  // the album séance: walk the numbers of the songs, one row at a time
  $$('[data-ask-board]', root).forEach((btn) => {
    if (btn.dataset.bound) return; btn.dataset.bound = '1';
    const sec = btn.closest('.album-seance'); const b = $('[data-board]', sec); const rows = $$('.as-row', sec);
    btn.addEventListener('click', async () => {
      if (!b || !b.spell || btn.disabled) return; btn.disabled = true; b.scrollIntoView({ behavior: RM() ? 'auto' : 'smooth', block: 'center' });
      await new Promise((r) => setTimeout(r, RM() ? 50 : 600));
      await b.spell('YES', true);
      for (const r of rows) { rows.forEach((x) => x.classList.toggle('is-called', x === r)); await b.spell(r.dataset.n, true); r.classList.add('is-done'); }
      await b.spell('BYE', true); rows.forEach((x) => x.classList.remove('is-called')); await b.rest(); btn.disabled = false;
    });
  });
}
document.addEventListener('pb:board', (e) => { const b = $('[data-board]'); if (b && b.spell) { b.scrollIntoView({ behavior: RM() ? 'auto' : 'smooth', block: 'center' }); setTimeout(() => b.spell(e.detail), 500); } });
document.addEventListener('pb:rite', (e) => { if (e.detail !== 'tarot') return; const b = $('[data-board="tarot"]'); if (b && b.spell) b.spell('BYE'); });
document.addEventListener('click', (e) => { const st = e.target.closest('.tr-stage'); if (!st || st.dataset.yes) return; st.dataset.yes = '1'; const b = $('[data-board="tarot"]'); if (b && b.spell) b.spell('YES'); });
function channel(root) {
  $$('h1 .bt, .lib-h .bt', root).forEach((bt) => {
    if (bt.dataset.channel) return; bt.dataset.channel = '1';
    const g = document.createElement('span'); g.className = 'h-ghost'; g.setAttribute('aria-hidden', 'true'); g.textContent = $$('.ch', bt).map((c) => c.textContent).join('') ? bt.textContent.replace(/\s+/g, ' ').trim() : ''; bt.appendChild(g);
    if (RM()) return;
    const letters = $$('.ch', bt); letters.forEach((c, i) => c.style.setProperty('--cd', (0.15 + i * 0.07 + Math.random() * 0.25).toFixed(2) + 's'));
    bt.classList.add('is-channeling'); setTimeout(() => bt.classList.remove('is-channeling'), 1600 + letters.length * 90);
    const twitch = () => { if (!bt.isConnected) return; const c = letters[Math.floor(Math.random() * letters.length)]; if (c) { c.classList.add('ch-twitch'); setTimeout(() => c.classList.remove('ch-twitch'), 700); } timers.push(setTimeout(twitch, 6000 + Math.random() * 9000)); };
    timers.push(setTimeout(twitch, 4000 + letters.length * 90));
  });
}
function spiritPhoto(root) {
  $$('.album-hero img, .rq-frame img', root).forEach((img) => {
    const box = img.parentElement; if (!box || box.querySelector('.sp-ghost')) return;
    const g = img.cloneNode(); g.removeAttribute('loading'); g.className = 'sp-ghost'; g.alt = ''; g.setAttribute('aria-hidden', 'true'); box.classList.add('spirit-plate'); box.appendChild(g);
  });
}
// ---------- whisper in the dark: after a long stillness, one real line drifts in at the edge, then leaves ----------
const WH = { idle: 26000, gap: 90000, max: 4, el: null, t: 0, last: 0, out: 0 };
function whisperShow() {
  if (document.hidden || document.querySelector('.lightbox.is-open, .site-search:not([hidden]), .wel, .intro-overlay')) return;
  const a = document.activeElement; if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
  let n = 0; try { n = +sessionStorage.getItem('pb-whispers') || 0; } catch (e) {}
  if (n >= WH.max || Date.now() - WH.last < WH.gap) return;
  loadOracle().then((lines) => {
    if (!lines || !lines.length) return;
    const o = lines[Math.floor(Math.random() * lines.length)];
    if (!WH.el) { WH.el = document.createElement('div'); WH.el.className = 'whisper-dark'; WH.el.setAttribute('aria-hidden', 'true'); document.body.appendChild(WH.el); }
    WH.el.innerHTML = `<p class="wd-line">\u201c${o.en.replace(/[<>&]/g, '')}\u201d</p><p class="wd-src">${o.song.replace(/[<>&]/g, '')} &middot; ${o.album.replace(/[<>&]/g, '')}</p>`;
    // find a quiet place: never on top of anything readable or clickable
    const TEXT = 'p, li, h1, h2, h3, h4, blockquote, figcaption, label, input, textarea, select, button, a, img, video, canvas, .ly-t, .ly-o, .ms-l, .spirit-board, .tr-stage, .ms-letter, .jr-ledger, .rl-doc, .oracle-sheet, .coven-sheet, .vr-doc, .num-card, .sign-plate, .musicbox, .ly-body';
    const busy = $$(TEXT, document.getElementById('swap') || document).filter((e) => !e.closest('.whisper-dark, .seance-fx, .hero-stage') && (e.matches('.spirit-board, .tr-stage, .ms-letter') || !e.closest('[aria-hidden="true"]')) && getComputedStyle(e).visibility !== 'hidden' && +getComputedStyle(e).opacity > 0.05).map((e) => e.getBoundingClientRect()).filter((r) => r.width && r.height && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth);
    const clear = (x, y, w, h) => !busy.some((r) => r.left < x + w && r.right > x && r.top < y + h && r.bottom > y);
    const ww = Math.min(260, innerWidth * 0.8), hh = 130, spots = [];
    for (let y = innerHeight * 0.3; y < innerHeight * 0.75; y += 40) { spots.push([innerWidth - ww - innerWidth * 0.02, y]); spots.push([innerWidth * 0.02 + 56, y]); }
    for (let y = innerHeight * 0.18; y < innerHeight - hh - 80; y += 36) spots.push([(innerWidth - ww) / 2, y]);
    const spot = spots.find(([x, y]) => x > 0 && clear(x, y, ww, hh));
    if (!spot) { whisperArm(); return; }
    Object.assign(WH.el.style, { left: spot[0] + 'px', top: spot[1] + 'px', width: ww + 'px' });
    requestAnimationFrame(() => WH.el.classList.add('is-in'));
    WH.last = Date.now(); try { sessionStorage.setItem('pb-whispers', String(n + 1)); } catch (e) {}
    clearTimeout(WH.out); WH.out = setTimeout(whisperHide, 9000);
  }).catch(() => {});
}
function whisperHide() { if (WH.el) WH.el.classList.remove('is-in'); }
function whisperArm() { clearTimeout(WH.t); WH.t = setTimeout(whisperShow, WH.idle); }
['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach((ev) => addEventListener(ev, () => { if (WH.el && WH.el.classList.contains('is-in') && ev !== 'pointermove') whisperHide(); whisperArm(); }, { passive: true, capture: true }));
whisperArm();
// the medium's sound (opt-in, off by default)
import(new URL('medium.js?v=' + (document.querySelector('link[href*="style.css"]')?.getAttribute('href').split('?v=')[1] || ''), import.meta.url).href).catch(() => {});
function mount() { timers.forEach((t) => { clearInterval(t); clearTimeout(t); }); timers = []; const r = document.getElementById('swap') || document; release(r); oracle(r); musicbox(r); numbers(r); albumSearch(r); moon(r); lyricCard(r); riteLine(false); coven(r); inkLyrics(r); parlour(); board(r); channel(r); spiritPhoto(r); applyLang(); }
document.addEventListener('pb:page', mount);
mount();
