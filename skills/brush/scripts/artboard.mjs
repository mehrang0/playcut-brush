#!/usr/bin/env node
// The Playcut Brush artboard: a local browser tab that shows the SVG an agent designs.
//   node artboard.mjs <file.svg>  push a design (starts the server and opens the
//                                 browser when needed), print one status line
//   node artboard.mjs             just make sure the artboard is up and visible
//   node artboard.mjs --serve     run the server itself
// Zero dependencies. Loopback only; other websites can't reach it.

import http from 'node:http';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';

const PORT = Number(process.env.BRUSH_PORT || 2673); // "CORE" on a phone keypad
const BASE = `http://127.0.0.1:${PORT}`;
const HOSTS = [`127.0.0.1:${PORT}`, `localhost:${PORT}`];
const ORIGINS = HOSTS.map((h) => `http://${h}`);
const here = dirname(fileURLToPath(import.meta.url));

if (process.argv[2] === '--serve') serve();
else show(process.argv[2]).catch((err) => {
  console.log(`error: ${err.message}`);
  process.exit(1);
});

// ---- client: what the agent runs ----

async function show(file) {
  const code = file ? readFileSync(file, 'utf8') : null;
  if (code !== null && !code.includes('<svg')) throw new Error(`no <svg> element in ${file}`);

  let health = await getHealth();
  if (health === 'foreign') throw new Error(`port ${PORT} is taken by another app; rerun with BRUSH_PORT=<free port>`);
  if (!health) {
    spawn(process.execPath, [fileURLToPath(import.meta.url), '--serve'], {
      detached: true, stdio: 'ignore', windowsHide: true,
    }).unref();
    for (let i = 0; i < 40 && !health; i++) {
      await sleep(100);
      health = await getHealth();
    }
    if (!health || health === 'foreign') throw new Error(`couldn't start the artboard on port ${PORT}; rerun with BRUSH_PORT=<free port>`);
    // A tab left open from an earlier run reconnects within a second.
    for (let i = 0; i < 12 && health.viewers === 0; i++) {
      await sleep(100);
      health = await getHealth();
    }
  }

  if (code === null) {
    if (health.viewers === 0) openBrowser();
    console.log(`artboard at ${BASE}`);
    return;
  }

  const { id, viewers } = await request('/render', { name: basename(file), code });
  if (viewers === 0) openBrowser();
  const where = viewers === 0 ? `opened ${BASE}` : `shown at ${BASE}`;
  const report = await request(`/result?id=${id}&wait=${viewers === 0 ? 12000 : 6000}`);
  if (report.error) {
    console.log(`svg error: ${report.error}`);
    process.exit(2);
  }
  if (!report.png) {
    console.log(`${where} · no snapshot (is the artboard tab open?)`);
    return;
  }
  const png = join(tmpdir(), 'playcut-brush', basename(file).replace(/\.svg$/i, '') + '.png');
  mkdirSync(dirname(png), { recursive: true });
  writeFileSync(png, Buffer.from(report.png, 'base64'));
  console.log(`${where} · snapshot: ${png}`);
}

async function getHealth() {
  try {
    const res = await fetch(`${BASE}/health`);
    const data = await res.json().catch(() => null);
    return data?.app === 'brush-artboard' ? data : 'foreign';
  } catch {
    return null; // nothing listening
  }
}

async function request(path, body) {
  const res = await fetch(BASE + path, body && {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`artboard answered ${res.status}`);
  return res.json();
}

function openBrowser() {
  const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  spawn(opener, [BASE], { stdio: 'ignore', detached: true, shell: process.platform === 'win32' })
    .on('error', () => {})
    .unref();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---- server: the page, the live channel, and the page's reports ----

function serve() {
  const page = join(here, '..', 'assets', 'artboard.html');
  const viewers = new Set();
  const reports = new Map(); // design id -> what the page saw (snapshot or error)
  const waiters = new Map(); // design id -> pending /result callbacks
  let latest = null;
  let seq = Date.now(); // ids stay unique across restarts, so reopened tabs never skip a design
  let lastActive = Date.now();

  const push = (res, design) => res.write(`data: ${JSON.stringify(design)}\n\n`);

  const server = http.createServer(async (req, res) => {
    lastActive = Date.now();
    // Host blocks DNS rebinding; Origin blocks POSTs from other websites.
    const { host, origin } = req.headers;
    if (!HOSTS.includes(host) || (origin && !ORIGINS.includes(origin))) {
      res.writeHead(403).end();
      return;
    }
    const url = new URL(req.url, BASE);
    const route = `${req.method} ${url.pathname}`;
    try {
      if (route === 'GET /') {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        res.end(readFileSync(page));
      } else if (route === 'GET /health') {
        json(res, { app: 'brush-artboard', viewers: viewers.size });
      } else if (route === 'GET /events') {
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
        res.write('retry: 1000\n\n');
        if (latest) push(res, latest);
        viewers.add(res);
        req.on('close', () => viewers.delete(res));
      } else if (route === 'POST /render') {
        const { name = 'design.svg', code } = JSON.parse(await readBody(req, 5e6));
        latest = { id: ++seq, name: String(name), code: String(code) };
        for (const viewer of viewers) push(viewer, latest);
        json(res, { id: latest.id, viewers: viewers.size });
      } else if (route === 'POST /report') {
        const report = JSON.parse(await readBody(req, 30e6));
        if (!reports.has(report.id)) {
          reports.set(report.id, report);
          if (reports.size > 20) reports.delete(reports.keys().next().value);
          for (const done of [...(waiters.get(report.id) || [])]) done(report);
          waiters.delete(report.id);
        }
        res.writeHead(204).end();
      } else if (route === 'GET /result') {
        const id = Number(url.searchParams.get('id'));
        if (reports.has(id)) return json(res, reports.get(id));
        const list = waiters.get(id) || [];
        waiters.set(id, list);
        const done = (report) => {
          clearTimeout(timer);
          if (list.includes(done)) list.splice(list.indexOf(done), 1);
          json(res, report);
        };
        const wait = Math.min(Number(url.searchParams.get('wait')) || 6000, 20000);
        const timer = setTimeout(() => done({ id, timeout: true }), wait);
        list.push(done);
      } else {
        res.writeHead(404).end();
      }
    } catch {
      if (!res.headersSent) res.writeHead(400).end();
    }
  });

  server.listen(PORT, '127.0.0.1');
  // Quit after 30 quiet minutes with no tab open.
  setInterval(() => {
    if (viewers.size === 0 && Date.now() - lastActive > 30 * 60_000) process.exit(0);
  }, 60_000).unref();
}

function json(res, data) {
  res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(data));
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > limit) {
        reject(new Error('body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}
