/**
 * Servidor de Desenvolvimento Local - Zero Dependency
 * Utiliza exclusivamente os módulos nativos do Node.js (http, fs, path, url).
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '8000', 10);
const HOST = process.env.HOST || 'localhost';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // Tratamento de URL e rota padrão
  const parsedUrl = new URL(req.url, `http://${HOST}:${PORT}`);
  let pathname = parsedUrl.pathname;

  if (pathname === '/') {
    pathname = '/index.html';
  }

  // Prevenção de Path Traversal
  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(__dirname, safePath);

  // Garantir que o caminho resolvido permanece dentro do diretório do projeto
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Proibido: Acesso fora do diretório raiz.');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`404 Não Encontrado: ${pathname}`);
      return;
    }

    if (stats.isDirectory()) {
      const indexPath = path.join(filePath, 'index.html');
      if (fs.existsSync(indexPath)) {
        serveFile(indexPath, '.html', res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`404 Diretório sem index.html: ${pathname}`);
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    serveFile(filePath, ext, res);
  });
});

function serveFile(filePath, ext, res) {
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`500 Erro interno do servidor ao ler arquivo.`);
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(data);
  });
}

function startServer(port) {
  server.listen(port, HOST, () => {
    console.log('\n=============================================================');
    console.log('  🏛️  TORRE DE HANÓI - SERVIDOR LOCAL DE DESENVOLVIMENTO');
    console.log('=============================================================');
    console.log(`  🌐 Servidor Ativo:       http://${HOST}:${port}/`);
    console.log(`  🩺 Painel Smoke Test:    http://${HOST}:${port}/status.html`);
    console.log(`  🧪 Testes Unitários:     http://${HOST}:${port}/tests/test.html`);
    console.log('-------------------------------------------------------------');
    console.log('  Pressione Ctrl+C para encerrar o servidor.');
    console.log('=============================================================\n');
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = (server.address()?.port || PORT) + 1;
    console.warn(`⚠️ Porta em uso. Tentando porta alternativa ${nextPort}...`);
    setTimeout(() => startServer(nextPort), 250);
  } else {
    console.error('Erro no servidor:', err);
  }
});

startServer(PORT);
