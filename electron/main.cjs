const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// 获取内嵌二进制文件的路径
function getBinaryPath(binaryName) {
  const isDev = process.env.NODE_ENV === 'development';
  
  // 开发环境：使用项目根目录的 binaries 文件夹
  // 生产环境：使用 extraResources 中的 binaries 文件夹
  const basePath = isDev 
    ? path.join(__dirname, '..', 'binaries')
    : path.join(process.resourcesPath, 'binaries');
  
  const binaryPath = path.join(basePath, binaryName);
  
  // 检查文件是否存在
  if (fs.existsSync(binaryPath)) {
    return binaryPath;
  }
  
  // 如果内嵌二进制文件不存在，尝试使用系统 PATH 中的
  console.warn(`⚠️  内嵌二进制文件未找到: ${binaryPath}，尝试使用系统 PATH`);
  return binaryName;
}

// 获取 yt-dlp 路径
function getYtDlpPath() {
  const platform = process.platform;
  const binaryName = platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  return getBinaryPath(binaryName);
}

// 获取 ffmpeg 路径
function getFfmpegPath() {
  const platform = process.platform;
  const binaryName = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  return getBinaryPath(binaryName);
}

// 验证二进制文件
function verifyBinaries() {
  const ytDlpPath = getYtDlpPath();
  const ffmpegPath = getFfmpegPath();
  
  const results = {
    ytDlp: { exists: false, version: null, path: ytDlpPath },
    ffmpeg: { exists: false, version: null, path: ffmpegPath },
    isBundled: false
  };
  
  // 检查 yt-dlp
  if (fs.existsSync(ytDlpPath)) {
    results.ytDlp.exists = true;
    results.isBundled = true;
    try {
      const output = require('child_process').execSync(`"${ytDlpPath}" --version`, { encoding: 'utf8' });
      results.ytDlp.version = output.trim();
    } catch (e) {
      results.ytDlp.version = 'unknown';
    }
  }
  
  // 检查 ffmpeg
  if (fs.existsSync(ffmpegPath)) {
    results.ffmpeg.exists = true;
    results.isBundled = true;
    try {
      const output = require('child_process').execSync(`"${ffmpegPath}" -version`, { encoding: 'utf8' });
      results.ffmpeg.version = output.split('\n')[0];
    } catch (e) {
      results.ffmpeg.version = 'unknown';
    }
  }
  
  return results;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Shadow yt-dlp",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
  
  // 在开发模式下打开开发者工具
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
  
  // 验证二进制文件并打印日志
  const binaryStatus = verifyBinaries();
  console.log('📦 二进制文件状态:', JSON.stringify(binaryStatus, null, 2));

  // 处理获取二进制文件状态的请求
  ipcMain.handle('get-binary-status', () => {
    return verifyBinaries();
  });

  // Handle folder selection
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  // Handle opening folder
  ipcMain.on('open-folder', (event, folderPath) => {
    shell.openPath(folderPath);
  });

  // Handle real download task
  ipcMain.on('start-download', (event, task, downloadPath) => {
    const ytDlpPath = getYtDlpPath();
    
    // 检查 yt-dlp 是否存在
    if (!fs.existsSync(ytDlpPath)) {
      event.sender.send('task-progress', task.id, 0, 'error');
      dialog.showErrorBox('错误', 'yt-dlp 未找到。请重新安装应用或手动安装 yt-dlp。');
      return;
    }
    
    const args = ['-P', downloadPath, '-o', '%(title)s.%(ext)s'];

    // Format selection based on UI options
    if (task.options.video && task.options.audio) {
      args.push('-f', 'bestvideo+bestaudio/best');
      args.push('--merge-output-format', 'mp4');
      
      // 使用内嵌的 FFmpeg 进行合并
      const ffmpegPath = getFfmpegPath();
      if (fs.existsSync(ffmpegPath)) {
        args.push('--ffmpeg-location', ffmpegPath);
      }
    } else if (task.options.video) {
      args.push('-f', 'bestvideo');
    } else if (task.options.audio) {
      args.push('-f', 'bestaudio', '--extract-audio', '--audio-format', 'mp3');
    }

    if (task.options.subtitles) {
      args.push('--write-subs', '--write-auto-subs', '--sub-langs', 'all');
    }
    
    if (task.options.thumbnail) {
      args.push('--write-thumbnail');
    }

    args.push(task.urlOrFile);

    console.log(`🚀 启动下载: ${ytDlpPath} ${args.join(' ')}`);

    // Spawn yt-dlp process
    const ytdlp = spawn(ytDlpPath, args);
    
    let lastProgress = 0;

    ytdlp.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[yt-dlp stdout]: ${output}`);
      
      // Parse progress: [download]  50.0% of 100MiB at 1.5MiB/s ETA 00:30
      const progressMatch = output.match(/\[download\]\s+([\d\.]+)%/);
      if (progressMatch) {
        const percent = parseFloat(progressMatch[1]);
        lastProgress = percent;
        event.sender.send('task-progress', task.id, percent, 'downloading');
      }
      
      // 检查是否已经开始下载（解析阶段）
      if (output.includes('[youtube]') || output.includes('[info]')) {
        event.sender.send('task-progress', task.id, lastProgress || 5, 'downloading');
      }
    });

    ytdlp.stderr.on('data', (data) => {
      const output = data.toString();
      console.error(`[yt-dlp stderr]: ${output}`);
      
      // 某些信息输出到 stderr，不一定是错误
      if (output.includes('ERROR')) {
        event.sender.send('task-progress', task.id, lastProgress, 'error');
      }
    });

    ytdlp.on('close', (code) => {
      console.log(`✅ yt-dlp 进程退出，代码: ${code}`);
      if (code === 0) {
        event.sender.send('task-progress', task.id, 100, 'completed');
      } else {
        event.sender.send('task-progress', task.id, lastProgress, 'error');
      }
    });
    
    ytdlp.on('error', (error) => {
      console.error('❌ yt-dlp 进程错误:', error);
      event.sender.send('task-progress', task.id, 0, 'error');
      dialog.showErrorBox('下载错误', `启动 yt-dlp 失败: ${error.message}`);
    });
  });
  
  // Handle transcode task
  ipcMain.on('start-transcode', (event, task, outputPath) => {
    const ffmpegPath = getFfmpegPath();
    
    // 检查 ffmpeg 是否存在
    if (!fs.existsSync(ffmpegPath)) {
      event.sender.send('task-progress', task.id, 0, 'error');
      dialog.showErrorBox('错误', 'FFmpeg 未找到。请重新安装应用或手动安装 FFmpeg。');
      return;
    }
    
    const options = task.options;
    const inputFile = task.urlOrFile;
    const outputFile = path.join(outputPath, `${path.basename(inputFile, path.extname(inputFile))}.${options.format}`);
    
    const args = ['-i', inputFile];
    
    // 视频编码器
    if (options.videoCodec === 'copy') {
      args.push('-c:v', 'copy');
    } else {
      args.push('-c:v', options.videoCodec);
      
      // 分辨率
      if (options.resolution !== 'original') {
        const resolutionMap = {
          '1080p': '1920x1080',
          '720p': '1280x720',
          '480p': '854x480'
        };
        args.push('-vf', `scale=${resolutionMap[options.resolution]}`);
      }
      
      // 码率
      if (options.videoBitrate !== 'auto') {
        args.push('-b:v', options.videoBitrate);
      }
    }
    
    // 音频编码器
    if (options.audioCodec === 'copy') {
      args.push('-c:a', 'copy');
    } else {
      args.push('-c:a', options.audioCodec);
    }
    
    args.push('-y', outputFile);
    
    console.log(`🚀 启动转码: ${ffmpegPath} ${args.join(' ')}`);
    
    const ffmpeg = spawn(ffmpegPath, args);
    
    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString();
      
      // 解析进度: time=00:00:05.00
      const timeMatch = output.match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (timeMatch) {
        // 这里简化处理，实际应该获取视频总时长计算百分比
        event.sender.send('task-progress', task.id, 50, 'transcoding');
      }
    });
    
    ffmpeg.on('close', (code) => {
      console.log(`✅ FFmpeg 进程退出，代码: ${code}`);
      if (code === 0) {
        event.sender.send('task-progress', task.id, 100, 'completed');
      } else {
        event.sender.send('task-progress', task.id, 0, 'error');
      }
    });
    
    ffmpeg.on('error', (error) => {
      console.error('❌ FFmpeg 进程错误:', error);
      event.sender.send('task-progress', task.id, 0, 'error');
      dialog.showErrorBox('转码错误', `启动 FFmpeg 失败: ${error.message}`);
    });
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
