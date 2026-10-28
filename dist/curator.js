(() => {
  'use strict';
  const board = document.querySelector('.curator-board');
  if (!board) return;
  const works = [...board.querySelectorAll('.curator-work')];
  const cursor = board.querySelector('.curator-cursor');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const order = [0, 4, 2, 5, 7, 3, 6, 8, 1];
  let frame = 0, visible = false, hovering = false, lastTime = 0, elapsed = 0, touching = false, resumeTimer = 0;
  function clear() { works.forEach(work => work.classList.remove('auto-active')); }
  function stop() {
    cancelAnimationFrame(frame); frame = 0; lastTime = 0;
    board.classList.remove('cursor-playing'); clear();
  }
  function tick(time) {
    frame = 0;
    if (!visible || hovering || touching || reduced.matches || document.hidden || board.contains(document.activeElement)) { stop(); return; }
    if (lastTime) elapsed += Math.min(time - lastTime, 64);
    lastTime = time;
    const duration = 5600, stage = elapsed / duration;
    const index = Math.floor(stage) % order.length;
    const phase = stage % 1;
    const from = works[order[(index + order.length - 1) % order.length]].getBoundingClientRect();
    const to = works[order[index]].getBoundingClientRect();
    const bounds = board.getBoundingClientRect();
    const t = Math.min(1, phase / .72), eased = t * t * (3 - 2 * t);
    const x = from.left + from.width * .55 + (to.left + to.width * .55 - from.left - from.width * .55) * eased - bounds.left + board.scrollLeft;
    const y = from.top + from.height * .5 + (to.top + to.height * .5 - from.top - from.height * .5) * eased;
    // Keep the moving cursor in view when the single row needs horizontal scrolling.
    if (board.scrollWidth > board.clientWidth + 1) {
      board.scrollLeft = Math.max(0, Math.min(board.scrollWidth - board.clientWidth, x - board.clientWidth / 2));
    }
    cursor.style.transform = `translate(${x}px, ${y - bounds.top + board.scrollTop}px)`;
    board.classList.add('cursor-playing');
    works.forEach(work => {
      const r = work.getBoundingClientRect();
      work.classList.toggle('auto-active', x > r.left - bounds.left + board.scrollLeft && x < r.right - bounds.left + board.scrollLeft && y > r.top && y < r.bottom);
    });
    frame = requestAnimationFrame(tick);
  }
  function start() { if (!frame) frame = requestAnimationFrame(tick); }
  works.forEach(work => {
    work.addEventListener('click', () => {
      const selected = work.getAttribute('aria-pressed') !== 'true';
      works.forEach(other => other.setAttribute('aria-pressed', String(other === work && selected)));
    });
    work.addEventListener('blur', () => work.setAttribute('aria-pressed', 'false'));
  });
  board.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') { hovering = true; stop(); } });
  board.addEventListener('pointerleave', event => { if (event.pointerType === 'touch') return; hovering = false; works.forEach(w => w.setAttribute('aria-pressed', 'false')); start(); });
  board.addEventListener('touchstart', () => {
    clearTimeout(resumeTimer); touching = true; stop();
  }, {passive: true});
  function resumeAfterTouch() {
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => { touching = false; start(); }, 2500);
  }
  board.addEventListener('touchend', resumeAfterTouch, {passive: true});
  board.addEventListener('touchcancel', resumeAfterTouch, {passive: true});
  board.addEventListener('focusin', stop);
  board.addEventListener('focusout', () => requestAnimationFrame(start));
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  reduced.addEventListener('change', () => { stop(); start(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      visible ? start() : stop();
    }, {threshold: .08}).observe(board);
  } else { visible = true; start(); }
})();
