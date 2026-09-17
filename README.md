# Course Reminder / 课程提醒

一个面向 Windows 的 Electron 学习课表提醒器。选择本地 Markdown 课表后，应用会校验并记住文件路径，在课程开始时发送系统通知，并使用内置 Chromium 打开课程资料。

## 功能

- 通过系统文件选择器导入 `.md` 课表，选择结果跨重启保存。
- 同时兼容标准 AI 课表格式和早期的 `周一 09-14` 格式。
- 导入前校验文件；文件丢失或格式错误时回退到内置示例并显示原因。
- 按每行填写的开始时间发送 Windows 通知，每 30 秒检查一次。
- 在 Electron 内置 Chromium 中打开课表里的 `http/https` 教学链接。
- 应用内提供可复制的“AI 课表生成提示词”。

## 课表格式

推荐使用以下格式。完整要求见 [AI课表生成提示词.md](AI课表生成提示词.md)，可用文件见 [示例课表.md](examples/示例课表.md)。

```markdown
| 日期 | 星期 | 时间 | 课程 | 学习内容 | 资源链接 |
|---|---|---|---|---|---|
| 2026-09-21 | 周一 | 10:10 | 微积分 | 连续性练习 6 题 | [课程](https://example.com) |
```

日期使用 `YYYY-MM-DD`，时间使用 `HH:mm`。每行可放多个标准 Markdown 链接；应用只接受 `http/https` 地址。

## 本地运行

需要 Node.js 20 或更高版本。

```powershell
npm install
npm test
npm start
```

## 构建 Windows EXE

```powershell
npm run package
```

便携版输出到 `release/课程提醒 1.1.0.exe`。构建结果、依赖目录和日志不会提交到 Git。

## 数据位置

应用只保存所选课表的本地路径，不上传课表内容。设置保存在 Electron 的 `userData/settings.json`。如果文件被移动，可点击“选择课表”重新选择。
