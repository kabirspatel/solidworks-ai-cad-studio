import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const runRoot = path.join(__dirname, "runs");
const port = Number(process.env.PORT || 8790);
const host = process.env.HOST || "127.0.0.1";
const dashboardOrigin = process.env.DASHBOARD_ORIGIN || "https://kabirspatel.github.io";
const spaceUrl = process.env.THREEDS_SPACE_URL || "https://my.3dexperience.3ds.com/";
const authUrl = process.env.THREEDS_AUTH_URL || "";
const tokenUrl = process.env.THREEDS_TOKEN_URL || "";
const clientId = process.env.THREEDS_CLIENT_ID || "";
const clientSecret = process.env.THREEDS_CLIENT_SECRET || "";
const redirectUri = process.env.THREEDS_REDIRECT_URI || `http://${host}:${port}/api/cloud/auth/callback`;
const scope = process.env.THREEDS_SCOPE || "openid";
const sessions = new Map();

await mkdir(runRoot, { recursive: true });

const server = createServer(async (request, response) => {
  try {
    setCors(request, response);
    const method = request.method || "GET";
    if (method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }

    const url = new URL(request.url || "/", `http://${request.headers.host || `${host}:${port}`}`);

    if ((method === "GET" || method === "HEAD") && url.pathname === "/api/cloud/status") {
      json(response, {
        connected: hasUsableSession(),
        configured: Boolean(authUrl && tokenUrl && clientId),
        provider: "3DEXPERIENCE / SOLIDWORKS xDesign",
        spaceUrl,
        launchUrl: spaceUrl,
        authStartUrl: absoluteUrl(request, "/api/cloud/auth/start"),
        message: hasUsableSession()
          ? "Cloud broker has an OAuth session."
          : "Cloud broker is online. Configure Dassault/3DEXPERIENCE OAuth credentials to enable account connection."
      }, 200, method === "HEAD");
      return;
    }

    if ((method === "GET" || method === "HEAD") && url.pathname === "/api/cloud/auth/start") {
      if (!(authUrl && clientId)) {
        json(response, {
          error: "3DEXPERIENCE OAuth is not configured.",
          requiredEnv: ["THREEDS_AUTH_URL", "THREEDS_TOKEN_URL", "THREEDS_CLIENT_ID", "THREEDS_CLIENT_SECRET", "THREEDS_REDIRECT_URI"],
          message: "Register an OAuth app with Dassault/3DEXPERIENCE, then restart this broker with the environment variables."
        }, 501, method === "HEAD");
        return;
      }
      const state = crypto.randomUUID();
      sessions.set(state, { createdAt: Date.now() });
      const login = new URL(authUrl);
      login.searchParams.set("response_type", "code");
      login.searchParams.set("client_id", clientId);
      login.searchParams.set("redirect_uri", redirectUri);
      login.searchParams.set("scope", scope);
      login.searchParams.set("state", state);
      response.writeHead(302, { Location: login.toString() });
      response.end();
      return;
    }

    if ((method === "GET" || method === "HEAD") && url.pathname === "/api/cloud/auth/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      if (!code || !state || !sessions.has(state)) {
        html(response, renderAuthResult("Cloud login failed", "Missing or invalid OAuth state."), 400, method === "HEAD");
        return;
      }
      const session = sessions.get(state);
      session.code = code;
      if (tokenUrl && clientSecret) {
        session.token = await exchangeToken(code);
      }
      sessions.set(state, session);
      html(response, renderAuthResult("Cloud login captured", "You can close this tab and return to the dashboard."), 200, method === "HEAD");
      return;
    }

    if (method === "POST" && url.pathname === "/api/cloud/push") {
      const body = await readJson(request);
      const run = await persistCloudPackage(body);
      json(response, {
        message: hasUsableSession()
          ? "Cloud package received. Replace this scaffold with the 3DEXPERIENCE file/model API call for your tenant."
          : "Cloud package saved locally. Configure OAuth/API credentials to push into a user account.",
        launchUrl: spaceUrl,
        artifacts: run.publicArtifacts
      });
      return;
    }

    if ((method === "GET" || method === "HEAD") && url.pathname.startsWith("/runs/")) {
      await serveRunFile(response, url.pathname, method === "HEAD");
      return;
    }

    if ((method === "GET" || method === "HEAD") && url.pathname === "/") {
      html(response, renderHome(request), 200, method === "HEAD");
      return;
    }

    json(response, { error: "Not found" }, 404);
  } catch (error) {
    json(response, { error: error.message || String(error) }, 500);
  }
});

server.listen(port, host, () => {
  console.log(`SolidWorks AI CAD Studio CloudBroker: http://${host}:${port}/`);
  console.log("Configure THREEDS_* environment variables for real 3DEXPERIENCE OAuth/API access.");
});

function setCors(request, response) {
  const origin = request.headers.origin;
  const allowed = new Set([
    dashboardOrigin,
    "https://kabirspatel.github.io",
    "https://kabirspatel.github.io/solidworks-ai-cad-studio",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:8787",
    "http://127.0.0.1:8787"
  ]);
  response.setHeader("Access-Control-Allow-Origin", origin && allowed.has(origin) ? origin : dashboardOrigin);
  response.setHeader("Vary", "Origin");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

function absoluteUrl(request, pathname) {
  return `http://${request.headers.host || `${host}:${port}`}${pathname}`;
}

function hasUsableSession() {
  return [...sessions.values()].some(session => session.token || session.code);
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function json(response, payload, status = 200, headOnly = false) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(headOnly ? undefined : JSON.stringify(payload, null, 2));
}

function html(response, content, status = 200, headOnly = false) {
  response.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  response.end(headOnly ? undefined : content);
}

async function exchangeToken(code) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret
  });
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error_description || data.error || `Token exchange failed (${response.status})`);
  return data;
}

async function persistCloudPackage(packagePayload) {
  const name = `${new Date().toISOString().replace(/[:.]/g, "-")}-cloud-package`;
  const folder = path.join(runRoot, name);
  await mkdir(folder, { recursive: true });
  const artifacts = {
    package: path.join(folder, "cloud-package.json"),
    payload: path.join(folder, "model-payload.json"),
    designTable: path.join(folder, "solidworks-design-table.csv"),
    operations: path.join(folder, "cloud-operations.json")
  };
  await writeFile(artifacts.package, JSON.stringify(packagePayload, null, 2));
  await writeFile(artifacts.payload, JSON.stringify(packagePayload.payload || {}, null, 2));
  await writeFile(artifacts.designTable, packagePayload.designTableCsv || "");
  await writeFile(artifacts.operations, JSON.stringify(packagePayload.operations || {}, null, 2));
  return {
    folder,
    publicArtifacts: Object.fromEntries(
      Object.entries(artifacts).map(([key, value]) => [key, `/runs/${name}/${path.basename(value)}`])
    )
  };
}

async function serveRunFile(response, pathname, headOnly = false) {
  const target = path.normalize(path.join(__dirname, pathname.replace(/^\/runs\//, "runs/")));
  if (!target.startsWith(runRoot)) {
    json(response, { error: "Invalid run path" }, 400);
    return;
  }
  try {
    const info = await stat(target);
    response.writeHead(200, {
      "Content-Type": contentType(target),
      "Content-Length": info.size
    });
    if (headOnly) response.end();
    else createReadStream(target).pipe(response);
  } catch {
    json(response, { error: "Not found" }, 404);
  }
}

function contentType(target) {
  if (target.endsWith(".json")) return "application/json; charset=utf-8";
  if (target.endsWith(".csv")) return "text/csv; charset=utf-8";
  return "text/plain; charset=utf-8";
}

function renderHome(request) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>CloudBroker</title></head>
<body style="font-family: Avenir Next, sans-serif; margin: 32px; line-height: 1.5;">
  <h1>SolidWorks AI CAD Studio CloudBroker</h1>
  <p>Status: ${hasUsableSession() ? "connected" : "not connected"}</p>
  <p>Space URL: <a href="${spaceUrl}">${spaceUrl}</a></p>
  <p>Auth start: <a href="${absoluteUrl(request, "/api/cloud/auth/start")}">${absoluteUrl(request, "/api/cloud/auth/start")}</a></p>
  <p>This broker is an OAuth/API scaffold. Add Dassault/3DEXPERIENCE credentials through <code>THREEDS_*</code> environment variables to connect a user account.</p>
</body>
</html>`;
}

function renderAuthResult(title, message) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="font-family: Avenir Next, sans-serif; margin: 32px; line-height: 1.5;">
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(message)}</p>
</body>
</html>`;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[char]);
}
