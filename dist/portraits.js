(() => {
  'use strict';
  const track = document.querySelector('#portrait-track');
  const slides = [...track.querySelectorAll('.portrait-slide')];
  const prev = document.querySelector('#portrait-prev'), next = document.querySelector('#portrait-next');
  const position = document.querySelector('#portrait-position');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const preview = document.createElement('div');
  preview.id = 'portrait-art-preview';
  preview.className = 'portrait-art-preview';
  preview.setAttribute('role', 'tooltip');
  preview.hidden = true;
  const image = document.createElement('img');
  const caption = document.createElement('p');
  preview.append(image, caption);
  document.body.append(preview);
  let activePortrait;
  function hidePreview() {
    activePortrait?.removeAttribute('aria-describedby');
    activePortrait = undefined;
    preview.hidden = true;
  }
  function showPreview(button) {
    const artist = window.ARTISTS.find(a => a.id === Number(button.dataset.art));
    if (!artist) return;
    hidePreview();
    activePortrait = button;
    image.src = artist.image;
    image.alt = artist.name + '. ' + artist.title;
    caption.textContent = artist.name + ' — «' + artist.title + '»';
    button.setAttribute('aria-describedby', preview.id);
    preview.hidden = false;
    const rect = button.getBoundingClientRect();
    const width = preview.offsetWidth, height = preview.offsetHeight;
    const left = Math.max(12, Math.min(innerWidth - width - 12, rect.left + (rect.width - width) / 2));
    const top = rect.bottom + height + 12 <= innerHeight
      ? rect.bottom + 10 : rect.top - height - 10;
    preview.style.left = left + 'px';
    preview.style.top = Math.max(12, Math.min(innerHeight - height - 12, top)) + 'px';
  }
  slides.forEach(slide => {
    const button = slide.querySelector('.portrait-frame');
    const artist = window.ARTISTS.find(a => a.id === Number(button.dataset.art));
    button.setAttribute('aria-label', artist.name + '. Рассмотреть работу «' + artist.title + '»');
    button.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch') showPreview(button);
    });
    button.addEventListener('pointerleave', () => {
      if (document.activeElement !== button) hidePreview();
    });
    button.addEventListener('focus', () => showPreview(button));
    button.addEventListener('blur', hidePreview);
    button.addEventListener('click', hidePreview);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') hidePreview();
  });
  function refreshPreview() {
    if (!activePortrait) return;
    const rect = activePortrait.getBoundingClientRect();
    const bounds = track.getBoundingClientRect();
    if (rect.right <= bounds.left || rect.left >= bounds.right || rect.bottom <= 0 || rect.top >= innerHeight) {
      hidePreview();
    } else {
      showPreview(activePortrait);
    }
  }
  addEventListener('scroll', refreshPreview, {passive: true});
  track.addEventListener('scroll', refreshPreview, {passive: true});
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
  addEventListener('resize', () => { hidePreview(); update(); }, {passive: true});
  update();
})();
