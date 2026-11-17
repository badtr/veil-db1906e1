// Albums: one clean scrollable list. Rows light up as they come into view.
export function init() {
  const rows = [...document.querySelectorAll('.al-row')];
  if (!('IntersectionObserver' in window)) { rows.forEach((r) => r.classList.add('is-in')); return null; }
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  rows.forEach((r) => io.observe(r));
  return { destroy() { io.disconnect(); } };
}
