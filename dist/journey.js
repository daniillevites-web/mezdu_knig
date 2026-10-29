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
  const outro = $('.outro'), dot = $('.outro-dot');
  document.body.classList.add('route-animated');
  const ns = 'http://www.w3.org/2000/svg';
  const defs = document.createElementNS(ns, 'defs');
  svg.prepend(defs);
  const glows = [glow, glow.cloneNode(), glow.cloneNode()];
  glows.slice(1).forEach(p => svg.insertBefore(p, path));
  const gradients = glows.map((p, i) => {
    const gradient = document.createElementNS(ns, 'linearGradient');
    gradient.id = 'road-blur-gradient-' + i;
    gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
    gradient.setAttribute('x1', '0'); gradient.setAttribute('x2', '0');
    const profiles = [[[0, 1], [.35, 1], [.7, 0], [1, 0]], [[0, 0], [.3, 0], [.6, 1], [.85, 0], [1, 0]], [[0, 0], [.6, 0], [.8, 1], [1, 0]]];
    profiles[i].forEach(([offset, opacity]) => {
      const stop = document.createElementNS(ns, 'stop');
      stop.setAttribute('offset', offset); stop.setAttribute('stop-color', 'white'); stop.setAttribute('stop-opacity', opacity); gradient.append(stop);
    });
    const mask = document.createElementNS(ns, 'mask');
    mask.id = 'road-blur-mask-' + i;
    mask.setAttribute('maskUnits', 'userSpaceOnUse');
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('fill', `url(#${gradient.id})`); mask.append(rect);
    defs.append(gradient, mask);
    p.setAttribute('mask', `url(#${mask.id})`);
    p.style.filter = `blur(${[6, 3, 1][i]}px)`;
    return {gradient, mask, rect};
  });
  const roadPaths = [path, ...glows];
  const tail = document.createElementNS(ns, 'path');
  tail.setAttribute('class', 'ribbon-progress ribbon-tail');
  const tailGlows = glows.map(p => p.cloneNode());
  tailGlows.forEach(p => { p.classList.add('ribbon-tail-glow'); svg.append(p); });
  svg.append(tail);
  const tailPaths = [tail, ...tailGlows];
  let tailLength = 0, outroStart = null;
  function drawEnding(time) {
    const r = dot.getBoundingClientRect();
    const inView = r.top + r.height / 2 < innerHeight - 12 && r.bottom > 0;
    const ready = reduce.matches || (inView && shown >= total - .5);
    if (!ready) outroStart = null;
    else if (outroStart === null) outroStart = time;
    const progress = reduce.matches ? 1 : ready ? Math.min(1, (time - outroStart) / 900) : 0;
    const eased = progress * progress * (3 - 2 * progress);
    // Both marks share one clock. The reversed tail draws directly out of the dot.
    const dotProgress = Math.min(1, progress * 3);
    dot.style.opacity = String(dotProgress);
    dot.style.transform = `scale(${.15 + .85 * (1 - Math.pow(1 - dotProgress, 3))})`;
    tailPaths.forEach(p => { p.style.strokeDashoffset = String(tailLength * (1 - eased)); });
    outro.classList.toggle('route-arrived', progress === 1);
    return ready && progress < 1;
  }
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
    const dotBox = dot.getBoundingClientRect();
    const end = {x: dotBox.left + dotBox.width / 2 - box.left, y: dotBox.top + dotBox.height / 2 - box.top};
    svg.style.setProperty('--route-height', `${end.y + 30}px`);
    svg.setAttribute('viewBox', `0 0 ${box.width} ${end.y + 30}`);
    gradients.forEach(({gradient, mask, rect}) => {
      gradient.setAttribute('y1', Math.max(0, end.y - 900)); gradient.setAttribute('y2', end.y);
      for (const el of [mask, rect]) {
        el.setAttribute('x', '-50'); el.setAttribute('y', '-200'); el.setAttribute('width', box.width + 100); el.setAttribute('height', end.y + 250);
      }
    });
    const first = points[0], last = points.at(-1);
    const routePoints = mobile ? points.flatMap((p, i) => i ? [{x: 12, y: (points[i - 1].y + p.y) / 2}, p] : [p]) : points;
    let d = `M ${first.x} -180 C ${first.x} ${first.y - 100} ${first.x} ${first.y - 60} ${first.x} ${first.y}`;
    for (let i = 1; i < routePoints.length; i++) {
      const a = routePoints[i - 1], b = routePoints[i], dy = b.y - a.y;
      d += ` C ${a.x} ${a.y + dy * .48} ${b.x} ${b.y - dy * .48} ${b.x} ${b.y}`;
    }
    const tailD = `M ${end.x} ${end.y} C ${end.x} ${end.y - 100} ${last.x} ${last.y + (end.y - last.y) * .45} ${last.x} ${last.y}`;
    tailPaths.forEach(p => p.setAttribute('d', tailD));
    tailLength = tail.getTotalLength();
    tailPaths.forEach(p => { p.style.strokeDasharray = `${tailLength} ${tailLength}`; });
    const fraction = total ? shown / total : 0;
    roadPaths.forEach(p => p.setAttribute('d', d));
    total = path.getTotalLength(); shown = total * fraction;
    samples = Array.from({length: 1001}, (_, i) => {
      const len = total * i / 1000;
      return {len, y: path.getPointAtLength(len).y};
    });
    stops = points.map(p => lengthAtY(p.y));
    for (const p of roadPaths) p.style.strokeDasharray = `${total} ${total}`;
    scheduleDraw();
  }
  function drawRoad(time) {
    frame = 0;
    if (!total) return;
    const atBottom = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
    const target = reduce.matches || atBottom ? total : lengthAtY(innerHeight * .62 - container.getBoundingClientRect().top);
    const dt = lastTime ? Math.min(64, time - lastTime) : 16;
    lastTime = time;
    if (reduce.matches || Math.abs(target - shown) < .3) shown = target;
    else shown += (target - shown) * (1 - Math.exp(-dt / 145));
    for (const p of roadPaths) p.style.strokeDashoffset = String(total - shown);
    rows.forEach((row, i) => row.classList.toggle('route-reached', shown >= stops[i] - .3));
    const endingInMotion = drawEnding(time);
    if (Math.abs(target - shown) >= .3 || endingInMotion) scheduleDraw(); else lastTime = 0;
  }
  function scheduleDraw() { if (!frame) frame = requestAnimationFrame(drawRoad); }
  function scheduleLayout() { if (!layoutFrame) layoutFrame = requestAnimationFrame(rebuildRoad); }
  addEventListener('scroll', scheduleDraw, {passive: true});
  addEventListener('resize', scheduleLayout, {passive: true});
  addEventListener('load', scheduleLayout);
  document.fonts?.ready.then(scheduleLayout);
  $('.creators-disclosure')?.addEventListener('toggle', scheduleLayout);
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(scheduleLayout);
    ro.observe(container); ro.observe(outro); rows.forEach(r => ro.observe(r));
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
    rows.filter(r => !r.classList.contains('contour-started')).forEach(r => observer.observe($('.city-contour', r)));
  }
  reduce.addEventListener('change', () => { setupContours(); scheduleDraw(); });
  setupContours(); rebuildRoad();
})();
