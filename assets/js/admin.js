(() => {
  const config = window.TBRLUCAS_ADMIN_CONFIG || {};
  const apiBase = String(config.apiBase || "").replace(/\/$/, "");
  const siteBase = new URL("../../", location.href).pathname;
  const $ = (id) => document.getElementById(id);
  const setup = $("admin-setup");
  const login = $("admin-login");
  const app = $("admin-app");
  const sessionKey = "tbrlucas_admin_session";
  let session = sessionStorage.getItem(sessionKey) || "";
  let posts = [];

  const show = (element, visible) => { if (element) element.hidden = !visible; };
  const message = (text, isError = false) => {
    const target = $("admin-message");
    if (!target) return;
    target.textContent = text;
    target.className = isError ? "admin-message error" : "admin-message";
  };
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  const loginMessage = (text = "") => { const target = $("admin-login-message"); if (target) target.textContent = text; };
  const localDate = () => { const date = new Date(); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
  const slugify = (value) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80).replace(/-+$/g, "");

  async function api(path, options = {}) {
    if (!apiBase) throw new Error("The administration API URL has not been configured.");
    const headers = new Headers(options.headers || {});
    if (session) headers.set("Authorization", `Bearer ${session}`);
    if (typeof options.body === "string" && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const response = await fetch(apiBase + path, { ...options, headers, mode: "cors" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
    return data;
  }

  function renderPosts() {
    const target = $("admin-post-list");
    if (!posts.length) {
      target.innerHTML = '<p class="post-empty">No posts yet. Create your first publication.</p>';
      return;
    }
    target.innerHTML = posts.slice().sort((a,b) => String(b.date).localeCompare(String(a.date))).map(post =>
      `<button class="admin-post-row" type="button" data-slug="${escapeHtml(post.slug)}">
        <strong>${escapeHtml(post.title)}</strong>
        <span>${escapeHtml(post.date || "")} · ${({"default":"Default theme · ","ios-6":"iOS 6 theme · ","android-market-2012":"Android Market 2012 theme · ","dark-2010s":"Dark 2010s theme · ","aero":"Aero special edition · ","cydia-classic":"Cydia Classic · "}[post.design] || "")}${post.published ? "Published" : "Draft"}</span>
      </button>`
    ).join("");
    target.querySelectorAll("[data-slug]").forEach(button => {
      button.addEventListener("click", () => editPost(button.dataset.slug));
    });
  }

  function clearEditor() {
    $("post-editor").reset();
    $("post-original-slug").value = "";
    $("post-date").value = localDate();
    $("post-published").checked = true;
    $("post-design").value = "default";
    $("post-cover-image").value = "";
    $("post-cover-file").value = "";
    $("post-cover-upload-message").textContent = "";
    $("delete-post-button").hidden = true;
    $("save-post-button").textContent = "Save publication";
    message("");
  }

  function editPost(slug) {
    const post = posts.find(item => item.slug === slug);
    if (!post) return;
    $("post-original-slug").value = post.slug;
    $("post-title").value = post.title || "";
    $("post-slug").value = post.slug || "";
    $("post-date").value = post.date || "";
    $("post-excerpt").value = post.excerpt || "";
    $("post-cover-image").value = post.coverImage || "";
    $("post-cover-file").value = "";
    $("post-cover-upload-message").textContent = "";
    $("post-content").value = post.content || "";
    $("post-design").value = ["default","ios-6","android-market-2012","dark-2010s","aero","cydia-classic"].includes(post.design) ? post.design : "default";
    $("post-published").checked = post.published !== false;
    $("delete-post-button").hidden = false;
    $("save-post-button").textContent = "Update publication";
    message("");
    if (window.matchMedia("(max-width: 760px)").matches) $("post-editor").scrollIntoView({behavior:"smooth"});
  }

  async function loadPosts() {
    message("Loading publications…");
    const data = await api("/api/posts");
    posts = Array.isArray(data.posts) ? data.posts : [];
    renderPosts();
    message("Publications loaded.");
  }

  async function boot() {
    if (!apiBase) {
      $("admin-setup-detail").textContent = "Missing API URL. Deploy admin-worker/worker.js, then set apiBase in assets/js/admin-config.js.";
      show(setup, true); show(login, false); show(app, false);
      return;
    }
    show(setup, false);
    if (!session) {
      if (new URLSearchParams(location.search).get("login") === "1") {
        loginMessage(""); show(login, true); show(app, false); return;
      }
      location.replace(siteBase + "404.html");
      return;
    }
    let identity;
    try {
      identity = await api("/api/session");
    } catch (error) {
      sessionStorage.removeItem(sessionKey);
      session = "";
      if (new URLSearchParams(location.search).get("login") === "1") {
        show(login, true); show(app, false);
        loginMessage(error.message);
      } else {
        location.replace(siteBase + "404.html");
      }
      return;
    }
    loginMessage("");
    show(login, false); show(app, true);
    $("admin-user").textContent = `Signed in as @${identity.login}`;
    try {
      await loadPosts();
    } catch (error) {
      message("Could not load blog posts: " + error.message, true);
    }
    try {
      await loadMaintenanceSettings();
    } catch (error) {
      maintenanceMessage("Could not load maintenance settings: " + error.message, true);
    }
  }

  const fragment = new URLSearchParams(location.hash.slice(1));
  const receivedSession = fragment.get("session");
  if (receivedSession) {
    session = receivedSession;
    sessionStorage.setItem(sessionKey, session);
    history.replaceState(null, "", location.pathname + location.search);
  }

  $("login-button").addEventListener("click", () => {
    loginMessage("");
    if (!apiBase) return;
    location.href = apiBase + "/auth/login";
  });

  $("logout-button").addEventListener("click", async () => {
    try { await api("/api/logout", { method: "POST" }); } catch (_) {}
    sessionStorage.removeItem(sessionKey);
    session = "";
    show(app, false); show(login, true);
  });

  $("new-post-button").addEventListener("click", clearEditor);
  $("cancel-edit-button").addEventListener("click", clearEditor);
  $("post-title").addEventListener("input", () => {
    if (!$("post-original-slug").value) $("post-slug").value = slugify($("post-title").value);
  });

  $("post-editor").addEventListener("submit", async (event) => {
    event.preventDefault();
    const post = {
      slug: $("post-slug").value.trim(),
      title: $("post-title").value.trim(),
      date: $("post-date").value,
      excerpt: $("post-excerpt").value.trim(),
      coverImage: $("post-cover-image").value.trim(),
      content: $("post-content").value.trim(),
      design: $("post-design").value,
      published: $("post-published").checked
    };
    try {
      $("save-post-button").disabled = true;
      message("Saving to GitHub…");
      const originalSlug = $("post-original-slug").value.trim();
      const data = await api("/api/posts", { method: "POST", body: JSON.stringify({ action:"save", originalSlug, post }) });
      posts = data.posts;
      renderPosts();
      $("post-original-slug").value = post.slug;
      $("delete-post-button").hidden = false;
      $("save-post-button").textContent = "Update publication";
      message("Saved and committed to GitHub.");
    } catch (error) { message(error.message, true); }
    finally { $("save-post-button").disabled = false; }
  });


  $("upload-post-cover").addEventListener("click", async () => {
    const fileInput = $("post-cover-file");
    const file = fileInput.files && fileInput.files[0];
    if (!file) { $("post-cover-upload-message").textContent = "Choose an image first."; return; }
    if (!/^image\/(jpeg|png|webp|gif)$/i.test(file.type)) { $("post-cover-upload-message").textContent = "Use a JPG, PNG, WebP or GIF image."; return; }
    if (file.size > 8 * 1024 * 1024) { $("post-cover-upload-message").textContent = "The image is larger than the 8 MB limit."; return; }
    const slug = $("post-slug").value.trim() || slugify($("post-title").value);
    if (!slug) { $("post-cover-upload-message").textContent = "Enter the post title first."; return; }
    const button = $("upload-post-cover");
    button.disabled = true;
    $("post-cover-upload-message").textContent = "Preparing a secure image upload…";
    try {
      const access = await api("/api/upload-token");
      const extensionByMime = {"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif"};
      const extension = extensionByMime[file.type.toLowerCase()];
      if (!extension) throw new Error("The selected file type is not supported.");
      const safeName = "cover-" + Date.now() + "." + extension;
      const filePath = "assets/images/blog/" + slug + "/" + safeName;
      const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");
      const apiUrl = "https://api.github.com/repos/" + encodeURIComponent(access.owner) + "/" + encodeURIComponent(access.repo) + "/contents/" + encodedPath;
      const authHeaders = {Authorization:"Bearer " + access.token, Accept:"application/vnd.github+json", "X-GitHub-Api-Version":"2022-11-28"};
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (let offset = 0; offset < bytes.length; offset += 0x4000) binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 0x4000, bytes.length)));
      const response = await fetch(apiUrl, {method:"PUT",headers:{...authHeaders,"Content-Type":"application/json"},body:JSON.stringify({message:"Upload blog cover image: "+safeName,content:btoa(binary),branch:"main"})});
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "GitHub rejected the upload (" + response.status + ").");
      $("post-cover-image").value = location.origin + siteBase + encodedPath;
      $("post-cover-upload-message").textContent = "Image uploaded. Save the publication to apply the cover.";
    } catch (error) {
      $("post-cover-upload-message").textContent = "Upload failed: " + error.message;
    } finally { button.disabled = false; }
  });

  function insertPostMarkdown(prefix, suffix, placeholder) {
    const field = $("post-content");
    const start = field.selectionStart, end = field.selectionEnd;
    const selected = field.value.slice(start, end) || placeholder;
    field.setRangeText(prefix + selected + suffix, start, end, "select");
    field.focus();
  }
  $("insert-post-link").addEventListener("click", () => {
    const url = prompt("Paste the HTTPS link URL:");
    if (!url) return;
    if (!/^https:\/\//i.test(url) && !/^\/backupsite\//.test(url)) {
      $("post-cover-upload-message").textContent = "Use an HTTPS link or a link inside this website.";
      return;
    }
    const label = $("post-content").value.slice($("post-content").selectionStart, $("post-content").selectionEnd) || "link text";
    insertPostMarkdown("[", "](" + url.trim() + ")", label);
  });
  $("insert-post-image").addEventListener("click", () => {
    const url = prompt("Paste the HTTPS image URL:");
    if (!url) return;
    if (!/^https:\/\//i.test(url) && !/^\/backupsite\/assets\/images\//.test(url)) {
      $("post-cover-upload-message").textContent = "Use an HTTPS image URL or an image uploaded to this website.";
      return;
    }
    const alt = $("post-content").value.slice($("post-content").selectionStart, $("post-content").selectionEnd) || "Image description";
    insertPostMarkdown("![", "](" + url.trim() + ")", alt);
  });

  $("delete-post-button").addEventListener("click", async () => {
    const slug = $("post-original-slug").value;
    if (!slug || !confirm("Delete this publication? This change will be committed to GitHub.")) return;
    try {
      $("delete-post-button").disabled = true;
      message("Deleting from GitHub…");
      const data = await api("/api/posts", { method:"POST", body:JSON.stringify({action:"delete", slug}) });
      posts = data.posts;
      renderPosts();
      clearEditor();
      message("Publication deleted.");
    } catch (error) { message(error.message, true); }
    finally { $("delete-post-button").disabled = false; }
  });


  let downloads = [];
  const downloadMessage = (text, isError = false) => {
    const target = $("download-message");
    if (!target) return;
    target.textContent = text;
    target.className = isError ? "admin-message error" : "admin-message";
  };
  function renderDownloads() {
    const target = $("admin-download-list");
    if (!target) return;
    if (!downloads.length) { target.innerHTML = '<p class="post-empty">No downloads yet. Add the first one.</p>'; return; }
    target.innerHTML = downloads.slice().sort((a,b) => String(a.title).localeCompare(String(b.title))).map(item =>
      `<button class="admin-post-row" type="button" data-download-slug="${escapeHtml(item.slug)}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.platform)} · ${item.published ? "Published" : "Draft"}</span></button>`
    ).join("");
    target.querySelectorAll("[data-download-slug]").forEach(button => button.addEventListener("click", () => editDownload(button.dataset.downloadSlug)));
  }
  function clearDownloadEditor() {
    $("download-editor").reset();
    $("download-original-slug").value = "";
    $("download-published").checked = true;
    $("delete-download-button").hidden = true;
    $("save-download-button").textContent = "Save download";
    downloadMessage("");
  }
  function editDownload(slug) {
    const item = downloads.find(entry => entry.slug === slug);
    if (!item) return;
    $("download-original-slug").value = item.slug;
    $("download-title").value = item.title || "";
    $("download-slug").value = item.slug || "";
    $("download-platform").value = item.platform || "iOS";
    $("download-description").value = item.description || "";
    $("download-compatibility").value = item.compatibility || "";
    $("download-version").value = item.version || "";
    $("download-size").value = item.fileSize || "";
    $("download-type").value = item.fileType || "";
    $("download-url").value = item.url || "";
    $("download-notes").value = item.notes || "";
    $("download-published").checked = item.published === true;
    $("delete-download-button").hidden = false;
    $("save-download-button").textContent = "Update download";
    downloadMessage("");
    if (window.matchMedia("(max-width: 760px)").matches) $("download-editor").scrollIntoView({behavior:"smooth"});
  }
  async function loadDownloads() {
    const data = await api("/api/downloads");
    downloads = Array.isArray(data.downloads) ? data.downloads : [];
    renderDownloads();
  }

  $("upload-download-file").addEventListener("click", async () => {
    const fileInput = $("download-file");
    const file = fileInput.files && fileInput.files[0];
    if (!file) { $("download-upload-message").textContent = "Choose a file first."; return; }
    if (file.size > 100 * 1024 * 1024) { $("download-upload-message").textContent = "This file is larger than the 100 MB limit."; return; }
    const slug = $("download-slug").value.trim() || slugify($("download-title").value);
    if (!slug) { $("download-upload-message").textContent = "Enter the application name first."; return; }
    $("download-upload-message").textContent = "Preparing a secure GitHub upload…";
    $("upload-download-file").disabled = true;
    try {
      const access = await api("/api/upload-token");
      const originalName = String(file.name || "download.bin").split(/[\\\\/]/).pop();
      const safeName = originalName.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,120) || "download.bin";
      const filePath = "downloads/files/" + slug + "/" + safeName;
      const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");
      const apiUrl = "https://api.github.com/repos/" + encodeURIComponent(access.owner) + "/" + encodeURIComponent(access.repo) + "/contents/" + encodedPath;
      const authHeaders = {Authorization:"Bearer " + access.token, Accept:"application/vnd.github+json", "X-GitHub-Api-Version":"2022-11-28"};
      let existingSha = "";
      const existingResponse = await fetch(apiUrl + "?ref=main", {headers:authHeaders});
      if (existingResponse.ok) {
        const existing = await existingResponse.json();
        existingSha = existing.sha || "";
      } else if (existingResponse.status !== 404) {
        const detail = await existingResponse.json().catch(() => ({}));
        throw new Error(detail.message || "Could not check the destination file (" + existingResponse.status + ").");
      }
      $("download-upload-message").textContent = "Encoding file in your browser…";
      const bytes = new Uint8Array(await file.arrayBuffer());
      const parts = [];
      const chunkSize = 0x6000;
      for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        const chunk = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
        let binary = "";
        for (let i = 0; i < chunk.length; i += 0x4000) {
          binary += String.fromCharCode(...chunk.subarray(i, Math.min(i + 0x4000, chunk.length)));
        }
        parts.push(btoa(binary));
      }
      const base64 = parts.join("");
      const message = "Upload download file: " + safeName;
      const payload = JSON.stringify({
        message,
        content: base64,
        branch: "main",
        ...(existingSha ? {sha:existingSha} : {})
      });
      $("download-upload-message").textContent = "Sending file directly to GitHub…";
      const response = await fetch(apiUrl, {method:"PUT", headers:{...authHeaders, "Content-Type":"application/json"}, body:payload});
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "GitHub rejected the upload (" + response.status + ").");
      const publicUrl = location.origin + siteBase + filePath.split("/").map(encodeURIComponent).join("/");
      $("download-url").value = publicUrl;
      $("download-size").value = (file.size / (1024 * 1024)).toFixed(1) + " MB";
      $("download-type").value = safeName.includes(".") ? safeName.split(".").pop().toUpperCase() : "FILE";
      $("download-upload-message").textContent = "Upload complete. The file is committed in the repository and the download URL is ready.";
    } catch (error) {
      const detail = error instanceof TypeError ? "The browser could not reach GitHub. Check the connection and retry; the file was not marked as uploaded." : error.message;
      $("download-upload-message").textContent = "Upload failed: " + detail;
    } finally { $("upload-download-file").disabled = false; }
  });

  $("download-editor").addEventListener("submit", async event => {
    event.preventDefault();
    const item = {
      title: $("download-title").value.trim(),
      slug: $("download-slug").value.trim(),
      platform: $("download-platform").value,
      description: $("download-description").value.trim(),
      compatibility: $("download-compatibility").value.trim(),
      version: $("download-version").value.trim(),
      fileSize: $("download-size").value.trim(),
      fileType: $("download-type").value.trim(),
      url: $("download-url").value.trim(),
      notes: $("download-notes").value.trim(),
      published: $("download-published").checked
    };
    const originalSlug = $("download-original-slug").value.trim();
    if (!item.title) { downloadMessage("Enter the application name.", true); $("download-title").focus(); return; }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)) { downloadMessage("Enter a valid URL slug using lowercase letters, numbers and hyphens.", true); $("download-slug").focus(); return; }
    if (!item.description) { downloadMessage("Add a short description before saving.", true); $("download-description").focus(); return; }
    if (!/^https:\/\//i.test(item.url)) { downloadMessage("Add an HTTPS download URL. Upload the file first or paste a secure link.", true); $("download-url").focus(); return; }
    if (item.title.length > 120 || item.description.length > 500 || item.compatibility.length > 240 || item.version.length > 40 || item.fileSize.length > 40 || item.fileType.length > 40 || item.url.length > 2000 || item.notes.length > 1000) {
      downloadMessage("One or more fields exceed their allowed length. Shorten the highlighted information and try again.", true); return;
    }
    try {
      $("save-download-button").disabled = true;
      downloadMessage("Saving to GitHub…");
      const data = await api("/api/downloads", {
        method: "POST",
        body: JSON.stringify({action:"save", originalSlug, download:item})
      });
      downloads = data.downloads;
      renderDownloads();
      $("download-original-slug").value = item.slug;
      $("delete-download-button").hidden = false;
      $("save-download-button").textContent = "Update download";
      $("admin-download-list").dataset.loaded = "1";
      downloadMessage("Saved and committed to GitHub.");
    } catch (error) {
      downloadMessage(error.message, true);
    } finally {
      $("save-download-button").disabled = false;
    }
  });

  $("delete-download-button").addEventListener("click", async () => {
    const slug = $("download-original-slug").value.trim();
    if (!slug || !confirm("Delete this download entry? The uploaded file in the repository will not be deleted.")) return;
    try {
      $("delete-download-button").disabled = true;
      downloadMessage("Deleting from GitHub…");
      const data = await api("/api/downloads", {
        method: "POST",
        body: JSON.stringify({action:"delete", slug})
      });
      downloads = data.downloads;
      renderDownloads();
      clearDownloadEditor();
      $("admin-download-list").dataset.loaded = "1";
      downloadMessage("Download entry deleted.");
    } catch (error) {
      downloadMessage(error.message, true);
    } finally {
      $("delete-download-button").disabled = false;
    }
  });

  $("download-title").addEventListener("input", () => {
    if (!$("download-original-slug").value) $("download-slug").value = slugify($("download-title").value);
  });
  $("download-slug").addEventListener("blur", () => {
    const value = $("download-slug").value.trim();
    if (value) $("download-slug").value = slugify(value);
  });
  $("clear-download-button").addEventListener("click", clearDownloadEditor);

  const formattingGuide = "Formatting: # Heading · ## Subheading · **bold** · *italic* · ***bold italic*** · - list item · [link text](https://...) · ![image description](https://...)";
  ["download-description", "download-notes", "update-summary", "update-details"].forEach(id => {
    const field = $(id);
    if (field && !field.parentElement.querySelector(".formatting-help")) {
      const hint = document.createElement("p");
      hint.className = "formatting-help";
      hint.textContent = formattingGuide;
      field.insertAdjacentElement("afterend", hint);
    }
  });

  let updates = [];
  const updateMessage = (text, isError = false) => {
    const target = $("update-message");
    if (!target) return;
    target.textContent = text;
    target.className = isError ? "admin-message error" : "admin-message";
  };
  function renderUpdates() {
    const target = $("admin-update-list");
    if (!target) return;
    if (!updates.length) { target.innerHTML = '<p class="post-empty">No updates yet. Create the first one.</p>'; return; }
    target.innerHTML = updates.slice().sort((a,b) => (String(b.date)+String(b.time)).localeCompare(String(a.date)+String(a.time))).map(item =>
      `<button class="admin-post-row" type="button" data-update-id="${escapeHtml(item.id)}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.date)} · ${escapeHtml(item.category)} · ${item.published ? "Published" : "Draft"}</span></button>`
    ).join("");
    target.querySelectorAll("[data-update-id]").forEach(button => button.addEventListener("click", () => editUpdate(button.dataset.updateId)));
  }
  function clearUpdateEditor() {
    $("update-editor").reset();
    $("update-original-id").value = "";
    $("update-date").value = localDate();
    $("update-time").value = new Date().toTimeString().slice(0,5);
    $("update-published").checked = true;
    $("delete-update-button").hidden = true;
    $("save-update-button").textContent = "Save update";
    updateMessage("");
  }
  function editUpdate(id) {
    const item = updates.find(entry => entry.id === id);
    if (!item) return;
    $("update-original-id").value = item.id;
    $("update-title").value = item.title || "";
    $("update-date").value = item.date || "";
    $("update-time").value = item.time || "12:00";
    $("update-category").value = item.category || "Website";
    $("update-type").value = item.type || "Improvement";
    $("update-summary").value = item.summary || "";
    $("update-details").value = item.details || "";
    $("update-published").checked = item.published === true;
    $("delete-update-button").hidden = false;
    $("save-update-button").textContent = "Update entry";
    updateMessage("");
    if (window.matchMedia("(max-width: 760px)").matches) $("update-editor").scrollIntoView({behavior:"smooth"});
  }
  async function loadUpdates() {
    const data = await api("/api/whats-new");
    updates = Array.isArray(data.updates) ? data.updates : [];
    renderUpdates();
  }
  function showAdminSection(section) {
    ["posts","downloads","whats-new","maintenance","maintenance-reports"].forEach(name => {
      show($("admin-" + name + "-section"), name === section);
      const button = $("show-" + name + "-tab");
      if (button) button.classList.toggle("btn-primary", name === section);
    });
    if (section === "downloads" && !$("admin-download-list").dataset.loaded) {
      loadDownloads().then(() => $("admin-download-list").dataset.loaded = "1").catch(error => downloadMessage(error.message, true));
    }
    if (section === "whats-new" && !$("admin-update-list").dataset.loaded) {
      loadUpdates().then(() => $("admin-update-list").dataset.loaded = "1").catch(error => updateMessage(error.message, true));
    }
    if (section === "maintenance-reports" && !$("maintenance-report-list").dataset.loaded) {
      loadMaintenanceReports().then(() => $("maintenance-report-list").dataset.loaded = "1").catch(error => maintenanceReportMessage(error.message, true));
    }
  }

  let maintenanceReports = [];
  const maintenanceReportMessage = (text, isError = false) => {
    const target = $("maintenance-report-message");
    if (!target) return;
    target.textContent = text;
    target.className = isError ? "admin-message error" : "admin-message";
  };
  function renderMaintenanceReports() {
    const target = $("maintenance-report-list");
    if (!target) return;
    const sorted = maintenanceReports.slice().sort((a,b) => String(b.date).localeCompare(String(a.date)) || String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    $("maintenance-report-count").textContent = sorted.length + (sorted.length === 1 ? " saved report" : " saved reports");
    if (!sorted.length) {
      target.innerHTML = '<p class="post-empty">No maintenance reports have been recorded yet.</p>';
      return;
    }
    target.innerHTML = sorted.map(report => {
      const severity = String(report.severity || "Informational");
      const safeSeverity = ["Critical","High","Medium","Low","Informational"].includes(severity) ? severity : "Informational";
      return '<article class="maintenance-report-card">' +
        '<div class="maintenance-report-card-head"><div><p class="admin-eyebrow">' + escapeHtml(report.date) + '</p><h4>' + escapeHtml(report.title) + '</h4></div><span class="maintenance-severity severity-' + safeSeverity.toLowerCase() + '">' + safeSeverity + '</span></div>' +
        '<p class="maintenance-report-summary">' + escapeHtml(report.summary) + '</p>' +
        '<details><summary>View full report</summary>' +
        '<h5>Scope checked</h5><p>' + escapeHtml(report.scope || "Not recorded").replace(/\n/g,"<br>") + '</p>' +
        '<h5>Findings</h5><p>' + escapeHtml(report.findings || "None recorded").replace(/\n/g,"<br>") + '</p>' +
        '<h5>Corrections / actions</h5><p>' + escapeHtml(report.actions || "None recorded").replace(/\n/g,"<br>") + '</p>' +
        '<h5>Verification and deployment</h5><p>' + escapeHtml(report.verification || "Not recorded").replace(/\n/g,"<br>") + '</p>' +
        '<h5>Benefits</h5><p>' + escapeHtml(report.benefits || "Not recorded").replace(/\n/g,"<br>") + '</p></details></article>';
    }).join("");
  }
  async function loadMaintenanceReports() {
    maintenanceReportMessage("Loading private report history…");
    const data = await api("/api/maintenance-reports");
    maintenanceReports = Array.isArray(data.reports) ? data.reports : [];
    renderMaintenanceReports();
    maintenanceReportMessage("Private maintenance history loaded.");
  }
  $("report-date").value = localDate();
  $("maintenance-report-editor").addEventListener("submit", async event => {
    event.preventDefault();
    const report = {
      title: $("report-title").value.trim(),
      date: $("report-date").value,
      severity: $("report-severity").value,
      scope: $("report-scope").value.trim(),
      findings: $("report-findings").value.trim(),
      actions: $("report-actions").value.trim(),
      verification: $("report-verification").value.trim(),
      benefits: $("report-benefits").value.trim(),
      summary: $("report-summary").value.trim()
    };
    try {
      $("save-maintenance-report-button").disabled = true;
      maintenanceReportMessage("Saving report to the private administrative store…");
      const data = await api("/api/maintenance-reports", {method:"POST", body:JSON.stringify({action:"save", report})});
      maintenanceReports = Array.isArray(data.reports) ? data.reports : [];
      renderMaintenanceReports();
      $("maintenance-report-editor").reset();
      $("report-date").value = localDate();
      maintenanceReportMessage("Report saved. It is visible only through an authenticated admin session.");
    } catch (error) {
      maintenanceReportMessage("Could not save report: " + error.message, true);
    } finally {
      $("save-maintenance-report-button").disabled = false;
    }
  });

  let maintenanceSettings = {enabled:false, eta:"", reason:""};
  const maintenanceMessage = (text, isError = false) => {
    const target = $("maintenance-message");
    if (!target) return;
    target.textContent = text;
    target.className = isError ? "admin-message error" : "admin-message";
  };
  function renderMaintenancePreview() {
    $("maintenance-preview-eta").textContent = maintenanceSettings.eta || "Not specified";
    $("maintenance-preview-reason").textContent = maintenanceSettings.reason || "Not specified";
  }
  async function loadMaintenanceSettings() {
    const response = await fetch("../assets/data/maintenance.json?ts=" + Date.now(), {cache:"no-store"});
    if (!response.ok) throw new Error("Could not read maintenance.json (" + response.status + ").");
    maintenanceSettings = await response.json();
    $("maintenance-enabled").checked = maintenanceSettings.enabled === true;
    $("maintenance-eta").value = maintenanceSettings.eta || "";
    $("maintenance-reason").value = maintenanceSettings.reason || "";
    renderMaintenancePreview();
    maintenanceMessage("Settings loaded.");
  }
  $("maintenance-eta").addEventListener("input", () => {
    maintenanceSettings.eta = $("maintenance-eta").value.trim();
    renderMaintenancePreview();
  });
  $("maintenance-reason").addEventListener("input", () => {
    maintenanceSettings.reason = $("maintenance-reason").value.trim();
    renderMaintenancePreview();
  });
  $("maintenance-enabled").addEventListener("change", () => {
    maintenanceSettings.enabled = $("maintenance-enabled").checked;
  });
  $("maintenance-editor").addEventListener("submit", async event => {
    event.preventDefault();
    const settings = {
      enabled: $("maintenance-enabled").checked,
      eta: $("maintenance-eta").value.trim(),
      reason: $("maintenance-reason").value.trim()
    };
    try {
      $("save-maintenance-button").disabled = true;
      maintenanceMessage("Saving settings to GitHub…");
      const access = await api("/api/upload-token");
      const filePath = "assets/data/maintenance.json";
      const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");
      const apiUrl = "https://api.github.com/repos/" + encodeURIComponent(access.owner) + "/" + encodeURIComponent(access.repo) + "/contents/" + encodedPath;
      const headers = {Authorization:"Bearer " + access.token, Accept:"application/vnd.github+json", "X-GitHub-Api-Version":"2022-11-28"};
      const currentResponse = await fetch(apiUrl + "?ref=main", {headers});
      if (!currentResponse.ok) throw new Error("Could not read the current settings (" + currentResponse.status + ").");
      const current = await currentResponse.json();
      const bytes = new TextEncoder().encode(JSON.stringify(settings, null, 2) + "\n");
      let binary = "";
      bytes.forEach(byte => binary += String.fromCharCode(byte));
      const response = await fetch(apiUrl, {method:"PUT",headers:{...headers,"Content-Type":"application/json"},body:JSON.stringify({
        message:"Update website maintenance settings",content:btoa(binary),branch:"main",sha:current.sha
      })});
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "GitHub rejected the settings (" + response.status + ").");
      maintenanceSettings = settings;
      renderMaintenancePreview();
      maintenanceMessage("Settings saved and committed. The public site will update after GitHub Pages deploys.");
    } catch (error) {
      maintenanceMessage("Save failed: " + error.message, true);
    } finally {
      $("save-maintenance-button").disabled = false;
    }
  });

  $("show-posts-tab").addEventListener("click", () => showAdminSection("posts"));
  $("show-downloads-tab").addEventListener("click", () => showAdminSection("downloads"));
  $("show-whats-new-tab").addEventListener("click", () => showAdminSection("whats-new"));
  $("show-maintenance-tab").addEventListener("click", () => showAdminSection("maintenance"));
  $("show-maintenance-reports-tab").addEventListener("click", () => showAdminSection("maintenance-reports"));
  $("new-update-button").addEventListener("click", clearUpdateEditor);
  $("clear-update-button").addEventListener("click", clearUpdateEditor);
  $("update-editor").addEventListener("submit", async event => {
    event.preventDefault();
    const item = {
      id: $("update-original-id").value || (crypto.randomUUID ? crypto.randomUUID() : "update-" + Date.now()),
      title: $("update-title").value.trim(), date: $("update-date").value, time: $("update-time").value,
      category: $("update-category").value, type: $("update-type").value,
      summary: $("update-summary").value.trim(), details: $("update-details").value.trim(),
      published: $("update-published").checked
    };
    try {
      $("save-update-button").disabled = true; updateMessage("Saving to GitHub…");
      const data = await api("/api/whats-new", {method:"POST",body:JSON.stringify({action:"save",update:item})});
      updates = data.updates; renderUpdates();
      $("update-original-id").value = item.id;
      $("delete-update-button").hidden = false; $("save-update-button").textContent = "Update entry";
      $("admin-update-list").dataset.loaded = "1";
      updateMessage("Saved and committed to GitHub.");
    } catch (error) { updateMessage(error.message, true); }
    finally { $("save-update-button").disabled = false; }
  });
  $("delete-update-button").addEventListener("click", async () => {
    const id = $("update-original-id").value;
    if (!id || !confirm("Delete this update? This change will be committed to GitHub.")) return;
    try {
      $("delete-update-button").disabled = true; updateMessage("Deleting from GitHub…");
      const data = await api("/api/whats-new", {method:"POST",body:JSON.stringify({action:"delete",id})});
      updates = data.updates; renderUpdates(); clearUpdateEditor();
      updateMessage("Update deleted.");
    } catch (error) { updateMessage(error.message, true); }
    finally { $("delete-update-button").disabled = false; }
  });

  boot();
})();
