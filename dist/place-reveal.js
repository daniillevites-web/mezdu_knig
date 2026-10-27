(() => {
  const places = [...document.querySelectorAll('.city-place')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let observer;
  function setup() {
    observer?.disconnect();
    if (reduced.matches || !('IntersectionObserver' in window)) {
      places.forEach(place => place.classList.remove('place-pending'));
      return;
    }
    observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('place-revealed');
      observer.unobserve(entry.target);
    }), {threshold: .2});
    places.forEach(place => {
      if (place.classList.contains('place-revealed')) return;
      place.classList.add('place-pending');
      observer.observe(place);
    });
  }
  reduced.addEventListener('change', setup);
  setup();
})();
