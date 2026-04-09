const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let tray = null;

/** 1×1 PNG 占位（可放 assets/tray.png 覆盖） */
const TRAY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const TASKS_FILE = () => path.join(app.getPath('userData'), 'tasks.json');

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function readTasksFile() {
  try {
    const p = TASKS_FILE();
    if (!fs.existsSync(p)) return { tasks: [] };
    const raw = fs.readFileSync(p, 'utf8');
    const data = JSON.parse(raw);
    return { tasks: Array.isArray(data.tasks) ? data.tasks : [] };
  } catch (e) {
    console.error('readTasksFile', e);
    return { tasks: [] };
  }
}

function writeTasksFile(payload) {
  const p = TASKS_FILE();
  const tmp = p + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(payload, null, 2), 'utf8');
  fs.renameSync(tmp, p);
}

const WIN_NORMAL = { width: 408, height: 640, minW: 340, minH: 480 };
const WIN_COMPACT = { width: 400, height: 280, minW: 320, minH: 220 };

function getAppIconPath() {
  const p = path.join(__dirname, 'assets', 'app-icon.png');
  return fs.existsSync(p) ? p : null;
}

function createWindow() {
  const iconPath = getAppIconPath();
  mainWindow = new BrowserWindow({
    width: WIN_NORMAL.width,
    height: WIN_NORMAL.height,
    minWidth: WIN_NORMAL.minW,
    minHeight: WIN_NORMAL.minH,
    show: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    frame: false,
    transparent: true,
    hasShadow: true,
    backgroundColor: '#00000000',
    ...(iconPath ? { icon: iconPath } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: '每日任务'
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('minimize', () => {
    mainWindow.hide();
  });

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function buildTrayIcon() {
  const appIcon = path.join(__dirname, 'assets', 'app-icon.png');
  if (fs.existsSync(appIcon)) {
    try {
      const img = nativeImage.createFromPath(appIcon);
      if (!img.isEmpty()) {
        return img.resize({ width: 16, height: 16 });
      }
    } catch (_) {
      /* fall through */
    }
  }
  const pngPath = path.join(__dirname, 'assets', 'tray.png');
  if (fs.existsSync(pngPath)) {
    try {
      return nativeImage.createFromPath(pngPath);
    } catch (_) {
      /* fall through */
    }
  }
  return nativeImage.createFromBuffer(Buffer.from(TRAY_PNG_BASE64, 'base64'));
}

function createTray() {
  tray = new Tray(buildTrayIcon());
  tray.setToolTip('每日任务');
  const menu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);
  tray.setContextMenu(menu);
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

if (gotLock) {
  app.whenReady().then(() => {
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.github.allensl.dailytaskapp');
    }
    Menu.setApplicationMenu(null);
    createWindow();
    createTray();

    ipcMain.handle('tasks:load', () => readTasksFile());
    ipcMain.handle('tasks:save', (_e, payload) => {
      writeTasksFile(payload);
      return true;
    });
    ipcMain.handle('app:userData', () => app.getPath('userData'));

    ipcMain.on('window:hide-to-tray', () => {
      if (mainWindow) mainWindow.hide();
    });

    ipcMain.on('app:quit', () => {
      app.isQuitting = true;
      app.quit();
    });

    ipcMain.handle('window:setCompact', (_e, compact) => {
      if (!mainWindow) return false;
      if (compact) {
        mainWindow.setMinimumSize(WIN_COMPACT.minW, WIN_COMPACT.minH);
        mainWindow.setSize(WIN_COMPACT.width, WIN_COMPACT.height, true);
      } else {
        mainWindow.setMinimumSize(WIN_NORMAL.minW, WIN_NORMAL.minH);
        mainWindow.setSize(WIN_NORMAL.width, WIN_NORMAL.height, true);
      }
      return true;
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    /* Windows：关闭窗口后仍保留托盘进程，由托盘「退出」结束 */
  });

  app.on('before-quit', () => {
    app.isQuitting = true;
  });
}
