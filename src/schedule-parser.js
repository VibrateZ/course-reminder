const fs = require('fs');
const path = require('path');

function isWebUrl(value) {
  try {
    const protocol = new URL(value).protocol;
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

function extractLinks(text) {
  const links = [];
  for (const match of text.matchAll(/\[([^\]]+)]\((https?:\/\/[^\s)]+)\)/g)) {
    if (isWebUrl(match[2])) links.push({ label: match[1].trim() || '课程资源', url: match[2] });
  }
  return links;
}

function inferredLinks(task) {
  const calculus = /函数|极限|连续|导数|求导|临界|单调|凹凸|优化|变化率|中值|原函数|积分|面积|体积|平均值|级数|Taylor|洛必达|反常/.test(task);
  const linear = /矩阵|方程组|消元|主元|阶梯|逆矩阵|LU|向量|子空间|空间|秩|正交|投影|最小二乘|Gram|行列式|特征|对角|二次型|线性变换|换基|相似/.test(task);
  const query = encodeURIComponent(`${task} 高等数学 线性代数`);
  return [
    ...(calculus ? [{ label: '微积分主课', url: 'https://www.icourse163.org/course/SDU-190001' }] : []),
    ...(linear ? [{ label: '线代主课', url: 'https://www.icourse163.org/course/TONGJI-481001' }] : []),
    { label: '中文补充视频', url: `https://search.bilibili.com/all?keyword=${query}` },
  ];
}

function weekdayOf(dateText) {
  return '日一二三四五六'[new Date(`${dateText}T00:00:00`).getDay()];
}

function defaultTime(weekday) {
  if (weekday === '二') return '16:00';
  if (weekday === '三') return '14:10';
  return '10:10';
}

function parseMarkdown(text) {
  const entries = [];
  const yearMatch = text.match(/(?:日期范围|适用学期)[^\n]*?(20\d{2})/) || text.match(/(20\d{2})-\d{2}-\d{2}/);
  const defaultYear = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();
  let week = 0;

  text.split(/\r?\n/).forEach((line, lineIndex) => {
    const heading = line.match(/^##\s*第\s*(\d+)\s*周/);
    if (heading) week = Number(heading[1]);
    if (!/^\s*\|.*\|\s*$/.test(line) || /^\s*\|[\s:|-]+\|\s*$/.test(line)) return;

    const cells = line.trim().slice(1, -1).split('|').map((cell) => cell.trim());
    if (cells.some((cell) => /^(日期|星期|时间|任务与练习|学习内容)$/.test(cell))) return;

    let date;
    let weekday;
    let startTime;
    let course = '';
    let task = '';
    let linkText = '';

    if (/^20\d{2}-\d{2}-\d{2}$/.test(cells[0] || '')) {
      date = cells[0];
      weekday = (cells[1] || '').replace(/^周/, '') || weekdayOf(date);
      startTime = (cells[2] || '').match(/\d{2}:\d{2}/)?.[0] || defaultTime(weekday);
      course = cells[3] || '';
      task = cells[4] || course;
      linkText = cells.slice(5).join(' ');
    } else {
      const legacy = (cells[0] || '').match(/^周([一二三四五六日])\s+(\d{2})-(\d{2})$/);
      if (!legacy) return;
      weekday = legacy[1];
      date = `${defaultYear}-${legacy[2]}-${legacy[3]}`;
      startTime = defaultTime(weekday);
      task = cells[1] || '';
      linkText = cells.slice(2).join(' ');
    }

    if (!task || Number.isNaN(new Date(`${date}T00:00:00`).getTime())) return;
    const rowLinks = extractLinks(`${task} ${linkText}`);
    entries.push({
      id: `${date}-${lineIndex}`,
      date,
      weekday,
      startTime,
      week: week || 1,
      course: course.replace(/`/g, ''),
      task: task.replace(/`/g, '').trim(),
      links: rowLinks.length ? rowLinks : inferredLinks(task),
    });
  });

  return entries.sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
}

function parsePlanFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) throw new Error('文件不存在或已被移动');
  if (path.extname(filePath).toLowerCase() !== '.md') throw new Error('请选择 Markdown（.md）文件');
  const entries = parseMarkdown(fs.readFileSync(filePath, 'utf8'));
  if (!entries.length) throw new Error('未识别到课表行，请使用应用内 AI 提示词规定的表格格式');
  return entries;
}

module.exports = { isWebUrl, parseMarkdown, parsePlanFile };
