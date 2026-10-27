#!/usr/bin/env node
/*
 * A tiny zero-dependency static server for local development.
 *   node scripts/serve.js          -> http://localhost:8080
 *   PORT=3000 node scripts/serve.js
 * Serves ./public only, on localhost, with the same security headers as Netlify.
 */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', 'public');
const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '127.0.0.1';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8'
};

const HEADERS = {
  'Content-Security-Policy':
    "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data: blob:; connect-src 'none'; manifest-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer'
};

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  const file = path.resolve(ROOT, '.' + urlPath);
  if (!file.startsWith(ROOT + path.sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', ...HEADERS });
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      ...HEADERS
    });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`PSYCHE MIRROR is lit at http://${HOST === '127.0.0.1' ? 'localhost' : HOST}:${PORT}`);
});
