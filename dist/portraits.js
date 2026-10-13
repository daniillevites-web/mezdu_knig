(() => {
  'use strict';
  const track = document.querySelector('#portrait-track');
  const slides = [...track.querySelectorAll('.portrait-slide')];
  const prev = document.querySelector('#portrait-prev'), next = document.querySelector('#portrait-next');
  const position = document.querySelector('#portrait-position');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let scheduled = false;
  const step = () => slides[1].offsetLeft - slides[0].offsetLeft;
  function update() {
    scheduled = false;
    const i = Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / step())));
    position.textContent = String(i + 1).padStart(2, '0') + ' / ' + slides.length;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  }
  function move(d) {
    track.scrollBy({left: d * step(), behavior: reduce.matches ? 'auto' : 'smooth'});
  }
  prev.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  }, {passive: true});
  track.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(e.key === 'ArrowRight' ? 1 : -1); }
    if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); track.scrollTo({left: e.key === 'Home' ? 0 : track.scrollWidth, behavior: reduce.matches ? 'auto' : 'smooth'}); }
  });
  addEventListener('resize', update, {passive: true});
  update();
})();
