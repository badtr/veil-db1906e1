// Archive lightbox
export function init() {
  const figures = Array.from(document.querySelectorAll('[data-gallery] figure a'));
  const box = document.getElementById('lightbox');
  if (!figures.length || !box) return null;
  const img = box.querySelector('img'), cap = box.querySelector('.lightbox-cap');
  const closeBtn = box.querySelector('.lightbox-close'), prevBtn = box.querySelector('.lightbox-prev'), nextBtn = box.querySelector('.lightbox-next');
  const items = figures.map((a) => ({ href: a.getAttribute('href'), caption: (a.closest('figure').querySelector('figcaption') || {}).textContent || '' }));
  let index = 0, lastFocus = null;
  const show = (i) => { document.querySelector('.hint-gallery')?.classList.add('is-gone'); index = (i + items.length) % items.length; const it = items[index]; img.src = it.href; img.alt = it.caption; cap.textContent = it.caption; if (!box.classList.contains('is-open')) lastFocus = document.activeElement; box.classList.add('is-open'); box.setAttribute('aria-hidden', 'false'); document.body.classList.add('lb-lock'); closeBtn.focus(); };
  const hide = () => { box.classList.remove('is-open'); box.setAttribute('aria-hidden', 'true'); document.body.classList.remove('lb-lock'); img.removeAttribute('src'); lastFocus && lastFocus.focus(); };
  const clicks = figures.map((a, i) => { const f = (e) => { e.preventDefault(); e.stopPropagation(); show(i); }; a.addEventListener('click', f); return f; });
  closeBtn.addEventListener('click', hide); prevBtn.addEventListener('click', () => show(index - 1)); nextBtn.addEventListener('click', () => show(index + 1));
  box.addEventListener('click', (e) => { if (e.target === box) hide(); });
  const key = (e) => { if (!box.classList.contains('is-open')) return; if (e.key === 'Escape') hide(); if (e.key === 'ArrowLeft') show(index - 1); if (e.key === 'ArrowRight') show(index + 1); };
  document.addEventListener('keydown', key);
  return { destroy() { document.removeEventListener('keydown', key); document.body.classList.remove('lb-lock'); } };
}
