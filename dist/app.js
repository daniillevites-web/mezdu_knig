(() => {
 'use strict';
 const artists = window.ARTISTS;
 const $ = (s, root = document) => root.querySelector(s);
 const $$ = (s, root = document) => [...root.querySelectorAll(s)];
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const artDialog = $('#art-dialog'), photoDialog = $('#photo-dialog');
 const focusBefore = new WeakMap();
 let activeArt = 0, photoList = [], activePhoto = 0, zoom = 0;
 const viewport = $('#photo-viewport'), photoImage = $('#photo-image');
 function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
 }
 function addPlacement(parent, work) {
  const list = element('dl', 'work-address');
  [['Зал', work.hall], ['Раздел', work.section], ['Адрес', work.address]].forEach(([label, value]) => {
   list.append(element('dt', '', label), element('dd', '', value));
  });
  parent.append(list);
 }
 function renderArt(id) {
  activeArt = (id + artists.length) % artists.length;
  const a = artists[activeArt];
  $('#dialog-title').textContent = a.name;
  $('#dialog-work').textContent = '«' + a.title + '»';
  $('#dialog-image').src = a.image;
  $('#dialog-image').alt = a.name + '. ' + a.title;
  $('#dialog-note').textContent = a.note || (a.placement ? 'Адрес этой работы в первой экспозиции в РГБМ, 2025:' : 'Произведение из архива проекта «Между книг».');
  const details = $('#dialog-details');
  details.replaceChildren();
  if (a.placement) addPlacement(details, a.placement);
  if (a.materials) details.append(element('p', 'work-materials', a.materials));
  details.append(element('p', 'work-source', a.placement?.source || a.noteSource || a.source));
  if (a.placement) {
   const guide = element('button', 'text-link', 'Проверить адрес в путеводителе ↗');
   guide.type = 'button'; guide.dataset.photo = 'assets/leaflet.webp';
   guide.dataset.caption = 'Путеводитель по выставке в РГБМ, 2025. Страница с библиотечными адресами.';
   details.append(guide);
  }
  if (a.installationPhotos?.length) {
   const group = element('div', 'installation-photos');
   group.append(element('h3', '', 'Среди книг'));
   a.installationPhotos.forEach(([src, caption]) => {
    const button = element('button', 'installation-photo'); button.type = 'button';
    button.dataset.photo = src; button.dataset.caption = caption;
    button.setAttribute('aria-label', 'Увеличить: ' + caption);
    const img = element('img'); img.src = src; img.alt = caption; img.loading = 'lazy';
    button.append(img, element('span', '', caption + ' ↗')); group.append(button);
   });
   details.append(group);
  }
  if (a.relatedWorks) {
   const related = element('section', 'related-works');
   related.append(element('h3', '', 'Другие работы автора в путеводителе'));
   a.relatedWorks.forEach(work => {
    related.append(element('h4', '', '«' + work.title + '»')); addPlacement(related, work);
   });
   related.append(element('p', 'work-source', 'Путеводитель по выставке в РГБМ, 2025. На предоставленной странице указаны эти названия; они отличаются от работы на изображении выше.'));
   const guide = element('button', 'text-link', 'Открыть страницу путеводителя ↗');
   guide.type = 'button'; guide.dataset.photo = 'assets/leaflet.webp'; guide.dataset.caption = 'Путеводитель по выставке в РГБМ, 2025.';
   related.append(guide); details.append(related);
  }
  $('#art-position').textContent = String(activeArt + 1).padStart(2, '0') + ' / ' + artists.length;
  artDialog.scrollTop = 0;
 }
 function openDialog(dialog) {
  focusBefore.set(dialog, document.activeElement);
  dialog.showModal(); document.body.classList.add('modal-open');
  $('.dialog-close', dialog).focus({preventScroll: true});
 }
 function openArt(id) { renderArt(id); openDialog(artDialog); }
 function setZoom(value) {
  zoom = Math.max(0, Math.min(4, value));
  photoImage.style.width = zoom ? Math.round(viewport.clientWidth * (1 + zoom * .5)) + 'px' : '';
  photoImage.classList.toggle('zoomed', zoom > 0);
  $('#photo-zoom-level').textContent = zoom ? (100 + zoom * 50) + '%' : 'Вписано';
  $('#photo-zoom-out').disabled = zoom === 0;
  $('#photo-zoom-in').disabled = zoom === 4;
  if (!zoom) viewport.scrollTo(0, 0);
 }
 function renderPhoto(index) {
  activePhoto = (index + photoList.length) % photoList.length;
  const [src, caption] = photoList[activePhoto];
  photoImage.src = src; photoImage.alt = caption;
  $('#photo-caption').textContent = caption;
  $('#photo-original').href = src;
  $('#photo-position').textContent = (activePhoto + 1) + ' / ' + photoList.length;
  $('#photo-prev').disabled = $('#photo-next').disabled = photoList.length < 2;
  setZoom(0);
 }
 function openPhoto(list, index = 0) {
  photoList = list; openDialog(photoDialog); renderPhoto(index);
 }
 document.addEventListener('click', e => {
  const art = e.target.closest('[data-art]');
  if (art) { openArt(Number(art.dataset.art)); return; }
  const photo = e.target.closest('[data-photo]');
  if (photo) {
   const a = artists[activeArt];
   const group = photo.closest('.installation-photos') ? a.installationPhotos : [[photo.dataset.photo, photo.dataset.caption]];
   openPhoto(group, Math.max(0, group.findIndex(([src]) => src === photo.dataset.photo)));
  }
 });
 $$('.dialog-close').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
 [artDialog, photoDialog].forEach(dialog => {
  dialog.addEventListener('click', e => {
   if (e.target !== dialog) return;
   const r = dialog.getBoundingClientRect();
   if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
   document.body.classList.toggle('modal-open', !!$('dialog[open]'));
   const opener = focusBefore.get(dialog);
   if (opener?.isConnected) opener.focus({preventScroll: true});
  });
 });
 $('#art-prev').addEventListener('click', () => renderArt(activeArt - 1));
 $('#art-next').addEventListener('click', () => renderArt(activeArt + 1));
 artDialog.addEventListener('keydown', e => {
  if (photoDialog.open) return;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); renderArt(activeArt + (e.key === 'ArrowRight' ? 1 : -1)); }
 });
 $('#photo-prev').addEventListener('click', () => renderPhoto(activePhoto - 1));
 $('#photo-next').addEventListener('click', () => renderPhoto(activePhoto + 1));
 $('#photo-zoom-in').addEventListener('click', () => setZoom(zoom + 1));
 $('#photo-zoom-out').addEventListener('click', () => setZoom(zoom - 1));
 $('#photo-fit').addEventListener('click', () => setZoom(0));
 photoDialog.addEventListener('keydown', e => {
  if (!zoom && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); renderPhoto(activePhoto + (e.key === 'ArrowRight' ? 1 : -1)); }
  if (['+', '=', '-', '0'].includes(e.key)) { e.preventDefault(); setZoom(e.key === '0' ? 0 : zoom + (e.key === '-' ? -1 : 1)); }
 });
 addEventListener('resize', () => { if (photoDialog.open) setZoom(zoom); }, {passive: true});
 const photos = {
  ekb: [['assets/ekb-2.jpg', 'Екатеринбург. Произведения среди книг в библиотеке № 14, 2026'], ['assets/ekb-1.jpg', 'Екатеринбург. Книжные стеллажи библиотеки № 14, 2026']],
  yak: [['assets/yak-1.jpg', 'Якутск. Поиск произведений на библиотечных полках, 2026. Источник: АРТ КУЛЬТУРА'], ['assets/yak-2.jpg', 'Якутск. Знакомство с выставкой в библиотеке, 2026. Источник: АРТ КУЛЬТУРА'], ['assets/yak-3.jpg', 'Якутск. Произведения среди книг, 2026. Источник: АРТ КУЛЬТУРА']],
  nn: [['assets/nn-3.webp', 'Нижний Новгород. Встреча в библиотеке гимназии № 53, 2026'], ['assets/nn-2.webp', 'Нижний Новгород. Работы на стеллаже в гимназии № 53, 2026'], ['assets/nn-1.webp', 'Нижний Новгород. Участники встречи у экспозиции, 2026']],
  mur: [['assets/mur-2.webp', 'Мурманск. Поиск картины среди книг в центре «БиблиоДвиж», 2026'], ['assets/mur-1.webp', 'Мурманск. Зрители рассматривают произведение, 2026'], ['assets/mur-3.webp', 'Мурманск. Посетительница находит работу с помощью путеводителя, 2026']],
  sar: [['assets/saratov-1.webp', 'Саратов. Картина «Доктор» рядом с книгой «Доктор Айболит», 2026'], ['assets/saratov-2.webp', 'Саратов. «Красная книга» Даздрапермы Быковой на библиотечной полке, 2026'], ['assets/saratov-3.webp', 'Саратов. Знакомство с произведением у книжного стеллажа, 2026']]
 };
 $$('.city-gallery').forEach(gallery => {
  let index = 0;
  const list = photos[gallery.dataset.gallery];
  const original = $('.city-image', gallery), button = element('button', 'city-image');
  button.type = 'button'; button.setAttribute('aria-haspopup', 'dialog');
  button.append(...original.childNodes); original.replaceWith(button);
  const caption = element('p', 'gallery-caption'), counter = element('span', 'gallery-counter');
  counter.setAttribute('aria-live', 'polite'); counter.setAttribute('aria-atomic', 'true');
  gallery.append(counter, caption);
  function show(delta) {
   index = (index + delta + list.length) % list.length;
   const [src, text] = list[index], img = $('img', button);
   img.src = src; img.alt = text;
   button.setAttribute('aria-label', 'Увеличить: ' + text);
   caption.textContent = text;
   counter.textContent = (index + 1) + ' / ' + list.length;
  }
  button.addEventListener('click', () => openPhoto(list, index));
  $('[data-gallery-prev]', gallery).addEventListener('click', () => show(-1));
  $('[data-gallery-next]', gallery).addEventListener('click', () => show(1));
  gallery.setAttribute('role', 'region');
  gallery.setAttribute('aria-label', 'Фотографии: ' + gallery.closest('.city').querySelector('.city-map-heading h3').textContent);
  gallery.addEventListener('keydown', e => {
   if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); show(e.key === 'ArrowRight' ? 1 : -1); }
  });
  let touchStart, swiped = false;
  button.addEventListener('touchstart', e => {
   const touch = e.touches[0]; touchStart = {x: touch.clientX, y: touch.clientY}; swiped = false;
  }, {passive: true});
  button.addEventListener('touchend', e => {
   if (!touchStart) return;
   const touch = e.changedTouches[0], dx = touch.clientX - touchStart.x, dy = touch.clientY - touchStart.y;
   touchStart = undefined;
   if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { swiped = true; show(dx < 0 ? 1 : -1); }
  }, {passive: true});
  button.addEventListener('click', e => { if (swiped) { e.stopImmediatePropagation(); e.preventDefault(); swiped = false; } }, {capture: true});
  button.addEventListener('touchcancel', () => { touchStart = undefined; swiped = false; }, {passive: true});
  show(0);
 });
 const turning=$('.turning-art');if('IntersectionObserver' in window){new IntersectionObserver(entries=>{entries.forEach(entry=>turning.classList.toggle('art-in-view',entry.isIntersecting));},{threshold:.15}).observe(turning);}else{turning.classList.add('art-in-view');}
 const steps=$$('.story-step'),sceneImages=$$('.scene-image'),cities=$$('.city'),routeLinks=$$('[data-route]'),sceneArt=[3,8,18];let activeScene=-1,activeCity=-1,scheduled=false;
 function setScene(n){if(n===activeScene)return;activeScene=n;sceneImages.forEach((im,i)=>{im.classList.toggle('active',i===n);im.setAttribute('aria-hidden',String(i!==n));});$('#scene-count').textContent='0'+(n+1)+' / 03';const a=artists[sceneArt[n]];$('#scene-caption').textContent=a.name+' · «'+a.title+'»';$('#scene-open').dataset.art=a.id;}
 function updateScroll(){scheduled=false;const vh=innerHeight,max=document.documentElement.scrollHeight-vh;$('#reading-progress').style.width=(max>0?scrollY/max*100:0)+'%';const aim=innerWidth<=760?vh*.70:vh*.55;let s=0;steps.forEach((el,i)=>{if(el.getBoundingClientRect().top<=aim)s=i;});setScene(s);let c=0;cities.forEach((el,i)=>{if(el.getBoundingClientRect().top<vh*.48)c=i;});if(c!==activeCity){activeCity=c;routeLinks.forEach((a,i)=>{a.classList.toggle('active',i===c);a.classList.toggle('visited',i<c);if(i===c)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});}}
 function requestScroll(){if(!scheduled){scheduled=true;requestAnimationFrame(updateScroll);}}
 addEventListener('scroll',requestScroll,{passive:true});addEventListener('resize',requestScroll,{passive:true});updateScroll();
})();
