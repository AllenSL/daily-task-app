/**
 * Start Electron without passing "electron@x.y.z" through cmd.exe (Windows parses @ badly).
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = __dirname;

function isLocalElectronUsable() {
  const dir = path.join(root, 'node_modules', 'electron');
  const need = ['package.json', 'index.js', 'cli.js', 'path.txt'].map((f) => path.join(dir, f));
  return need.every((p) => fs.existsSync(p));
}

function tryLocalElectronExe() {
  if (!isLocalElectronUsable()) return null;
  try {
    return require('electron');
  } catch {
    return null;
  }
}

function main() {
  const local = tryLocalElectronExe();
  if (local) {
    const child = spawn(local, ['.'], {
      cwd: root,
      stdio: 'inherit',
      shell: false,
      windowsHide: false
    });
    child.on('error', (err) => {
      console.error('[run.cjs] spawn electron failed:', err.message);
      process.exit(1);
    });
    child.on('exit', (code) => process.exit(code == null ? 1 : code));
    return;
  }

  const useShell = process.platform === 'win32';
  const child = spawn(
    'npm',
    ['exec', '--yes', '--package', 'electron@28.3.3', '--', 'electron', '.'],
    {
      cwd: root,
      stdio: 'inherit',
      shell: useShell,
      windowsHide: false,
      env: process.env
    }
  );
  child.on('error', (err) => {
    console.error('[run.cjs] Failed to run npm exec. Is Node/npm on PATH?');
    console.error(err.message);
    process.exit(1);
  });
  child.on('exit', (code) => process.exit(code == null ? 1 : code));
}

main();
