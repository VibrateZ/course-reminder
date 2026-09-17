const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseMarkdown } = require('../src/schedule-parser');
const { nextStudyEntry } = require('../src/study-selection');

const standard = `
## 第 3 周
| 日期 | 星期 | 时间 | 课程 | 学习内容 | 资源链接 |
|---|---|---|---|---|---|
| 2026-09-21 | 周一 | 10:10 | 微积分 | 连续性练习 6 题 | [课程](https://example.com/calculus) |
`;
const parsedStandard = parseMarkdown(standard);
assert.equal(parsedStandard.length, 1);
assert.equal(parsedStandard[0].startTime, '10:10');
assert.equal(parsedStandard[0].course, '微积分');
assert.equal(parsedStandard[0].links[0].url, 'https://example.com/calculus');

const legacy = `
日期范围：2026-09-14 至 2026-12-25
## 第2周（09-14至09-18）
| 日期 | 任务与练习 | 当日验收题 |
|---|---|---|
| 周二 09-15 | 矩阵与方程组 | 完成 4 题 |
`;
const parsedLegacy = parseMarkdown(legacy);
assert.equal(parsedLegacy.length, 1);
assert.equal(parsedLegacy[0].date, '2026-09-15');
assert.equal(parsedLegacy[0].startTime, '16:00');
assert.ok(parsedLegacy[0].links.length > 0);

assert.equal(parseMarkdown('# 没有课表').length, 0);
assert.equal(parseMarkdown('| 日期 | 星期 |\n|---|---|').length, 0);

const studySchedule = [
  { id: 'past', date: '2026-09-17', startTime: '08:00', links: [{ url: 'https://example.com/past' }] },
  { id: 'later', date: '2026-09-18', startTime: '14:00', links: [{ url: 'https://example.com/later' }] },
  { id: 'next', date: '2026-09-18', startTime: '10:00', links: [{ url: 'https://example.com/next' }] },
  { id: 'no-link', date: '2026-09-18', startTime: '09:00', links: [] },
];
assert.equal(nextStudyEntry(studySchedule, new Date('2026-09-17T12:00:00')).id, 'next');
assert.equal(nextStudyEntry(studySchedule, new Date('2026-09-18T10:00:00')).id, 'next');
assert.equal(nextStudyEntry(studySchedule, new Date('2026-09-19T00:00:00')), null);
assert.equal(nextStudyEntry([], new Date('2026-09-17T12:00:00')), null);
const styles = fs.readFileSync(path.join(__dirname, '..', 'src', 'style.css'), 'utf8');
assert.match(styles, /\[hidden]\s*\{\s*display:\s*none\s*!important;/, '隐藏视图不能继续占用布局空间');
console.log('schedule-parser: all tests passed');
