(() => {
  const figure = document.querySelector('.origin-building');
  if (!figure) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let observer;
  function setup() {
    observer?.disconnect();
    if (reduced.matches || !('IntersectionObserver' in window)) {
      figure.classList.remove('building-pending');
      return;
    }
    if (figure.classList.contains('building-started')) return;
    figure.classList.add('building-pending');
    observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      figure.classList.add('building-started');
      observer.disconnect();
    }, {threshold: .15});
    observer.observe(figure);
  }
  reduced.addEventListener('change', setup);
  setup();
})();
