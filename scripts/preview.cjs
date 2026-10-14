// Local preview launcher: reuse this project's server and preserve other servers.
const { spawn } = require('node:child_process');
const { get } = require('node:http');
const { createServer } = require('node:net');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const noOpen = process.argv.includes('--no-open');

function normalizeRoot(value) {
  if (typeof value !== 'string') return '';
  const resolved = path.resolve(value);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

function isThisProject(port) {
  return new Promise((resolve) => {
    const request = get({
      hostname: '127.0.0.1', port, path: '/',
      headers: { Accept: 'application/json', 'expo-platform': 'ios' },
    }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('error', () => resolve(false));
      response.on('data', (chunk) => {
        body += chunk;
        if (body.length > 1024 * 1024) request.destroy();
      });
      response.on('end', () => {
        try {
          const manifest = JSON.parse(body);
          const root = manifest.extra?.expoGo?.developer?.projectRoot;
          resolve(normalizeRoot(root) === normalizeRoot(projectRoot));
        } catch {
          resolve(false);
        }
      });
    });
    request.setTimeout(1500, () => request.destroy());
    request.on('error', () => resolve(false));
  });
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.listen(port, () => server.close(() => resolve(true)));
  });
}

function openBrowser(url) {
  const command = process.platform === 'win32' ? 'rundll32.exe'
    : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args = process.platform === 'win32' ? ['url.dll,FileProtocolHandler', url] : [url];
  const browser = spawn(command, args, { detached: true, stdio: 'ignore', windowsHide: true });
  browser.on('error', () => console.log(`Apri l'anteprima a questo indirizzo: ${url}`));
  browser.unref();
}

async function main() {
  let freePort;
  // Prefer reuse even if an earlier port has become free since the last launch.
  for (let port = 8081; port <= 8090; port++) {
    if (await isPortFree(port)) {
      freePort ??= port;
    } else if (await isThisProject(port)) {
      const url = `http://localhost:${port}`;
      console.log(`ChefSuggest e gia avviata: ${url}`);
      console.log('Le modifiche appariranno nella stessa anteprima.');
      if (!noOpen) openBrowser(url);
      return;
    }
  }
  if (!freePort) throw new Error('Le porte da 8081 a 8090 sono occupate. Chiedi a Codex di controllare i processi attivi.');

  const cli = path.join(projectRoot, 'node_modules', 'expo', 'bin', 'cli');
  console.log(`Avvio dell'anteprima: http://localhost:${freePort}`);
  console.log('Attendi il messaggio di Expo. Per fermare il server premi Ctrl+C.');
  const child = spawn(process.execPath, [cli, 'start', '--web', '--localhost', '--port', String(freePort)], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env, ...(noOpen ? { BROWSER: 'none' } : {}) },
    windowsHide: true,
  });
  child.on('error', (error) => {
    console.error(`Avvio non riuscito: ${error.message}`);
    process.exitCode = 1;
  });
  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
  child.on('exit', (code, signal) => {
    process.exitCode = code ?? (signal === 'SIGINT' ? 0 : 1);
  });
}

main().catch((error) => {
  console.error(`Anteprima non disponibile: ${error.message}`);
  process.exitCode = 1;
});
