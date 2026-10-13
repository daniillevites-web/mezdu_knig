(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const container = $('.city-chapters'), rows = $$('.journey-road .city');
  const svg = $('.journey-ribbon'), path = $('.ribbon-progress');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const glow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  glow.setAttribute('class', 'ribbon-glow');
  svg.insertBefore(glow, path);
  let samples = [], stops = [], total = 0, shown = 0, frame = 0, layoutFrame = 0, lastTime = 0;
  function lengthAtY(y) {
    if (!samples.length || y <= samples[0].y) return 0;
    if (y >= samples.at(-1).y) return total;
    let lo = 0, hi = samples.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (samples[mid].y <= y) lo = mid; else hi = mid;
    }
    const a = samples[lo], b = samples[hi];
    return a.len + (b.len - a.len) * (y - a.y) / Math.max(.001, b.y - a.y);
  }
  function rebuildRoad() {
    layoutFrame = 0;
    const box = container.getBoundingClientRect(), mobile = innerWidth <= 760;
    const points = rows.map((row, i) => {
      const r = $('.city-photo-window', row).getBoundingClientRect();
      const x = (mobile || i % 2 ? r.left : r.right) - box.left;
      return { x, y: r.top + $('.city-image', row).getBoundingClientRect().height * .5 - box.top };
    });
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    const first = points[0], last = points.at(-1);
    const routePoints = mobile ? points.flatMap((p, i) => i ? [{x: 12, y: (points[i - 1].y + p.y) / 2}, p] : [p]) : points;
    let d = `M ${first.x} ${Math.max(0, first.y - 180)} C ${first.x} ${first.y - 100} ${first.x} ${first.y - 60} ${first.x} ${first.y}`;
    for (let i = 1; i < routePoints.length; i++) {
      const a = routePoints[i - 1], b = routePoints[i], dy = b.y - a.y;
      d += ` C ${a.x} ${a.y + dy * .48} ${b.x} ${b.y - dy * .48} ${b.x} ${b.y}`;
    }
    const end = Math.min(box.height - 8, last.y + 220);
    d += ` C ${last.x} ${last.y + (end - last.y) * .4} ${last.x} ${end - 30} ${last.x} ${end}`;
    const fraction = total ? shown / total : 0;
    path.setAttribute('d', d); glow.setAttribute('d', d);
    total = path.getTotalLength(); shown = total * fraction;
    samples = Array.from({length: 1001}, (_, i) => {
      const len = total * i / 1000;
      return {len, y: path.getPointAtLength(len).y};
    });
    stops = points.map(p => lengthAtY(p.y));
    for (const p of [path, glow]) p.style.strokeDasharray = `${total} ${total}`;
    scheduleDraw();
  }
  function drawRoad(time) {
    frame = 0;
    if (!total) return;
    const target = reduce.matches ? total : lengthAtY(innerHeight * .62 - container.getBoundingClientRect().top);
    const dt = lastTime ? Math.min(64, time - lastTime) : 16;
    lastTime = time;
    if (reduce.matches || Math.abs(target - shown) < .3) shown = target;
    else shown += (target - shown) * (1 - Math.exp(-dt / 145));
    for (const p of [path, glow]) p.style.strokeDashoffset = String(total - shown);
    rows.forEach((row, i) => row.classList.toggle('route-reached', shown >= stops[i] - .3));
    if (Math.abs(target - shown) >= .3) scheduleDraw(); else lastTime = 0;
  }
  function scheduleDraw() { if (!frame) frame = requestAnimationFrame(drawRoad); }
  function scheduleLayout() { if (!layoutFrame) layoutFrame = requestAnimationFrame(rebuildRoad); }
  addEventListener('scroll', scheduleDraw, {passive: true});
  addEventListener('resize', scheduleLayout, {passive: true});
  addEventListener('load', scheduleLayout);
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(scheduleLayout);
    ro.observe(container); rows.forEach(r => ro.observe(r));
  }
  // Progressive enhancement keeps the complete illustrations visible without JS.
  let observer;
  function setupContours() {
    observer?.disconnect();
    if (reduce.matches || !('IntersectionObserver' in window)) {
      container.classList.remove('contours-animated');
      rows.forEach(r => r.classList.add('contour-started'));
      return;
    }
    container.classList.add('contours-animated');
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.closest('.city').classList.add('contour-started');
        observer.unobserve(entry.target);
      });
    }, {threshold: .08, rootMargin: '0px 0px -12% 0px'});
    rows.filter(r => !r.classList.contains('contour-started')).forEach(r => observer.observe($('.city-stage', r)));
  }
  reduce.addEventListener('change', () => { setupContours(); scheduleDraw(); });
  setupContours(); rebuildRoad();
})();
