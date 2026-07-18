# 墨弈 · 在线五子棋

简洁优雅的在线双人五子棋对弈网站。一方创建房间，另一方输入房间号加入，实时落子对战。

## 功能

- 创建 / 加入房间（6 位房间号）
- 15×15 标准棋盘，黑棋先行
- WebSocket 实时同步落子
- 五连判胜、棋盘满盘平局
- 对手断线提示与再战申请
- 桌面与移动端自适应

## 快速开始

```bash
npm install
npm start
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

开发模式（自动重启）：

```bash
npm run dev
```

运行单元测试：

```bash
npm test
```

## 技术栈

- Node.js + Express
- Socket.IO 实时通信
- Canvas 棋盘渲染
