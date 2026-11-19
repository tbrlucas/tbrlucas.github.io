const API = "https://api.github.com";
const ADMIN_PATH = "/alcatelonetouch3075m/";
const POSTS_PATH = "assets/data/posts.json";
const DOWNLOADS_PATH = "assets/data/downloads.json";
const WHATS_NEW_PATH = "assets/data/whats-new.json";

function json(data, status = 200, origin = "") {
  return new Response(JSON.stringify(data), {status, headers:{
    "Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store",
    "Access-Control-Allow-Origin":origin, "Access-Control-Allow-Methods":"GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":"Authorization, Content-Type, X-File-Name, X-File-Size", "Vary":"Origin"
  }});
}
function randomToken(bytes = 32) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), x => x.toString(16).padStart(2,"0")).join("");
}
function base64ToUtf8(value) {
  const binary = atob(value.replace(/\n/g,""));
  return new TextDecoder().decode(Uint8Array.from(binary, c => c.charCodeAt(0)));
}
function utf8ToBase64(value) {
  const bytes = new TextEncoder().encode(value); let binary = "";
  bytes.forEach(byte => binary += String.fromCharCode(byte)); return btoa(binary);
}
function b64url(bytes) {
  let binary = ""; bytes.forEach(byte => binary += String.fromCharCode(byte));
  return btoa(binary).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
}
function pemBytes(pem) {
  const body = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,"");
  return Uint8Array.from(atob(body), c => c.charCodeAt(0));
}
function validPost(post) {
  if (!post || typeof post !== "object") return false;
  const date = typeof post.date === "string" ? new Date(post.date + "T00:00:00Z") : null;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug || "")
    && typeof post.title === "string" && post.title.trim().length > 0 && post.title.length <= 120
    && typeof post.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(post.date)
    && date && !Number.isNaN(date.getTime()) && date.toISOString().slice(0,10) === post.date
    && typeof post.excerpt === "string" && post.excerpt.length <= 240
    && typeof post.content === "string" && post.content.length <= 50000
    && typeof post.published === "boolean";
}
function validDownload(item) {
  if (!item || typeof item !== "object") return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug || "")
    && typeof item.title === "string" && item.title.trim().length > 0 && item.title.length <= 120
    && ["iOS","Android","Other"].includes(item.platform)
    && typeof item.description === "string" && item.description.trim().length > 0 && item.description.length <= 500
    && typeof item.compatibility === "string" && item.compatibility.length <= 240
    && typeof item.version === "string" && item.version.length <= 40
    && typeof item.fileSize === "string" && item.fileSize.length <= 40
    && typeof item.fileType === "string" && item.fileType.length <= 40
    && typeof item.notes === "string" && item.notes.length <= 1000
    && typeof item.url === "string" && /^https:\/\//i.test(item.url) && item.url.length <= 2000
    && typeof item.published === "boolean";
}
function validUpdate(item) {
  if (!item || typeof item !== "object") return false;
  const date = typeof item.date === "string" ? new Date(item.date + "T00:00:00Z") : null;
  return /^[a-zA-Z0-9-]{1,80}$/.test(item.id || "")
    && typeof item.title === "string" && item.title.trim().length > 0 && item.title.length <= 120
    && typeof item.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.date)
    && date && !Number.isNaN(date.getTime()) && date.toISOString().slice(0,10) === item.date
    && typeof item.time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(item.time)
    && ["Website","Blog","Projects","Downloads","Other"].includes(item.category)
    && ["New feature","Improvement","Fix","Announcement"].includes(item.type)
    && typeof item.summary === "string" && item.summary.trim().length > 0 && item.summary.length <= 300
    && typeof item.details === "string" && item.details.length <= 5000
    && typeof item.published === "boolean";
}
async function readWhatsNew(env, token) {
  const path = "/repos/" + env.REPO_OWNER + "/" + env.REPO_NAME + "/contents/" + WHATS_NEW_PATH + "?ref=main";
  const file = await githubRequest(path, token);
  return {updates:JSON.parse(base64ToUtf8(file.content)),sha:file.sha};
}
async function writeWhatsNew(env, token, updates, sha) {
  const path = "/repos/" + env.REPO_OWNER + "/" + env.REPO_NAME + "/contents/" + WHATS_NEW_PATH;
  return githubRequest(path, token, {method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({
    message:"Manage What's New updates",content:utf8ToBase64(JSON.stringify({updates},null,2) + "\n"),branch:"main",sha
  })});
}
function corsOrigin(request, env) {
  const origin = request.headers.get("Origin") || "";
  return origin === String(env.ADMIN_ORIGIN || "").replace(/\/$/,"") ? origin : "";
}
async function githubRequest(path, token, options = {}) {
  const response = await fetch(API + path, { ...options, headers:{
    "Accept":"application/vnd.github+json", "Authorization":"Bearer " + token,
    "X-GitHub-Api-Version":"2022-11-28", "User-Agent":"tbrlucas-blog-admin", ...(options.headers || {})
  }});
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "GitHub API error " + response.status);
  return data;
}


async function appJwt(env) {
  const now = Math.floor(Date.now()/1000);
  const header = btoa(JSON.stringify({alg:"RS256",typ:"JWT"})).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  const payload = btoa(JSON.stringify({iat:now-30,exp:now+540,iss:String(env.GITHUB_APP_ID)})).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  const unsigned = header + "." + payload;
  const key = await crypto.subtle.importKey("pkcs8", pemBytes(env.GITHUB_APP_PRIVATE_KEY), {name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"}, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  return unsigned + "." + b64url(new Uint8Array(signature));
}
async function installationToken(env) {
  const cached = await env.AUTH_KV.get("github:installation-token");
  if (cached) return cached;
  const jwt = await appJwt(env);
  const result = await githubRequest("/app/installations/" + env.GITHUB_APP_INSTALLATION_ID + "/access_tokens", jwt, {
    method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({permissions:{contents:"write"}})
  });
  if (!result.token) throw new Error("Could not obtain a repository installation token.");
  await env.AUTH_KV.put("github:installation-token", result.token, {expirationTtl:3300});
  return result.token;
}
async function getSession(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const id = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!/^[a-f0-9]{64}$/.test(id)) return null;
  const raw = await env.AUTH_KV.get("session:" + id);
  return raw ? {id, ...JSON.parse(raw)} : null;
}
async function readPosts(env, token) {
  const path = "/repos/" + env.REPO_OWNER + "/" + env.REPO_NAME + "/contents/" + POSTS_PATH + "?ref=main";
  const file = await githubRequest(path, token);
  return {posts:JSON.parse(base64ToUtf8(file.content)),sha:file.sha};
}
async function readDownloads(env, token) {
  const path = "/repos/" + env.REPO_OWNER + "/" + env.REPO_NAME + "/contents/" + DOWNLOADS_PATH + "?ref=main";
  const file = await githubRequest(path, token);
  return {downloads:JSON.parse(base64ToUtf8(file.content)),sha:file.sha};
}
async function writeDownloads(env, token, downloads, sha) {
  const path = "/repos/" + env.REPO_OWNER + "/" + env.REPO_NAME + "/contents/" + DOWNLOADS_PATH;
  return githubRequest(path, token, {method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({
    message:"Manage downloads library",content:utf8ToBase64(JSON.stringify({downloads},null,2) + "\n"),branch:"main",sha
  })});
}
async function writePosts(env, token, posts, sha) {
  const path = "/repos/" + env.REPO_OWNER + "/" + env.REPO_NAME + "/contents/" + POSTS_PATH;
  return githubRequest(path, token, {method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({
    message:"Manage blog publications",content:utf8ToBase64(JSON.stringify({posts},null,2) + "\n"),branch:"main",sha
  })});
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url); const origin = corsOrigin(request,env);
    if (request.method === "OPTIONS") {
      if (!origin) return new Response(null,{status:403});
      return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Authorization, Content-Type, X-File-Name, X-File-Size","Access-Control-Max-Age":"86400","Vary":"Origin"}});
    }
    try {
      if (url.pathname === "/auth/login" && request.method === "GET") {
        const state = randomToken(); await env.AUTH_KV.put("oauth:" + state,"1",{expirationTtl:600});
        const redirect = new URL("https://github.com/login/oauth/authorize");
        redirect.searchParams.set("client_id",env.GITHUB_OAUTH_CLIENT_ID);
        redirect.searchParams.set("redirect_uri",env.GITHUB_CALLBACK_URL);
        redirect.searchParams.set("state",state);
        return Response.redirect(redirect.toString(),302);
      }
      if (url.pathname === "/auth/callback" && request.method === "GET") {
        const code = url.searchParams.get("code"); const state = url.searchParams.get("state");
        if (!code || !state || await env.AUTH_KV.get("oauth:" + state) !== "1") return new Response("Invalid or expired sign-in request.",{status:400});
        await env.AUTH_KV.delete("oauth:" + state);
        const tokenResponse = await fetch("https://github.com/login/oauth/access_token",{method:"POST",headers:{"Accept":"application/json","Content-Type":"application/json"},body:JSON.stringify({client_id:env.GITHUB_OAUTH_CLIENT_ID,client_secret:env.GITHUB_OAUTH_CLIENT_SECRET,code,redirect_uri:env.GITHUB_CALLBACK_URL})});
        const tokenData = await tokenResponse.json();
        if (!tokenData.access_token) return new Response("GitHub sign-in failed.",{status:401});
        const user = await githubRequest("/user",tokenData.access_token);
        if ((user.login || "").toLowerCase() !== env.ADMIN_GITHUB_LOGIN.toLowerCase()) return new Response("This GitHub account is not allowed to administer this blog.",{status:403});
        const sessionId = randomToken();
        await env.AUTH_KV.put("session:" + sessionId,JSON.stringify({login:user.login}),{expirationTtl:28800});
        return Response.redirect(env.ADMIN_ORIGIN.replace(/\/$/,"") + ADMIN_PATH + "#session=" + sessionId,302);
      }
      if (!origin) return json({error:"Origin not allowed."},403,"");
      const session = await getSession(request,env);
      if (!session) return json({error:"Please sign in again."},401,origin);
      if (url.pathname === "/api/session" && request.method === "GET") return json({login:session.login},200,origin);
      if (url.pathname === "/api/upload-token" && request.method === "GET") {
        const token = await installationToken(env);
        return json({token, expiresIn:3300, owner:env.REPO_OWNER, repo:env.REPO_NAME},200,origin);
      }
      if (url.pathname === "/api/logout" && request.method === "POST") { await env.AUTH_KV.delete("session:" + session.id); return json({ok:true},200,origin); }
const INITIAL_MAINTENANCE_REPORTS = [{
  id:"maintenance-2026-11-18",
  title:"TBRLucas Security & Reliability Review",
  date:"2026-11-18",
  severity:"Low",
  summary:"Routine review completed. Two low-severity issues were corrected; no Critical, High or Medium findings were identified in the reviewed scope.",
  scope:"Reviewed public-site source, page scripts, content publishing and administration flow, image upload handling, Worker authentication/session/CORS design, public JSON data, and recent GitHub Pages deployment records. Live pages could not be independently fetched through the available page checker.",
  findings:"Low — blog cover uploads derived the stored extension from the original filename instead of the accepted MIME type.\nLow — the Status page duplicated the main-site check as Backupsite, although both checks targeted the same main-site address.",
  actions:"Changed blog cover upload extension selection to derive from the accepted image MIME type. Removed the duplicated Backupsite status entry. A further hardening opportunity remains: moving upload operations fully server-side requires separate deployment and end-to-end testing.",
  verification:"The source changes were committed to main. Deployment status was not independently confirmed in the historical report. No Critical, High or Medium findings were identified in the reviewed files.",
  benefits:"More reliable image file handling and clearer status reporting.",
  createdAt:"2026-11-18T14:27:00-03:00"
}];
async function readMaintenanceReports(env) {
  const key = "maintenance:reports";
  const stored = await env.AUTH_KV.get(key);
  if (stored) {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  }
  await env.AUTH_KV.put(key, JSON.stringify(INITIAL_MAINTENANCE_REPORTS));
  return INITIAL_MAINTENANCE_REPORTS;
}
function validMaintenanceReport(report) {
  if (!report || typeof report !== "object") return false;
  const limits = {title:140,scope:4000,findings:8000,actions:8000,verification:4000,benefits:2000,summary:3000};
  if (!["Critical","High","Medium","Low","Informational"].includes(report.severity)) return false;
  if (typeof report.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(report.date)) return false;
  const date = new Date(report.date + "T00:00:00Z");
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0,10) !== report.date) return false;
  return Object.entries(limits).every(([key,max]) => typeof report[key] === "string" && report[key].length <= max)
    && report.title.trim().length > 0 && report.scope.trim().length > 0
    && report.verification.trim().length > 0 && report.summary.trim().length > 0;
}

      if (url.pathname === "/api/maintenance-reports" && (request.method === "GET" || request.method === "POST")) {
        if (request.method === "GET") {
          const reports = await readMaintenanceReports(env);
          return json({reports},200,origin);
        }
        const input = await request.json();
        if (input.action !== "save" || !validMaintenanceReport(input.report)) {
          return json({error:"Check the report title, date, severity, scope, verification and summary."},400,origin);
        }
        const reports = await readMaintenanceReports(env);
        if (reports.length >= 1000) return json({error:"The maintenance report history has reached its 1,000-entry limit."},400,origin);
        const report = {...input.report, id:"maintenance-" + randomToken(12), createdAt:new Date().toISOString()};
        reports.push(report);
        await env.AUTH_KV.put("maintenance:reports",JSON.stringify(reports));
        return json({reports},200,origin);
      }
      if (url.pathname === "/api/posts" && (request.method === "GET" || request.method === "POST")) {
        const token = await installationToken(env);
        if (request.method === "GET") { const result = await readPosts(env,token); return json({posts:result.posts.posts || []},200,origin); }
        const input = await request.json(); const result = await readPosts(env,token);
        let posts = Array.isArray(result.posts.posts) ? result.posts.posts : [];
        if (input.action === "save") {
          if (!validPost(input.post)) return json({error:"Check the post fields. Title, slug, date and content are required."},400,origin);
          const originalSlug = typeof input.originalSlug === "string" ? input.originalSlug : "";
          const originalIndex = originalSlug ? posts.findIndex(post => post.slug === originalSlug) : -1;
          const duplicateIndex = posts.findIndex(post => post.slug === input.post.slug);
          if (originalSlug && originalIndex < 0) return json({error:"The original post was not found. Reload the list before saving."},404,origin);
          if (duplicateIndex >= 0 && duplicateIndex !== originalIndex) return json({error:"Another post already uses this URL slug."},409,origin);
          if (originalIndex >= 0) posts[originalIndex] = input.post;
          else { if (posts.length >= 100) return json({error:"The blog has reached its 100-post limit."},400,origin); posts.push(input.post); }
        } else if (input.action === "delete") {
          if (typeof input.slug !== "string") return json({error:"A post slug is required."},400,origin);
          const before = posts.length; posts = posts.filter(post => post.slug !== input.slug);
          if (posts.length === before) return json({error:"The post was not found."},404,origin);
        } else return json({error:"Unknown action."},400,origin);
        await writePosts(env,token,posts,result.sha); return json({posts},200,origin);
      }


      if (url.pathname === "/api/whats-new" && (request.method === "GET" || request.method === "POST")) {
        const token = await installationToken(env);
        if (request.method === "GET") { const result = await readWhatsNew(env,token); return json({updates:result.updates.updates || []},200,origin); }
        const input = await request.json(); const result = await readWhatsNew(env,token);
        let updates = Array.isArray(result.updates.updates) ? result.updates.updates : [];
        if (input.action === "save") {
          if (!validUpdate(input.update)) return json({error:"Check the update fields, date, time, category and type."},400,origin);
          const index = updates.findIndex(item => item.id === input.update.id);
          if (index >= 0) updates[index] = input.update;
          else { if (updates.length >= 500) return json({error:"The update history has reached its 500-entry limit."},400,origin); updates.push(input.update); }
        } else if (input.action === "delete") {
          if (typeof input.id !== "string") return json({error:"An update ID is required."},400,origin);
          const before = updates.length; updates = updates.filter(item => item.id !== input.id);
          if (updates.length === before) return json({error:"The update was not found."},404,origin);
        } else return json({error:"Unknown action."},400,origin);
        await writeWhatsNew(env,token,updates,result.sha); return json({updates},200,origin);
      }
      // Large files are uploaded directly from the authenticated admin browser to GitHub.
      if (url.pathname === "/api/downloads" && (request.method === "GET" || request.method === "POST")) {
        const token = await installationToken(env);
        if (request.method === "GET") { const result = await readDownloads(env,token); return json({downloads:result.downloads.downloads || []},200,origin); }
        const input = await request.json(); const result = await readDownloads(env,token);
        let downloads = Array.isArray(result.downloads.downloads) ? result.downloads.downloads : [];
        if (input.action === "save") {
          if (!validDownload(input.download)) return json({error:"Check the download fields. Title, slug, platform, description and HTTPS URL are required."},400,origin);
          const originalSlug = typeof input.originalSlug === "string" ? input.originalSlug : "";
          const originalIndex = originalSlug ? downloads.findIndex(item => item.slug === originalSlug) : -1;
          const duplicateIndex = downloads.findIndex(item => item.slug === input.download.slug);
          if (originalSlug && originalIndex < 0) return json({error:"The original download was not found. Reload the list before saving."},404,origin);
          if (duplicateIndex >= 0 && duplicateIndex !== originalIndex) return json({error:"Another download already uses this URL slug."},409,origin);
          if (originalIndex >= 0) downloads[originalIndex] = input.download;
          else { if (downloads.length >= 200) return json({error:"The downloads library has reached its 200-item limit."},400,origin); downloads.push(input.download); }
        } else if (input.action === "delete") {
          if (typeof input.slug !== "string") return json({error:"A download slug is required."},400,origin);
          const before = downloads.length; downloads = downloads.filter(item => item.slug !== input.slug);
          if (downloads.length === before) return json({error:"The download was not found."},404,origin);
        } else return json({error:"Unknown action."},400,origin);
        await writeDownloads(env,token,downloads,result.sha); return json({downloads},200,origin);
      }
      return json({error:"Not found."},404,origin);
    } catch (error) { return json({error:error.message || "Unexpected server error."},500,origin); }
  }
};