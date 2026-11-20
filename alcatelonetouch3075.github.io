<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>html{visibility:hidden}</style>
<script>
(function () {
  var params = new URLSearchParams(location.search);
  var hasOAuthSession = new URLSearchParams(location.hash.slice(1)).has("session");
  var hasStoredSession = false;
  try { hasStoredSession = !!sessionStorage.getItem("tbrlucas_admin_session"); } catch (_) {}
  if (params.get("login") === "1" || hasOAuthSession || hasStoredSession) {
    document.documentElement.style.visibility = "visible";
  } else {
    location.replace("../../404.html");
  }
})();
</script>
<meta name="theme-color" content="#4f7fbf">
<meta name="referrer" content="no-referrer">
<link rel="icon" type="image/svg+xml" href="../assets/images/favicon.svg?v=20261118-rebuilt-v2">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/2.3.2/css/bootstrap.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/2.3.2/css/bootstrap-responsive.min.css">
<link rel="stylesheet" href="../assets/css/style.css?v=20261118-media-links">
<title>Administration :: tbrlucas</title>
</head>
<body class="admin-page">
<a class="skip-link" href="#main-content">Skip to content</a>
<header class="site-header">
  <div class="navbar navbar-fixed-top"><div class="navbar-inner"><div class="container">
    <button type="button" class="btn btn-navbar" data-toggle="collapse" data-target=".nav-collapse" aria-label="Toggle navigation"><span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span></button>
    <a class="brand" href="../../">tbrlucas</a>
    <div class="nav-collapse collapse"><ul class="nav">
      <li><a href="../../">View website</a></li><li class="active"><a href="./">Administration</a></li>
    </ul></div>
  </div></div></div>
</header>

<main class="container page admin-page-main" id="main-content">
  <section class="admin-page-heading">
    <div><p class="admin-eyebrow">TBRLUCAS / CONTROL PANEL</p><h1>Administration</h1><p>Manage the content published on your website.</p></div>
    <a class="btn" href="../../" target="_blank" rel="noopener">View website ↗</a>
  </section>

  <div id="admin-setup" class="admin-state-panel" role="status">
    <div class="admin-state-icon" aria-hidden="true">⚙</div>
    <div><p class="admin-eyebrow">SETUP REQUIRED</p><h2>Connect the administration service</h2>
    <p>The control panel needs its Cloudflare Worker connection before sign-in can be enabled.</p>
    <p id="admin-setup-detail" class="admin-muted">Checking configuration…</p></div>
  </div>

  <section id="admin-login" class="admin-login-panel" hidden>
    <div class="admin-login-mark" aria-hidden="true">t</div>
    <p class="admin-eyebrow">PRIVATE AREA</p>
    <h2>Welcome back</h2>
    <p class="admin-intro">Sign in with the authorized GitHub account to manage website content.</p>
    <button class="btn btn-primary btn-large" id="login-button" type="button">Continue with GitHub <span aria-hidden="true">→</span></button>
    <p id="admin-login-message" class="admin-message error" role="alert" aria-live="polite"></p>
    <p class="admin-small">Authentication is handled by GitHub. This page never asks for or stores your GitHub password.</p>
  </section>

  <section id="admin-app" hidden>
    <div class="admin-workspace-head">
      <div><p class="admin-eyebrow">WORKSPACE</p><h2>Content manager</h2><p id="admin-user" class="admin-muted"></p></div>
      <button class="btn" id="logout-button" type="button">Sign out</button>
    </div>

    <nav class="admin-section-tabs" aria-label="Content sections">
      <button type="button" class="btn btn-primary" id="show-posts-tab">Blog posts</button>
      <button type="button" class="btn" id="show-downloads-tab">Downloads library</button>
      <button type="button" class="btn" id="show-whats-new-tab">What’s New</button>
      <button type="button" class="btn" id="show-maintenance-tab">Maintenance</button>
      <button type="button" class="btn" id="show-maintenance-reports-tab">Maintenance Report</button>
    </nav>

    <section id="admin-posts-section" class="admin-workspace">
      <div class="admin-section-heading">
        <div><p class="admin-eyebrow">BLOG</p><h3>Posts</h3><p>Write, edit and publish articles on your website.</p></div>
        <button class="btn btn-primary" id="new-post-button" type="button">＋ New post</button>
      </div>
      <div class="row-fluid admin-columns">
        <aside class="span4 admin-list-panel">
          <div class="admin-panel-heading"><strong>All posts</strong><span>Choose one to edit</span></div>
          <div id="admin-post-list" class="admin-post-list"><p class="post-empty">Loading publications…</p></div>
        </aside>
        <form id="post-editor" class="span8 admin-editor-panel">
          <div class="admin-panel-heading"><strong>Post editor</strong><span>Saved to GitHub</span></div>
          <input type="hidden" id="post-original-slug">
          <label for="post-title">Title</label><input class="input-block-level" id="post-title" type="text" maxlength="120" required placeholder="Post title">
          <div class="row-fluid">
            <div class="span7"><label for="post-slug">URL slug</label><input class="input-block-level" id="post-slug" type="text" maxlength="80" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="post-url"></div>
            <div class="span5"><label for="post-date">Publication date</label><input class="input-block-level" id="post-date" type="date" required></div>
          </div>
          <label for="post-excerpt">Short description</label><textarea class="input-block-level admin-textarea" id="post-excerpt" maxlength="240" rows="2" placeholder="A short summary for the post list"></textarea>
          <label for="post-design">Blog theme</label><select class="input-block-level" id="post-design" required><option value="default">Default theme (website CSS)</option><option value="ios-6">iOS 6</option><option value="android-market-2012">Android Market (2012)</option><option value="dark-2010s">Dark 2010s</option><option value="aero">Aero (Windows 7)</option><option value="cydia-classic">Cydia Classic (iOS 6)</option></select><p class="admin-small">The selected theme changes only this article page, not the rest of the website.</p>
          <label for="post-cover-image">Cover image URL</label><input class="input-block-level" id="post-cover-image" type="url" maxlength="2000" placeholder="Upload an image or paste an HTTPS image URL">
          <div class="admin-upload-box"><div class="admin-upload-controls"><input id="post-cover-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif"><button class="btn" id="upload-post-cover" type="button">Upload cover image</button></div><p class="admin-small">JPG, PNG, WebP or GIF · Maximum 8 MB. Uploaded images are stored in the website repository.</p><p id="post-cover-upload-message" class="admin-message" role="status" aria-live="polite"></p></div>
          <label for="post-content">Content</label><div class="admin-format-toolbar"><button class="btn btn-small" id="insert-post-link" type="button">Insert hyperlink</button><button class="btn btn-small" id="insert-post-image" type="button">Insert image</button><span>Markdown supported</span></div><textarea class="input-block-level admin-content" id="post-content" rows="12" maxlength="50000" required placeholder="Write your post here. Separate paragraphs with a blank line."></textarea><p class="admin-small">Formatting: # Heading · ## Subheading · **bold** · *italic* · ***bold italic*** · - list item · [link text](https://...) · ![image description](https://...)</p>
          <label class="admin-publish"><input id="post-published" type="checkbox" checked> Publish this post</label>
          <div class="admin-actions"><button class="btn btn-primary" id="save-post-button" type="submit">Save publication</button><button class="btn" id="cancel-edit-button" type="button">Clear editor</button><button class="btn btn-danger" id="delete-post-button" type="button" hidden>Delete post</button></div>
          <p id="admin-message" class="admin-message" role="status" aria-live="polite"></p>
        </form>
      </div>
    </section>


    <section id="admin-maintenance-section" class="admin-workspace" hidden>
      <div class="admin-section-heading">
        <div><p class="admin-eyebrow">SITE AVAILABILITY</p><h3>Maintenance mode</h3><p>Temporarily replace the public website with a maintenance notice.</p></div>
      </div>
      <form id="maintenance-editor" class="maintenance-admin-form">
        <label class="admin-publish maintenance-toggle"><input id="maintenance-enabled" type="checkbox"> Enable maintenance mode</label>
        <p class="admin-small">When enabled, visitors to the public pages will see the maintenance screen. The administration panel remains accessible.</p>
        <label for="maintenance-eta">Estimated time for the end of maintenance</label>
        <input class="input-block-level" id="maintenance-eta" type="text" maxlength="100" placeholder="e.g. Today at 6:00 PM (BRT)">
        <label for="maintenance-reason">Reason</label>
        <textarea class="input-block-level admin-textarea" id="maintenance-reason" rows="3" maxlength="300" placeholder="e.g. Scheduled website updates"></textarea>
        <div class="admin-actions"><button class="btn btn-primary" id="save-maintenance-button" type="submit">Save maintenance settings</button></div>
        <p id="maintenance-message" class="admin-message" role="status" aria-live="polite"></p>
      </form>
      <div class="maintenance-preview">
        <p class="admin-eyebrow">VISITOR MESSAGE PREVIEW</p>
        <strong>Hello! I know you're interested in seeing the site, but you won't be able to... at least not right now. We're currently undergoing maintenance.</strong>
        <p><strong>Please come back soon!</strong></p>
        <p><strong>Estimated time for the end of maintenance:</strong> <span id="maintenance-preview-eta">Not specified</span></p>
        <p><strong>Reason:</strong> <span id="maintenance-preview-reason">Not specified</span></p>
      </div>
    </section>

    <section id="admin-maintenance-reports-section" class="admin-workspace" hidden>
      <div class="admin-section-heading">
        <div><p class="admin-eyebrow">PRIVATE ADMINISTRATIVE LOG</p><h3>Maintenance Report</h3><p>Internal history of completed maintenance and security reviews. These reports are not published on the public website.</p></div>
      </div>
      <div class="maintenance-report-intro"><strong id="maintenance-report-count">Loading report history…</strong><span>Newest reviews appear first.</span></div>
      <div id="maintenance-report-list" class="maintenance-report-list"><p class="post-empty">Loading maintenance reports…</p></div>
      <form id="maintenance-report-editor" class="admin-editor-panel maintenance-report-editor">
        <div class="admin-panel-heading"><strong>Add completed maintenance report</strong><span>Private admin history</span></div>
        <label for="report-title">Report title</label><input class="input-block-level" id="report-title" maxlength="140" required placeholder="e.g. TBRLucas maintenance review">
        <div class="row-fluid">
          <div class="span6"><label for="report-date">Review date</label><input class="input-block-level" id="report-date" type="date" required></div>
          <div class="span6"><label for="report-severity">Overall severity</label><select class="input-block-level" id="report-severity"><option>Informational</option><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></div>
        </div>
        <label for="report-scope">Scope checked</label><textarea class="input-block-level admin-textarea" id="report-scope" rows="3" maxlength="4000" required placeholder="Pages, routes, services and systems actually reviewed"></textarea>
        <label for="report-findings">Findings</label><textarea class="input-block-level admin-textarea" id="report-findings" rows="4" maxlength="8000" placeholder="Findings with severity, evidence and impact; write “None identified” when applicable"></textarea>
        <label for="report-actions">Corrections / actions</label><textarea class="input-block-level admin-textarea" id="report-actions" rows="4" maxlength="8000" placeholder="What was fixed, or explicitly state that no changes were needed"></textarea>
        <label for="report-verification">Verification and deployment</label><textarea class="input-block-level admin-textarea" id="report-verification" rows="3" maxlength="4000" required placeholder="What was verified and whether deployment was confirmed"></textarea>
        <label for="report-benefits">Benefits</label><textarea class="input-block-level admin-textarea" id="report-benefits" rows="2" maxlength="2000" placeholder="Resulting improvements"></textarea>
        <label for="report-summary">Overall summary</label><textarea class="input-block-level admin-textarea" id="report-summary" rows="3" maxlength="3000" required placeholder="Short maintenance outcome"></textarea>
        <div class="admin-actions"><button class="btn btn-primary" id="save-maintenance-report-button" type="submit">Save private report</button></div>
        <p id="maintenance-report-message" class="admin-message" role="status" aria-live="polite"></p>
      </form>
    </section>

    <section id="admin-whats-new-section" class="admin-workspace" hidden>
      <div class="admin-section-heading">
        <div><p class="admin-eyebrow">SITE UPDATES</p><h3>What’s New</h3><p>Publish release notes and changes visitors can follow.</p></div>
        <button class="btn btn-primary" id="new-update-button" type="button">＋ New update</button>
      </div>
      <div class="row-fluid admin-columns">
        <aside class="span4 admin-list-panel">
          <div class="admin-panel-heading"><strong>All updates</strong><span>Choose one to edit</span></div>
          <div id="admin-update-list" class="admin-post-list"><p class="post-empty">Open this section to load updates.</p></div>
        </aside>
        <form id="update-editor" class="span8 admin-editor-panel">
          <div class="admin-panel-heading"><strong>Update editor</strong><span>Saved to GitHub</span></div>
          <input type="hidden" id="update-original-id">
          <label for="update-title">Title</label><input class="input-block-level" id="update-title" maxlength="120" required placeholder="What changed?">
          <div class="row-fluid">
            <div class="span4"><label for="update-date">Date</label><input class="input-block-level" id="update-date" type="date" required></div>
            <div class="span3"><label for="update-time">Time</label><input class="input-block-level" id="update-time" type="time" required></div>
            <div class="span5"><label for="update-category">Category</label><select class="input-block-level" id="update-category"><option>Website</option><option>Blog</option><option>Projects</option><option>Downloads</option><option>Other</option></select></div>
          </div>
          <div class="row-fluid">
            <div class="span6"><label for="update-type">Update type</label><select class="input-block-level" id="update-type"><option>New feature</option><option>Improvement</option><option>Fix</option><option>Announcement</option></select></div>
            <div class="span6"><label class="admin-publish"><input id="update-published" type="checkbox" checked> Publish this update</label></div>
          </div>
          <label for="update-summary">Summary</label><textarea class="input-block-level admin-textarea" id="update-summary" maxlength="300" rows="3" required placeholder="A short explanation shown in the timeline"></textarea>
          <label for="update-details">Additional details (optional)</label><textarea class="input-block-level admin-content" id="update-details" maxlength="5000" rows="6" placeholder="More context, one point per line if useful"></textarea>
          <div class="admin-actions"><button class="btn btn-primary" id="save-update-button" type="submit">Save update</button><button class="btn" id="clear-update-button" type="button">Clear editor</button><button class="btn btn-danger" id="delete-update-button" type="button" hidden>Delete update</button></div>
          <p id="update-message" class="admin-message" role="status" aria-live="polite"></p>
        </form>
      </div>
    </section>

    <section id="admin-downloads-section" class="admin-workspace" hidden>
      <div class="admin-section-heading">
        <div><p class="admin-eyebrow">SOFTWARE LIBRARY</p><h3>Downloads</h3><p>Manage the apps and files displayed on the public downloads page.</p></div>
        <button class="btn btn-primary" id="new-download-button" type="button">＋ New download</button>
      </div>
      <div class="row-fluid admin-columns">
        <aside class="span4 admin-list-panel">
          <div class="admin-panel-heading"><strong>All downloads</strong><span>Choose one to edit</span></div>
          <div id="admin-download-list" class="admin-post-list"><p class="post-empty">Open this section to load downloads.</p></div>
        </aside>
        <form id="download-editor" class="span8 admin-editor-panel">
          <div class="admin-panel-heading"><strong>Download editor</strong><span>Saved to GitHub</span></div>
          <input type="hidden" id="download-original-slug">
          <label for="download-title">Application name</label><input class="input-block-level" id="download-title" maxlength="120" required placeholder="App name">
          <div class="row-fluid"><div class="span7"><label for="download-slug">URL slug</label><input class="input-block-level" id="download-slug" maxlength="80" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="app-name"></div><div class="span5"><label for="download-platform">Platform</label><select class="input-block-level" id="download-platform" required><option value="iOS">iOS</option><option value="Android">Android</option><option value="Other">Other</option></select></div></div>
          <label for="download-description">Description</label><textarea class="input-block-level admin-textarea" id="download-description" rows="2" maxlength="500" required placeholder="What does this app or file do?"></textarea>
          <label for="download-compatibility">Device / OS compatibility</label><input class="input-block-level" id="download-compatibility" maxlength="240" placeholder="e.g. iOS 6–9, iPhone 4 or newer">
          <div class="row-fluid"><div class="span4"><label for="download-version">Version</label><input class="input-block-level" id="download-version" maxlength="40"></div><div class="span4"><label for="download-size">File size</label><input class="input-block-level" id="download-size" maxlength="40" placeholder="e.g. 12 MB"></div><div class="span4"><label for="download-type">File type</label><input class="input-block-level" id="download-type" maxlength="40" placeholder="IPA, APK, ZIP…"></div></div>
          <div class="admin-upload-box">
            <label for="download-file">Upload file to GitHub</label>
            <div class="admin-upload-controls"><input id="download-file" type="file" accept=".ipa,.apk,.zip,.deb,.dylib,.exe,.msi,.7z,.tar,.gz,.pdf"><button class="btn" id="upload-download-file" type="button">Upload file</button></div>
            <p class="admin-small">Files are stored in this repository under <code>downloads/files/</code>. Maximum size: 100 MB.</p>
            <p id="download-upload-message" class="admin-message" role="status" aria-live="polite"></p>
          </div>
          <label for="download-url">Download URL (HTTPS)</label><input class="input-block-level" id="download-url" type="url" maxlength="2000" placeholder="Upload a file or paste an HTTPS link">
          <label for="download-notes">Additional notes</label><textarea class="input-block-level admin-textarea" id="download-notes" rows="2" maxlength="1000" placeholder="Optional notes for visitors"></textarea>
          <label class="admin-publish"><input id="download-published" type="checkbox" checked> Publish this download</label>
          <div class="admin-actions"><button class="btn btn-primary" id="save-download-button" type="submit">Save download</button><button class="btn" id="clear-download-button" type="button">Clear editor</button><button class="btn btn-danger" id="delete-download-button" type="button" hidden>Delete download</button></div>
          <p id="download-message" class="admin-message" role="status" aria-live="polite"></p>
        </form>
      </div>
    </section>
  </section>

  <footer class="site-footer admin-footer"><ul class="breadcrumb"><li><a href="../../">Home</a></li><li class="active">Administration</li></ul><p><strong>tbrlucas</strong> · Private content management</p></footer>
</main>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/2.3.2/js/bootstrap.min.js"></script>
<script src="../assets/js/admin-config.js?v=20261115-backup-auth" defer></script>
<script src="../assets/js/admin.js?v=20261120-upload-validation" defer></script>
</body>
</html>