/**
 * Celestica (Thailand) Limited & Celestica Japan K.K.
 * Standalone Enterprise Server for Manager, IT Business Partner 2 (Req ID: 133553)
 */

const http = require('http');
const celesticaHandler = require('./celestica_handler');

const PORT = process.env.CELESTICA_PORT || 3040;

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname === '/' ? '/celestica' : parsedUrl.pathname;

  if (celesticaHandler.handle(req, res, pathname, req.method)) {
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ status: 'error', message: 'Not Found' }));
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log('================================================================================');
    console.log('  CELESTICA (THAILAND) & JAPAN — MANAGER, IT BUSINESS PARTNER 2 (REQ ID: 133553)');
    console.log('  Laem Chabang, Chonburi <-> Miyagi / Tokyo, Japan <-> Toronto Global IT HQ');
    console.log('================================================================================');
    console.log(`  Portal URL       : http://localhost:${PORT}/celestica`);
    console.log(`  Doc 1 (BPR/CBA)  : http://localhost:${PORT}/celestica/doc/cba`);
    console.log(`  Doc 2 (SOW/BRD)  : http://localhost:${PORT}/celestica/doc/sow`);
    console.log(`  Doc 3 (P6/SOP)   : http://localhost:${PORT}/celestica/doc/p6`);
    console.log('================================================================================');
  });
}

module.exports = server;
