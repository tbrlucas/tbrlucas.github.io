(() => {
  const postList = document.getElementById("blog-post-list");
  const count = document.getElementById("blog-post-count");
  const article = document.getElementById("post-content");
  const homeList = document.getElementById("home-post-list");
  if (!postList && !article && !homeList) return;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  const formatDate = (value) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
    if (!match) return escapeHtml(value || "");
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
      .toLocaleDateString("en-US", {month:"short", day:"numeric", year:"numeric", timeZone:"UTC"});
  };
  const postUrl = (post) => "/blog/post.html?slug=" + encodeURIComponent(post.slug || "");

  // Small, safe Markdown-style renderer for the formatting supported by the blog editor.
  const safeMarkdownUrl = (value, image = false) => {
    const url = String(value || "").trim();
    if (/^https:\/\//i.test(url)) return escapeHtml(url);
    if (!image && /^\/backupsite\//.test(url)) return escapeHtml(url);
    if (image && /^\/backupsite\/assets\/images\//.test(url)) return escapeHtml(url);
    return "";
  };
  const renderInline = (value) => {
    let text = escapeHtml(value);
    text = text.replace(/!\[([^\]]*)\]\((https:\/\/[^)\s]+|\/backupsite\/assets\/images\/[^)\s]+)\)/g, (match, alt, url) => {
      const safe = safeMarkdownUrl(url, true);
      return safe ? '<img class="blog-inline-image" src="' + safe + '" alt="' + alt + '" loading="lazy">' : alt;
    });
    text = text.replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+|\/backupsite\/[^)\s]+)\)/g, (match, label, url) => {
      const safe = safeMarkdownUrl(url, false);
      return safe ? '<a href="' + safe + '" target="_blank" rel="noopener noreferrer">' + label + '</a>' : label;
    });
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
    text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
    return text;
  };
  const renderContent = (value) => {
    const lines = String(value || "").replace(/\r/g, "").split("\n");
    const output = [];
    let index = 0;
    while (index < lines.length) {
      const line = lines[index];
      if (!line.trim()) { index++; continue; }

      const heading = /^(#{1,2})\s+(.+)$/.exec(line.trim());
      if (heading) {
        const tag = heading[1].length === 1 ? "h2" : "h3";
        output.push("<" + tag + ">" + renderInline(heading[2]) + "</" + tag + ">");
        index++;
        continue;
      }

      if (/^\s*-\s+/.test(line)) {
        const items = [];
        while (index < lines.length && /^\s*-\s+/.test(lines[index])) {
          items.push("<li>" + renderInline(lines[index].replace(/^\s*-\s+/, "")) + "</li>");
          index++;
        }
        output.push("<ul>" + items.join("") + "</ul>");
        continue;
      }

      const paragraph = [];
      while (index < lines.length && lines[index].trim()
        && !/^(#{1,2})\s+/.test(lines[index].trim())
        && !/^\s*-\s+/.test(lines[index])) {
        paragraph.push(renderInline(lines[index]));
        index++;
      }
      output.push("<p>" + paragraph.join("<br>") + "</p>");
    }
    return output.join("\n");
  };

  const cardMarkup = (post) => {
    const theme = post.design || "default";
    const themeLabels = {"default":"Default theme","ios-6":"iOS 6 edition","android-market-2012":"Android Market 2012 edition","dark-2010s":"Dark 2010s edition","aero":"Aero special edition","cydia-classic":"Cydia Classic edition"};
    return `
      <article class="blog-card blog-card-${escapeHtml(theme)}">
        ${safeMarkdownUrl(post.coverImage, true) ? '<a class="blog-card-cover-link" href="' + postUrl(post) + '"><img class="blog-card-cover" src="' + safeMarkdownUrl(post.coverImage, true) + '" alt="" loading="lazy"></a>' : ''}
        <div class="blog-card-meta"><span>${formatDate(post.date)}</span><span>${escapeHtml(themeLabels[theme] || "Blog post")}</span></div>
        <h3><a href="${postUrl(post)}">${escapeHtml(post.title || "Untitled")}</a></h3>
        <p>${escapeHtml(post.excerpt || "")}</p>
        <a class="blog-read-link" href="${postUrl(post)}">Read more <span aria-hidden="true">→</span></a>
      </article>`;
  };

  fetch("/assets/data/posts.json?v=20261118-media-links", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("Could not load the posts file.");
      return response.json();
    })
    .then((data) => {
      const posts = (Array.isArray(data.posts) ? data.posts : [])
        .filter((post) => post.published === true)
        .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

      if (count) count.textContent = posts.length + (posts.length === 1 ? " published post" : " published posts");
      if (postList) {
        const searchInput = document.getElementById("blog-search");
        const searchResults = document.getElementById("blog-search-results");
        const renderPostList = () => {
          const term = String(searchInput?.value || "").trim().toLocaleLowerCase();
          const filtered = term ? posts.filter((post) =>
            [post.title, post.excerpt, post.content, post.date]
              .some((value) => String(value || "").toLocaleLowerCase().includes(term))
          ) : posts;
          postList.innerHTML = filtered.length
            ? filtered.map(cardMarkup).join("")
            : '<p class="post-empty">No articles match your search. Try another word.</p>';
          if (searchResults) {
            searchResults.textContent = term
              ? filtered.length + (filtered.length === 1 ? " result" : " results")
              : "Showing all " + posts.length + (posts.length === 1 ? " article" : " articles");
          }
        };
        if (searchInput) searchInput.addEventListener("input", renderPostList);
        renderPostList();
      }
      if (homeList) {
        const latest = posts.slice(0, 3);
        homeList.innerHTML = latest.length
          ? latest.map(cardMarkup).join("")
          : '<p class="post-empty">There are no published posts yet. Check back soon!</p>';
      }

      const featuredList = document.getElementById("featured-stories-list");
      if (featuredList) {
        const featuredSlugs = [
          "why-windows-7-is-the-best",
          "is-jailbreaking-worth-it",
          "rooting-android-and-its-consequences-should-i-really-root-my-old-device"
        ];
        const featured = featuredSlugs
          .map((slug) => posts.find((post) => post.slug === slug))
          .filter(Boolean);
        featuredList.innerHTML = featured.length
          ? featured.map((post, index) => {
              const labels = ["WINDOWS", "APPLE & IOS", "ANDROID"];
              return `<article class="featured-story-card featured-story-card-${index + 1}">
                <p class="featured-story-label">${labels[index] || "FROM THE BLOG"}</p>
                <h3><a href="${postUrl(post)}">${escapeHtml(post.title || "Untitled")}</a></h3>
                <p class="featured-story-excerpt">${escapeHtml(post.excerpt || "")}</p>
                <div class="featured-story-bottom"><span>${formatDate(post.date)}</span><a href="${postUrl(post)}">Read story <span aria-hidden="true">→</span></a></div>
              </article>`;
            }).join("")
          : '<p class="post-empty">Featured stories will appear here as articles are published.</p>';
      }

      if (article) {
        const slug = new URLSearchParams(location.search).get("slug");
        const post = posts.find((item) => item.slug === slug);
        if (!post) {
          article.className = "well article-panel";
          article.innerHTML = '<div class="copy-panel"><h1>Post not found</h1><p>This post may have been moved or is not published.</p></div>';
          return;
        }

        const coverImage = safeMarkdownUrl(post.coverImage, true);
        const content = (coverImage ? '<figure class="blog-cover-figure"><img class="blog-cover-image" src="' + coverImage + '" alt="' + escapeHtml(post.title || "Article cover") + '"></figure>' : '') + renderContent(post.content);
        const theme = post.design || "default";
        if (theme === "android-market-2012") {
          document.body.classList.add("android-market-page");
          article.className = "market-article-shell";
          article.innerHTML = `
            <div class="market-store-header">
              <div class="market-brand-row">
                <div class="market-robot-mark" aria-hidden="true"><i></i></div>
                <div class="market-brand-name"><strong>android</strong><span>market</span></div>
                <span class="market-header-caption">Discover. Explore. Enjoy.</span>
              </div>
              <nav class="market-category-nav" aria-label="Android Market sections">
                <span class="active">FEATURED</span><span>APPS</span><span>GAMES</span><span>MY LIBRARY</span>
              </nav>
            </div>
            <div class="market-breadcrumb"><a href="/">Home</a><span>›</span><a href="/blog/">Blog</a><span>›</span><span>Article</span></div>
            <div class="market-detail-card">
              <header class="market-app-heading">
                <div class="market-app-icon" aria-hidden="true"><span>tbrlucas</span><strong>Blog</strong></div>
                <div class="market-app-heading-copy">
                  <p class="market-eyebrow">TBRLUCAS BLOG · ANDROID MARKET EDITION</p>
                  <h1>${escapeHtml(post.title || "Untitled")}</h1>
                  <p class="market-excerpt">${escapeHtml(post.excerpt || "")}</p>
                  <div class="market-meta"><span>${formatDate(post.date)}</span><span>tbrlucas editorial</span></div>
                </div>
              </header>
              <div class="market-content-layout">
                <div class="market-article-content">${content}</div>
                <aside class="market-sidebar">
                  <div class="market-side-panel">
                    <h2>ABOUT THIS ARTICLE</h2>
                    <p>${escapeHtml(post.excerpt || "An article from the tbrlucas blog.")}</p>
                    <div class="market-side-line"><span>SECTION</span><strong>Blog</strong></div>
                    <div class="market-side-line"><span>FORMAT</span><strong>Article</strong></div>
                  </div>
                  <div class="market-side-note"><strong>Keep exploring</strong><p>Discover more articles and stories from the tbrlucas blog.</p></div>
                  <a class="market-back-link" href="/blog/">‹ Back to all articles</a>
                </aside>
              </div>
              <footer class="market-card-footer">ANDROID MARKET STYLE · TBRLUCAS BLOG</footer>
            </div>`;
        } else if (theme === "aero") {
          document.body.classList.add("aero-blog-page");
          article.className = "aero-article-shell";
          article.innerHTML = `
            <div class="aero-atmosphere" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
            <header class="aero-topbar">
              <a class="aero-brand" href="/"><span class="aero-brand-orb"></span><span><strong>tbrlucas</strong><small>TECHNOLOGY JOURNAL</small></span></a>
              <span class="aero-edition-label">AERO SPECIAL EDITION</span>
              <a class="aero-index-link" href="/blog/">All articles <span aria-hidden="true">→</span></a>
            </header>
            <section class="aero-hero">
              <p class="aero-kicker"><span></span> FEATURE STORY · WINDOWS</p>
              <h1>${escapeHtml(post.title || "Untitled")}</h1>
              <p class="aero-deck">${escapeHtml(post.excerpt || "")}</p>
              <div class="aero-meta"><span>${formatDate(post.date)}</span><span> TBRLUCAS EDITORIAL</span><span> AERO COLLECTION</span></div>
              <div class="aero-hero-orb aero-orb-one"></div><div class="aero-hero-orb aero-orb-two"></div>
            </section>
            <section class="aero-window">
              <div class="aero-window-chrome"><div class="aero-window-dots"><i></i><i></i><i></i></div><span>ARTICLE VIEWER</span><span class="aero-window-status">GLASS INTERFACE</span></div>
              <div class="aero-content-layout">
                <div class="aero-article-content">${content}</div>
                <aside class="aero-sidebar">
                  <div class="aero-side-glass"><p class="aero-side-label">IN THIS FEATURE</p><strong>Windows 7</strong><p>From the Longhorn development reset to the operating system's lasting place in PC history.</p><div class="aero-side-rule"></div><span>HISTORY · DESIGN · LEGACY</span></div>
                  <div class="aero-side-glass aero-side-note"><span class="aero-side-label">THE AERO COLLECTION</span><p>A special visual edition from the tbrlucas technology journal.</p></div>
                  <a class="aero-back-link" href="/blog/">← Back to all articles</a>
                </aside>
              </div>
              <footer class="aero-window-footer"><span>tbrlucas</span><span>DESIGNED WITH AERO GLASS</span></footer>
            </section>
            <footer class="aero-page-footer"><a href="/">tbrlucas home</a><span>Independent technology journal</span></footer>`;
        } else if (theme === "cydia-classic") {
          document.body.classList.add("cydia-classic-page");
          article.className = "cydia-article-shell";
          article.innerHTML = `
            <header class="cydia-topbar">
              <a class="cydia-brand" href="/"><span class="cydia-mark">C</span><span><strong>Cydia</strong><small>tbrlucas blog edition</small></span></a>
              <a class="cydia-index-link" href="/blog/">All articles</a>
            </header>
            <nav class="cydia-tabs" aria-label="Article sections"><span class="active">ARTICLE</span><span>DISCOVER</span><span>COMMUNITY</span></nav>
            <div class="cydia-breadcrumb"><a href="/">Home</a><span>›</span><a href="/blog/">Blog</a><span>›</span><span>Article</span></div>
            <section class="cydia-app-panel">
              <header class="cydia-app-heading">
                <div class="cydia-app-icon" aria-hidden="true"><span>t</span></div>
                <div><p class="cydia-eyebrow">TBRLUCAS BLOG · CYDIA CLASSIC</p><h1>${escapeHtml(post.title || "Untitled")}</h1><p class="cydia-excerpt">${escapeHtml(post.excerpt || "")}</p><div class="cydia-meta"><span>${formatDate(post.date)}</span><span>EDITORIAL</span><span>iOS & IPAD</span></div></div>
              </header>
              <div class="cydia-toolbar"><span>PACKAGE DETAILS</span><span class="cydia-toolbar-status">ARTICLE VIEW</span></div>
              <div class="cydia-content-layout">
                <div class="cydia-article-content">${content}</div>
                <aside class="cydia-sidebar">
                  <div class="cydia-info-panel"><h2>ABOUT THIS ARTICLE</h2><p>${escapeHtml(post.excerpt || "An article from the tbrlucas blog.")}</p><div><span>CATEGORY</span><strong>Technology</strong></div><div><span>EDITION</span><strong>Cydia Classic</strong></div></div>
                  <div class="cydia-note"><strong>From the archive</strong><p>Exploring the software, ideas and communities that shaped mobile technology.</p></div>
                  <a class="cydia-back-link" href="/blog/">‹ Back to all articles</a>
                </aside>
              </div>
              <footer class="cydia-card-footer"><span>tbrlucas</span><span>INSPIRED BY CLASSIC CYDIA</span></footer>
            </section>
            <footer class="cydia-page-footer"><a href="/">tbrlucas home</a><span>Independent technology journal</span></footer>`;
        } else if (theme === "ios-6") {
          document.body.classList.add("ios6-blog-page");
          article.className = "ios6-article-shell";
          article.innerHTML = `
            <div class="ios6-blog-top"><span class="ios6-blog-mark">t</span><span>tbrlucas <small> / BLOG</small></span><a href="/blog/">All articles</a></div>
            <div class="ios6-article-card">
              <div class="ios6-article-toolbar"><span>ARTICLE</span><span>${formatDate(post.date)}</span></div>
              <header class="ios6-article-heading"><p>tbrlucas blog</p><h1>${escapeHtml(post.title || "Untitled")}</h1><div>${escapeHtml(post.excerpt || "")}</div></header>
              <div class="ios6-article-content">${content}</div>
              <footer><a href="/blog/">‹ Back to the blog</a><span>Designed with an iOS 6-inspired look</span></footer>
            </div>`;
        } else if (theme === "dark-2010s") {
          document.body.classList.add("dark-2010s-blog-page");
          article.className = "dark2010-article-shell";
          article.innerHTML = `
            <div class="dark2010-topbar"><a href="/">tbrlucas</a><span>PERSONAL BLOG / ${formatDate(post.date)}</span><a href="/blog/">← Blog index</a></div>
            <header class="dark2010-heading"><p>THOUGHTS, NOTES & TECHNOLOGY</p><h1>${escapeHtml(post.title || "Untitled")}</h1><div>${escapeHtml(post.excerpt || "")}</div></header>
            <div class="dark2010-rule"></div>
            <div class="dark2010-content">${content}</div>
            <footer class="dark2010-footer"><a href="/blog/">← Back to all posts</a><span>tbrlucas · independent blog</span></footer>`;
        } else {
          article.className = "well article-panel";
          article.innerHTML = `<div class="copy-panel"><p class="blog-list-meta">${formatDate(post.date)}</p><h1>${escapeHtml(post.title || "Untitled")}</h1><p class="article-excerpt">${escapeHtml(post.excerpt || "")}</p><div class="blog-article-content">${content}</div></div>`;
        }
        const currentIndex = posts.findIndex((item) => item.slug === post.slug);
        const newerPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
        const olderPost = currentIndex >= 0 && currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;
        const navigation = document.createElement("nav");
        navigation.className = "blog-post-navigation";
        navigation.setAttribute("aria-label", "More blog articles");
        navigation.innerHTML = `
          <div class="blog-post-navigation-heading"><span>KEEP READING</span><a href="/blog/">All articles</a></div>
          <div class="blog-post-navigation-links">
            ${newerPost ? `<a class="blog-post-nav-item" href="${postUrl(newerPost)}"><span>← NEWER ARTICLE</span><strong>${escapeHtml(newerPost.title || "Untitled")}</strong></a>` : '<span class="blog-post-nav-empty">You are viewing the newest article.</span>'}
            ${olderPost ? `<a class="blog-post-nav-item blog-post-nav-older" href="${postUrl(olderPost)}"><span>OLDER ARTICLE →</span><strong>${escapeHtml(olderPost.title || "Untitled")}</strong></a>` : '<span class="blog-post-nav-empty">You are viewing the oldest article.</span>'}
          </div>`;
        article.appendChild(navigation);
        document.title = `tbrlucas :: ${post.title || "blog post"}`;
      }
    })
    .catch(() => {
      const message = '<p class="post-empty">Posts are temporarily unavailable.</p>';
      if (postList) postList.innerHTML = message;
      if (count) count.textContent = "Posts unavailable";
      if (article) article.innerHTML = message;
      if (homeList) homeList.innerHTML = message;
    });
})();
