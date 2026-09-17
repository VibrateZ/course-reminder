const { app, BrowserWindow, Notification, ipcMain, shell, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const { isWebUrl, parsePlanFile } = require('./schedule-parser');

let mainWindow;
let reminderTimer;
const notifiedKeys = new Set();

const appDir = __dirname;
const projectDir = path.dirname(appDir);
const bundledPlanFile = app.isPackaged
  ? path.join(process.resourcesPath, 'learning-plan.md')
  : path.join(projectDir, 'examples', '示例课表.md');
const promptFile = app.isPackaged
  ? path.join(process.resourcesPath, 'ai-schedule-prompt.md')
  : path.join(projectDir, 'AI课表生成提示词.md');

function settingsFile() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function readSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsFile(), 'utf8'));
  } catch {
    return {};
  }
}

function writeSettings(settings) {
  fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
  fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2), 'utf8');
}

function scheduleState() {
  const savedPath = readSettings().planFile;
  const candidates = [savedPath, bundledPlanFile].filter(Boolean);
  let lastError = '';
  for (const filePath of candidates) {
    try {
      return {
        entries: parsePlanFile(filePath),
        planFile: filePath,
        source: filePath === savedPath ? 'selected' : 'bundled',
        warning: lastError,
      };
    } catch (error) {
      lastError = savedPath && filePath === savedPath ? `所选课表不可用：${error.message}。已回退到内置课表。` : error.message;
    }
  }
  return { entries: [], planFile: savedPath || bundledPlanFile, source: 'none', warning: lastError || '没有可用课表' };
}

function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function currentEntry(schedule) {
  return schedule.find((item) => item.date === todayKey()) || null;
}

function sendReminder(entry, force = false) {
  if (!entry) return;
  const key = `${entry.id}:${force ? Date.now() : 'scheduled'}`;
  if (!force && notifiedKeys.has(key)) return;
  notifiedKeys.add(key);
  const notification = new Notification({
    title: entry.course ? `课程提醒：${entry.course}` : `课程提醒：第 ${entry.week} 周`,
    body: entry.task.length > 100 ? `${entry.task.slice(0, 100)}...` : entry.task,
  });
  notification.on('click', () => {
    mainWindow?.show();
    mainWindow?.webContents.send('open-entry', entry);
  });
  notification.show();
}

function checkReminder() {
  const entry = currentEntry(scheduleState().entries);
  if (!entry) return;
  const now = new Date();
  const [hour, minute] = entry.startTime.split(':').map(Number);
  if (now.getHours() === hour && now.getMinutes() >= minute && now.getMinutes() < minute + 2) sendReminder(entry);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 980,
    minHeight: 680,
    backgroundColor: '#f6f8fa',
    webPreferences: {
      preload: path.join(appDir, 'preload.js'),
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile(path.join(appDir, 'index.html'));
}

ipcMain.handle('schedule:get', () => scheduleState());
ipcMain.handle('schedule:select', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择 Markdown 课表',
    properties: ['openFile'],
    filters: [{ name: 'Markdown 课表', extensions: ['md'] }],
  });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  const selected = result.filePaths[0];
  try {
    const entries = parsePlanFile(selected);
    writeSettings({ ...readSettings(), planFile: selected });
    notifiedKeys.clear();
    return { canceled: false, state: { entries, planFile: selected, source: 'selected', warning: '' } };
  } catch (error) {
    return { canceled: false, error: error.message };
  }
});
ipcMain.handle('schedule:use-bundled', () => {
  const settings = readSettings();
  delete settings.planFile;
  writeSettings(settings);
  notifiedKeys.clear();
  return scheduleState();
});
ipcMain.handle('prompt:get', () => fs.readFileSync(promptFile, 'utf8'));
ipcMain.handle('notification:test', () => {
  const entries = scheduleState().entries;
  sendReminder(currentEntry(entries) || entries[0] || { id: 'test', week: 1, task: '这是一条测试提醒。' }, true);
});
ipcMain.handle('external:open', (_, url) => isWebUrl(url) && shell.openExternal(url));

app.whenReady().then(() => {
  createWindow();
  checkReminder();
  reminderTimer = setInterval(checkReminder, 30 * 1000);
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => clearInterval(reminderTimer));
