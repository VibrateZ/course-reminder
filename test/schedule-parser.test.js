const assert = require('node:assert/strict');
const { parseMarkdown } = require('../src/schedule-parser');

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
console.log('schedule-parser: all tests passed');
