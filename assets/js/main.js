(() => {
  const now = new Date();

  const hour = now.getHours();
  let greeting = "good night";

  if (hour >= 5 && hour < 12) {
    greeting = "good morning";
  } else if (hour >= 12 && hour < 18) {
    greeting = "good afternoon";
  }

  document.title = "tbrlucas :: " + greeting;

  const year = document.getElementById("year");
  if (year) year.textContent = String(now.getFullYear());

  if (window.jQuery && window.jQuery.fn.carousel) {
    const $carousel = window.jQuery("#deviceCarousel");
    if ($carousel.length) {
      const reduceMotion = window.matchMedia
        && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      $carousel.carousel({ interval: reduceMotion ? false : 6500, pause: "hover" });
    }
  }
})();
