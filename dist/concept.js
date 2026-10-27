(() => {
  const title = document.querySelector('.concept-title');
  if (!title) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let observer;
  function setup() {
    observer?.disconnect();
    if (reduced.matches || !('IntersectionObserver' in window)) {
      title.classList.remove('draw-pending');
      return;
    }
    if (title.classList.contains('draw-started')) return;
    title.classList.add('draw-pending');
    observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      title.classList.add('draw-started');
      observer.disconnect();
    }, {threshold: .2});
    observer.observe(title);
  }
  reduced.addEventListener('change', setup);
  setup();
})();
