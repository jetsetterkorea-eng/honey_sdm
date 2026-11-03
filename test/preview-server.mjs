import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { handleQuote } from '../api/quotes.mjs';

const root = resolve('dist');
const env = { QUOTE_ENABLED: 'true', GOOGLE_SHEETS_ID: 'local-test-only', GOOGLE_SERVICE_ACCOUNT_EMAIL: 'local-test-only', GOOGLE_PRIVATE_KEY: 'local-test-only', QUOTE_PRIVACY_RETENTION: '화면 검증용 안내', QUOTE_POLICY_VERSION: 'local-test-1' };
let attempts = 0;
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:4174');
  if (url.pathname === '/api/quotes') {
    let body = '';
    for await (const chunk of req) body += chunk;
    req.body = body;
    res.status = code => { res.statusCode = code; return res; };
    res.json = value => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); };
    return handleQuote(req, res, env, async () => {
      attempts++;
      if (attempts === 1) throw new Error('TEST_FAILURE');
      // Deliberate local fake. No data leaves this process.
    });
  }
  const file = resolve(root, '.' + (url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname)));
  if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
  try {
    const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };
    res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
}).listen(4174, '127.0.0.1', () => console.log('LOCAL MOCK ONLY http://127.0.0.1:4174'));
