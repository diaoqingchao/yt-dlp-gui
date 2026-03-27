# Shadow yt-dlp

一个基于 Tauri 构建的 YouTube 视频下载工具，体积小巧，功能强大。

## 特性

- ✅ 小巧体积（约 15-30 MB，相比 Electron 版本的 400 MB）
- ✅ 支持下载单个视频、播放列表、频道
- ✅ 支持视频转码（MP4/M3U8）
- ✅ 内嵌 yt-dlp 和 FFmpeg，无需额外安装
- ✅ 中英双语界面
- ✅ 跨平台支持（macOS、Windows、Linux）

## 下载

从 [GitHub Actions](https://github.com/diaoqingchao/yt-dlp-gui/actions) 下载最新构建版本。

## 开发

### 环境要求

- Node.js 18+
- Rust 1.70+

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run tauri:dev
```

### 构建

```bash
# macOS
npm run tauri:build:mac

# Windows
npm run tauri:build:win

# Linux
npm run tauri:build:linux
```

## 技术栈

- **前端**: React + TypeScript + Tailwind CSS
- **后端**: Rust + Tauri
- **视频下载**: yt-dlp
- **视频转码**: FFmpeg

## 许可证

MIT
