# TBRLucas

A personal archive and technology website focused on classic mobile devices, software, computing history, projects, and practical guides.

**Website:** https://tbrlucas.github.io/

---

## About the project

TBRLucas brings together articles, downloads, experiments, and documentation related to older technology. The site is designed as a lightweight, mostly static website, with a visual style inspired by classic web design.

## What's on the website

- **Home** — featured content and highlights from the archive.
- **Blog** — articles about operating systems, mobile software, and computing history.
- **Downloads** — a catalog of software and files, with descriptions and compatibility information.
- **Projects** — experiments, ongoing work, and technical projects.
- **What's New** — updates and additions to the website.
- **About** — information about the project.

## Technology

- HTML, CSS, and JavaScript
- Bootstrap 2.3.2
- JSON files for structured website content
- GitHub Pages for static hosting
- Cloudflare Workers for the administration API

The frontend styles are organized in the site's assets directory.

## Repository overview

```text
/
├── about/              About page
├── assets/
│   ├── css/            Stylesheets
│   ├── data/           Structured website content
│   ├── images/         Images and visual assets
│   └── js/             Frontend scripts
├── blog/               Blog pages
├── downloads/          Download catalog and hosted files
├── projects/           Project pages
├── whats-new/          Website update pages
├── index.html          Homepage
├── 404.html            Custom not-found page
├── robots.txt          Search engine crawling rules
└── sitemap.xml         Sitemap
```

## Website content

Some sections use JSON files to keep content separate from page markup.

| File | Purpose |
| --- | --- |
| `assets/data/posts.json` | Blog posts |
| `assets/data/downloads.json` | Download catalog |
| `assets/data/whats-new.json` | Website updates |

Content entries generally include a title, URL slug, description, and publication status. Entries marked as unpublished are intended to remain out of the public-facing listings.



## Security

- Never commit OAuth client secrets, GitHub App private keys, access tokens, or local secret files such as `.dev.vars`.
- Store production credentials using the hosting platform's secret-management features.
- Keep GitHub App access limited to this repository and grant only the permissions the integration needs.
- Restrict administrative access to explicitly authorized accounts.
- Treat an undisclosed URL as an additional privacy measure, never as a replacement for authentication or authorization.
- If you discover a security issue, avoid publishing credentials or sensitive details in an issue report.

## Deployment

The public website is hosted with **GitHub Pages**, using the `main` branch and the repository root as the publishing source.

Changes pushed to the publishing branch are picked up by the GitHub Pages deployment workflow. The administration API is deployed separately through Cloudflare, so changes to that service may require a separate deployment.

## Content and software rights

Names, trademarks, applications, and other materials remain the property of their respective owners. Their inclusion in the site's articles or catalog does not imply endorsement or ownership by TBRLucas. Please respect the applicable licenses and rights when using or redistributing software.

---

*TBRLucas — preserving and exploring technology, one version at a time.*
