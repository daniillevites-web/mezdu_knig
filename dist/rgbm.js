(() => {
  'use strict';
  const gallery = document.querySelector('.rgbm-gallery');
  if (!gallery) return;
  const photos = [
    ['assets/rgbm-doctor-detail.jpg', 'Андрей Крюк. «ЖЗЛ. Доктор». Работа на книжной полке в РГБМ, Москва.'],
    ['assets/moscow-doctor.webp', 'Андрей Крюк. «ЖЗЛ. Доктор». Корешок работы среди книг в РГБМ, Москва.'],
    ['assets/moscow-frog.webp', 'Виолетта Гришина. «Лягушонок» рядом с книгами о земноводных в РГБМ, Москва.'],
    ['assets/moscow-dog.webp', 'Тара Тарабцева. «Как вырастить клубнику размером с собаку». Раздел ботаники в РГБМ, Москва.'],
    ['assets/rgbm-vivian.jpg', 'Вивиан дель Рио. «Проходить через пункт контроля в верхней пачкающей одежде…». Работа среди книг в РГБМ, Москва.'],
    ['assets/moscow-captain.webp', 'Константин Звездочётов. «Капитан» в зале редкой книги РГБМ, Москва.'],
    ['assets/rgbm-captain-detail.jpg', 'Константин Звездочётов. «Капитан». Корешок работы среди книг в РГБМ, Москва.']
  ];
  const photo = gallery.querySelector('.rgbm-photo');
  const image = gallery.querySelector('#rgbm-image');
  const caption = gallery.querySelector('#rgbm-caption');
  const position = gallery.querySelector('#rgbm-position');
  let index = 0;
  function show(next) {
    index = (next + photos.length) % photos.length;
    const [src, text] = photos[index];
    image.src = src;
    image.alt = text;
    photo.dataset.photo = src;
    photo.dataset.caption = text;
    photo.setAttribute('aria-label', 'Увеличить: ' + text);
    caption.textContent = text;
    position.textContent = (index + 1) + ' / ' + photos.length;
  }
  gallery.querySelector('#rgbm-prev').addEventListener('click', () => show(index - 1));
  gallery.querySelector('#rgbm-next').addEventListener('click', () => show(index + 1));
  gallery.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(index + (event.key === 'ArrowRight' ? 1 : -1));
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      show(event.key === 'Home' ? 0 : photos.length - 1);
    }
  });
  let touchStart, swiped = false;
  photo.addEventListener('touchstart', event => {
    const touch = event.touches[0];
    touchStart = {x: touch.clientX, y: touch.clientY};
    swiped = false;
  }, {passive: true});
  photo.addEventListener('touchend', event => {
    if (!touchStart) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.x, dy = touch.clientY - touchStart.y;
    touchStart = undefined;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      swiped = true;
      show(index + (dx < 0 ? 1 : -1));
    }
  }, {passive: true});
  photo.addEventListener('touchcancel', () => { touchStart = undefined; swiped = false; }, {passive: true});
  photo.addEventListener('click', event => {
    if (!swiped || event.detail === 0) return;
    event.preventDefault();
    event.stopPropagation();
    swiped = false;
  });
})();
