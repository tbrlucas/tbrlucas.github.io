# tbrlucas content administration service

This folder contains the Cloudflare Worker API used by the static content panel at `/alcatelonetouch3075m/`.

## Architecture

- A GitHub App handles repository access. Install it on **only** `tbrlucas/tbrlucas.github.io`.
- GitHub App repository permission: **Contents — Read and write**. Do not grant administration, issues, pull requests, or access to other repositories.
- The GitHub App user-authorization flow identifies the administrator. The Worker checks the exact login in `ADMIN_GITHUB_LOGIN`.
- The Worker creates short-lived opaque browser sessions in Cloudflare KV.
- For repository operations, the Worker creates a short-lived installation token scoped to the single configured repository and Contents permission. The token stays inside the Worker and is never returned to the browser.
- Blog posts are stored in `assets/data/posts.json` on branch `main`.
- Download entries are stored in `assets/data/downloads.json` on branch `main`; uploaded files are committed under `downloads/files/` on branch `main`.

## Required setup

1. Create a Cloudflare Worker and a KV namespace. Bind the namespace as `AUTH_KV`.
2. Create a GitHub App (not an OAuth App). Enable user authorization and set its callback URL to the Worker URL plus `/auth/callback`.
3. In the GitHub App settings, set repository permissions to **Contents: Read and write**. Leave all other repository permissions at No access.
4. Install the GitHub App on the account that owns the site and select **Only select repositories** → `tbrlucas.github.io`.
5. Copy the GitHub App ID, client ID, installation ID, and private key. Keep the private key secret.
6. Set the Worker variables listed below and add the two secrets using Wrangler/Cloudflare secret storage.

## Worker variables

- `ADMIN_ORIGIN`: exact admin site origin, e.g. `https://tbrlucas.github.io` (no trailing slash).
- `ADMIN_GITHUB_LOGIN`: only allowed GitHub username.
- `REPO_OWNER`: `tbrlucas`.
- `REPO_NAME`: `tbrlucas.github.io`.
- `GITHUB_CALLBACK_URL`: exact Worker URL followed by `/auth/callback`.
- `GITHUB_APP_ID`: numeric GitHub App ID.
- `GITHUB_APP_INSTALLATION_ID`: installation ID for the installation that has access to this repository.
- `GITHUB_OAUTH_CLIENT_ID`: GitHub App client ID.

Encrypted Worker secrets (never put these in Git):

- `GITHUB_OAUTH_CLIENT_SECRET`: GitHub App client secret.
- `GITHUB_APP_PRIVATE_KEY`: PKCS#8 PEM private key. GitHub's downloaded RSA key may be PKCS#1 (`BEGIN RSA PRIVATE KEY`); convert it locally before storing it: `openssl pkcs8 -topk8 -nocrypt -in app.private-key.pem -out app.private-key.pkcs8.pem`. The resulting file should begin with `BEGIN PRIVATE KEY`. Store its full contents as the encrypted Worker secret.

The example `wrangler.toml.example` contains the non-secret variable template. Copy it to `wrangler.toml`, fill in the real IDs, and keep local secret files out of Git.

## Deploy and connect

1. Deploy the updated `worker.js` to Cloudflare before publishing the updated admin frontend; the frontend now calls the server-side upload and maintenance routes.
2. Bind KV as `AUTH_KV`, set the variables, and add both encrypted secrets.
3. In GitHub App settings, make sure the callback URL exactly matches `GITHUB_CALLBACK_URL`.
4. Set `apiBase` in `assets/js/admin-config.js` to the Worker origin, without a trailing slash.
5. Save the updated front-end files in the website repository. The configured Worker URL is an endpoint address, not a credential; never put secrets or access tokens in the public frontend.

## Security notes

- The browser does not receive the GitHub App private key or OAuth client secret.
- No endpoint returns a GitHub installation token to the browser. Blog-cover uploads, download-file uploads, and maintenance-settings changes are performed by the Worker after it validates the authenticated session.
- Blog-cover uploads are limited to 8 MB. Download uploads are limited to 20 MB to keep server-side encoding within Worker memory limits.
- The Worker verifies OAuth state, checks the allowed GitHub login, checks the exact Origin, and uses short-lived sessions.
- The installation token request explicitly scopes the token to `REPO_NAME` and Contents write permission. Keep the GitHub App installed only on the intended repository and grant only the permissions it needs.
- Do not enable sign-in until the GitHub App is installed only on the intended repository and its permissions have been reviewed.
- The static admin page URL is not itself secret; every API action requires a valid authorized session.
