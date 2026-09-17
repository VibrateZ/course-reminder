let schedule = [];
let activeEntry = null;
let activeUrl = '';
let zoomFactor = 1;

const scheduleEl = document.querySelector('#schedule');
const todayEl = document.querySelector('#today');
const statusEl = document.querySelector('#status');
const browserEl = document.querySelector('#browser');
const emptyEl = document.querySelector('#empty');
const pageTitle = document.querySelector('#pageTitle');
const courseView = document.querySelector('#courseView');
const promptDialog = document.querySelector('#promptDialog');
const promptText = document.querySelector('#promptText');
const advanceButton = document.querySelector('#advance');
const zoomOutButton = document.querySelector('#zoomOut');
const zoomResetButton = document.querySelector('#zoomReset');
const zoomInButton = document.querySelector('#zoomIn');

function localDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function openLink(entry, link, advance = false) {
  activeEntry = entry;
  activeUrl = link.url;
  emptyEl.hidden = true;
  browserEl.hidden = false;
  pageTitle.textContent = `${advance ? '提前学习 · ' : ''}${entry.date} ${entry.startTime} · ${link.label}`;
  courseView.src = link.url;
  render();
}

function applyZoom(value) {
  zoomFactor = window.viewerControls.clampZoom(value);
  zoomResetButton.textContent = window.viewerControls.formatZoom(zoomFactor);
  zoomOutButton.disabled = zoomFactor <= window.viewerControls.MIN_ZOOM;
  zoomInButton.disabled = zoomFactor >= window.viewerControls.MAX_ZOOM;
  try {
    courseView.setZoomFactor(zoomFactor);
  } catch {
    // The selected zoom is applied when the webview finishes attaching.
  }
}

function row(entry) {
  const el = document.createElement('article');
  el.className = `entry ${entry.id === activeEntry?.id ? 'active' : ''}`;
  const heading = document.createElement('div');
  heading.className = 'date';
  heading.textContent = `${entry.date} 周${entry.weekday} · ${entry.startTime}${entry.course ? ` · ${entry.course}` : ''}`;
  const task = document.createElement('div');
  task.className = 'task';
  task.textContent = entry.task;
  const links = document.createElement('div');
  links.className = 'links';
  entry.links.forEach((link, index) => {
    const button = document.createElement('button');
    button.className = index === 0 ? 'primary' : 'secondary';
    button.textContent = link.label;
    button.addEventListener('click', () => openLink(entry, link));
    links.append(button);
  });
  el.append(heading, task, links);
  return el;
}

function render() {
  const todayEntry = schedule.find((entry) => entry.date === localDateKey());
  todayEl.replaceChildren();
  if (todayEntry) {
    const label = document.createElement('div');
    label.className = 'eyebrow';
    label.textContent = '今日安排';
    todayEl.append(label, row(todayEntry));
  } else {
    todayEl.innerHTML = '<div class="eyebrow">今日安排</div><p>今天没有排定学习任务。</p>';
  }
  scheduleEl.replaceChildren(...schedule.map(row));
  const nextEntry = window.studySelection.nextStudyEntry(schedule);
  advanceButton.disabled = !nextEntry;
  advanceButton.title = nextEntry
    ? `下一节：${nextEntry.date} ${nextEntry.startTime}${nextEntry.course ? ` · ${nextEntry.course}` : ''}`
    : '没有可提前学习的未来课程';
}

function applyState(state) {
  schedule = state.entries || [];
  const source = state.source === 'selected' ? '自选课表' : state.source === 'bundled' ? '内置课表' : '无可用课表';
  statusEl.textContent = `${source} · ${schedule.length} 个学习日 · ${state.planFile}`;
  statusEl.title = statusEl.textContent;
  statusEl.classList.toggle('warning', Boolean(state.warning));
  if (state.warning) statusEl.textContent = state.warning;
  render();
}

async function load() {
  applyState(await window.courseApp.getSchedule());
}

document.querySelector('#selectPlan').addEventListener('click', async () => {
  const result = await window.courseApp.selectSchedule();
  if (result.canceled) return;
  if (result.error) {
    statusEl.textContent = `导入失败：${result.error}`;
    statusEl.classList.add('warning');
    return;
  }
  applyState(result.state);
});
document.querySelector('#reload').addEventListener('click', load);
advanceButton.addEventListener('click', () => {
  const entry = window.studySelection.nextStudyEntry(schedule);
  if (entry) openLink(entry, entry.links[0], true);
});
document.querySelector('#test').addEventListener('click', () => window.courseApp.testNotification());
document.querySelector('#external').addEventListener('click', () => activeUrl && window.courseApp.openExternal(activeUrl));
zoomOutButton.addEventListener('click', () => applyZoom(window.viewerControls.stepZoom(zoomFactor, -1)));
zoomResetButton.addEventListener('click', () => applyZoom(1));
zoomInButton.addEventListener('click', () => applyZoom(window.viewerControls.stepZoom(zoomFactor, 1)));
courseView.addEventListener('dom-ready', () => applyZoom(zoomFactor));
document.querySelector('#prompt').addEventListener('click', async () => {
  promptText.textContent = await window.courseApp.getPrompt();
  promptDialog.showModal();
});
document.querySelector('#closePrompt').addEventListener('click', () => promptDialog.close());
document.querySelector('#copyPrompt').addEventListener('click', async (event) => {
  await navigator.clipboard.writeText(promptText.textContent);
  event.currentTarget.textContent = '已复制';
  setTimeout(() => { event.currentTarget.textContent = '复制提示词'; }, 1200);
});
window.courseApp.onOpenEntry((entry) => openLink(entry, entry.links[0]));
applyZoom(1);
load();
