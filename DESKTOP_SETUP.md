# yt-dlp Desktop GUI - Local Setup Guide (Bundled Edition)

This project is a React-based frontend designed to be packaged as a native desktop application using **Electron**. 

To provide the best user experience, we will **bundle `yt-dlp` and `ffmpeg` directly into the app**. This means your users will NOT need to install anything themselves; they just download your app and it works out of the box.

Follow these steps to package and run this app locally.

## Step 1: Install Dependencies

In the root of this project, run:

```bash
npm install --save-dev electron concurrently wait-on electron-builder
npm install ffmpeg-static
```
*(Note: `ffmpeg-static` automatically downloads the correct FFmpeg binary for your OS and provides its path).*

## Step 2: Download the yt-dlp Binary

We need to download the standalone `yt-dlp` executable and place it in a `bin/` folder so Electron can bundle it.

1. Create a folder named `bin` in the root of your project.
2. Download the latest `yt-dlp` executable for your operating system from the [official releases page](https://github.com/yt-dlp/yt-dlp/releases/latest):
   - **Windows**: Download `yt-dlp.exe` and place it in `bin/`
   - **Mac**: Download `yt-dlp_macos` and place it in `bin/yt-dlp` (make sure to run `chmod +x bin/yt-dlp` to make it executable).

## Step 3: Create Electron Backend Files

Create a file named `electron-main.js` in the root of the project. This script automatically resolves the paths to the bundled `yt-dlp` and `ffmpeg` binaries:

```javascript
// electron-main.js
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// 1. Resolve FFmpeg path (provided by ffmpeg-static)
// In production (asar), we need to replace 'app.asar' with 'app.asar.unpacked' 
// because binaries cannot be executed directly from inside an asar archive.
let ffmpegPath = require('ffmpeg-static');
if (ffmpegPath.includes('app.asar')) {
  ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked');
}

// 2. Resolve yt-dlp path (from our bin/ folder)
const isDev = !app.isPackaged;
const ytdlpExecutable = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
const ytdlpPath = isDev
  ? path.join(__dirname, 'bin', ytdlpExecutable)
  : path.join(process.resourcesPath, 'bin', ytdlpExecutable);

// Ensure yt-dlp is executable on Mac/Linux
if (process.platform !== 'win32' && fs.existsSync(ytdlpPath)) {
  fs.chmodSync(ytdlpPath, '755');
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For simplicity in this example.
    },
    titleBarStyle: 'hiddenInset', // Makes it look native on Mac
  });

  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, 'dist/index.html')}`;
  mainWindow.loadURL(startUrl);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// --- IPC Handlers for yt-dlp and ffmpeg ---

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.on('open-folder', (event, folderPath) => {
  shell.openPath(folderPath);
});

ipcMain.on('start-download', (event, { id, url, options }) => {
  const args = [];
  
  // Point yt-dlp to our bundled ffmpeg
  args.push('--ffmpeg-location', ffmpegPath);
  
  if (options.format === 'mp4') args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best');
  if (options.subtitles) args.push('--write-subs');
  if (options.thumbnail) args.push('--write-thumbnail');
  
  let outputTemplate = '%(title)s.%(ext)s';
  if (options.packaging === 'folder') {
    outputTemplate = `%(title)s/%(title)s.%(ext)s`;
  }
  args.push('-o', outputTemplate);
  args.push(url);

  console.log(`Running: ${ytdlpPath} ${args.join(' ')}`);
  const ytdlp = spawn(ytdlpPath, args);

  ytdlp.stdout.on('data', (data) => {
    const output = data.toString();
    const progressMatch = output.match(/\[download\]\s+([\d.]+)%/);
    if (progressMatch) {
      event.reply('task-progress', { id, progress: parseFloat(progressMatch[1]), status: 'downloading' });
    }
  });

  ytdlp.stderr.on('data', (data) => {
    console.error(`yt-dlp log: ${data}`);
  });

  ytdlp.on('close', (code) => {
    if (code === 0) {
      event.reply('task-progress', { id, progress: 100, status: 'completed' });
    } else {
      event.reply('task-progress', { id, progress: 0, status: 'error', error: `Exited with code ${code}` });
    }
  });
});

ipcMain.on('start-transcode', (event, { id, file, options }) => {
  const format = options.format || 'mp4';
  const outputFile = `${file}_converted.${format}`;
  const args = ['-y', '-i', file]; // -y to overwrite
  
  // Apply advanced options
  if (options.videoCodec && options.videoCodec !== 'copy') {
    args.push('-c:v', options.videoCodec);
    
    // Resolution and Bitrate can ONLY be applied if we are re-encoding (not copying)
    if (options.videoBitrate && options.videoBitrate !== 'auto') {
      args.push('-b:v', options.videoBitrate);
    }
    if (options.resolution && options.resolution !== 'original') {
      const heights = { '1080p': 1080, '720p': 720, '480p': 480 };
      args.push('-vf', `scale=-2:${heights[options.resolution]}`);
    }
  } else if (options.videoCodec === 'copy') {
    args.push('-c:v', 'copy');
    // Note: We explicitly ignore resolution and bitrate here to prevent FFmpeg crashes
  }

  if (options.audioCodec && options.audioCodec !== 'copy') {
    args.push('-c:a', options.audioCodec);
  } else if (options.audioCodec === 'copy') {
    args.push('-c:a', 'copy');
  }

  // Format specific arguments
  if (format === 'm3u8') {
    args.push('-start_number', '0', '-hls_time', '10', '-hls_list_size', '0', '-f', 'hls');
  }
  
  args.push(outputFile);

  console.log(`Running: ${ffmpegPath} ${args.join(' ')}`);
  const ffmpeg = spawn(ffmpegPath, args);

  ffmpeg.on('close', (code) => {
    if (code === 0) {
      event.reply('task-progress', { id, progress: 100, status: 'completed' });
    } else {
      event.reply('task-progress', { id, progress: 0, status: 'error', error: `FFmpeg exited with code ${code}` });
    }
  });
});
```

## Step 4: Configure package.json for Bundling

Update your `package.json` to include the `bin` folder and unpack `ffmpeg-static` during the build process.

Add these fields to your `package.json`:

```json
{
  "main": "electron-main.js",
  "scripts": {
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:3000 && cross-env ELECTRON_START_URL=http://localhost:3000 electron .\"",
    "electron:build": "npm run build && electron-builder"
  },
  "build": {
    "appId": "com.shadowpro.ytdlpgui",
    "productName": "ShadowPro Downloader",
    "directories": {
      "output": "release"
    },
    "extraResources": [
      {
        "from": "bin",
        "to": "bin",
        "filter": ["**/*"]
      }
    ],
    "asarUnpack": [
      "node_modules/ffmpeg-static/**/*"
    ],
    "mac": {
      "target": "dmg"
    },
    "win": {
      "target": "nsis"
    }
  }
}
```

## Step 5: Run and Package

**To test locally:**
```bash
npm run electron:dev
```

**To package into a standalone `.exe` or `.dmg`:**
```bash
npm run electron:build
```

The final installer will be located in the `release/` folder. When users install it, `yt-dlp` and `ffmpeg` will be secretly bundled inside the app's resources folder, and the app will use them automatically!
