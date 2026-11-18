(() => {
  "use strict";

  const reveal = () => document.documentElement.classList.remove("maintenance-checking");
  const escapeHtml = value => String(value || "").replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[char]));

  fetch(new URL("../data/maintenance.json?v=20261115-2", document.currentScript.src), {cache:"no-store"})
    .then(response => {
      if (!response.ok) throw new Error("Maintenance settings unavailable");
      return response.json();
    })
    .then(settings => {
      if (settings.enabled !== true) {
        reveal();
        return;
      }

      // Maintenance mode always uses the site's light appearance.
      document.documentElement.removeAttribute("data-theme");
      const themeColor = document.querySelector('meta[name="theme-color"]');
      if (themeColor) themeColor.setAttribute("content", "#4f7fbf");

      document.title = "tbrlucas :: temporarily unavailable";
      document.body.className = "maintenance-page";
      document.body.innerHTML = `
        <a class="skip-link" href="#main-content">Skip to content</a>
        <header class="site-header">
          <div class="navbar navbar-fixed-top">
            <div class="navbar-inner">
              <div class="container">
                <button type="button" class="btn btn-navbar" data-toggle="collapse" data-target=".nav-collapse" aria-label="Toggle navigation">
                  <span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span>
                </button>
                <a class="brand" href="/">tbrlucas</a>
                <div class="nav-collapse collapse">
                  <ul class="nav">
                    <li class="active"><a href="/">Home</a></li>
                    <li><a href="/projects/">Projects</a></li>
                    <li><a href="/downloads/">Downloads</a></li>
                    <li><a href="/blog/">Blog</a></li>
                    <li><a href="/whats-new/">What’s New</a></li>
                    <li><a href="/about/">About</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main class="container page maintenance-page-content" id="main-content">
          <section class="maintenance-heading">
            <p class="maintenance-kicker">TBRLUCAS · TEMPORARILY UNAVAILABLE</p>
            <h1>We'll be back soon!</h1>
            <p class="maintenance-lead">The website is temporarily unavailable while we're carrying out some maintenance. We appreciate your patience, and we'll be back as soon as we can.</p>
          </section>

          <section class="maintenance-panel" aria-labelledby="maintenance-message-title">
            <h2 id="maintenance-message-title">A little break for the website</h2>
            <p>We know you wanted to visit, and we're sorry for the interruption. The site is being worked on behind the scenes to keep everything running smoothly.</p>
            <p style="margin-top:12px"><strong>Please check back soon!</strong></p>
          </section>

          <section class="maintenance-info" aria-label="Maintenance information">
            <div class="well">
              <h2>Estimated return</h2>
              <p>${escapeHtml(settings.eta || "To be announced")}</p>
            </div>
            <div class="well">
              <h2>Why are we here?</h2>
              <p>${escapeHtml(settings.reason || "We're carrying out some maintenance. More details will be available soon.")}</p>
            </div>
          </section>

          <section class="maintenance-surprise" aria-labelledby="surprise-title">
            <h2 id="surprise-title">Need a little entertainment?</h2>
            <button type="button" class="btn btn-primary" id="surprise-message-button">Surprise me with a random message...</button>
            <p id="surprise-message" aria-live="polite">Go on. You might get a perfectly reasonable explanation. Or not.</p>
          </section>

          <footer class="site-footer">
            <ul class="breadcrumb"><li class="active">Temporarily unavailable</li></ul>
            <p><strong>© tbrlucas</strong> · <a href="/about/">learn more about this site</a> · <span>${new Date().getFullYear()}</span></p>
          </footer>
        </main>`;

      const messages = [
        "We really didn't want to be undergoing maintenance... but what can you do? The boss asked for it.",
        "Our website is taking a short break. We told it not to forget its password.",
        "Don't worry, we haven't disappeared. We're just fixing a few things behind the scenes.",
        "Someone probably changed one tiny thing and accidentally started a whole project. We're working on it.",
        "Maintenance is temporary. Your nostalgia is forever.",
        "We could tell you exactly what's happening, but that would ruin the surprise.",
        "The website is currently busy being improved. Please do not disturb. (It gets nervous.)",
        "A few screws needed tightening. No actual screws were harmed.",
        "This is not a 404. The website knows exactly where it is. It just needs a moment.",
        "Thanks for waiting! Good things take time, and apparently so do website updates."
      ];

      let previousMessage = -1;
      const button = document.getElementById("surprise-message-button");
      const output = document.getElementById("surprise-message");
      button.addEventListener("click", () => {
        let next;
        do {
          next = Math.floor(Math.random() * messages.length);
        } while (messages.length > 1 && next === previousMessage);
        previousMessage = next;
        output.textContent = messages[next];
      });

      const stylesheet = document.createElement("link");
      stylesheet.rel = "stylesheet";
      stylesheet.href = "/assets/css/maintenance.css?v=20261115-1";
      stylesheet.addEventListener("load", reveal, {once:true});
      stylesheet.addEventListener("error", reveal, {once:true});
      document.head.appendChild(stylesheet);
    })
    .catch(reveal);
})();