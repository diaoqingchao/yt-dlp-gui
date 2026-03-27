#!/usr/bin/env node
/**
 * 下载 YT-DLP 和 FFmpeg 二进制文件（精简版）
 * 只下载必要的组件以减小应用体积
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const BINARIES_DIR = path.join(__dirname, '..', 'binaries');
const PLATFORM = process.platform;
const ARCH = process.arch;

// 确保目录存在
if (!fs.existsSync(BINARIES_DIR)) {
  fs.mkdirSync(BINARIES_DIR, { recursive: true });
}

// YT-DLP 下载配置
const YTDLP_VERSION = '2025.03.27';
const YTDLP_URLS = {
  darwin: {
    x64: `https://github.com/yt-dlp/yt-dlp/releases/download/${YTDLP_VERSION}/yt-dlp_macos`,
    arm64: `https://github.com/yt-dlp/yt-dlp/releases/download/${YTDLP_VERSION}/yt-dlp_macos_arm64`,
  },
  win32: {
    x64: `https://github.com/yt-dlp/yt-dlp/releases/download/${YTDLP_VERSION}/yt-dlp.exe`,
  },
  linux: {
    x64: `https://github.com/yt-dlp/yt-dlp/releases/download/${YTDLP_VERSION}/yt-dlp_linux`,
  },
};

// FFmpeg 静态构建下载链接 - 使用精简版
const FFMPEG_URLS = {
  darwin: {
    x64: 'https://github.com/eugeneware/ffmpeg-static/releases/download/b6.0/ffmpeg-darwin-x64',
    arm64: 'https://github.com/eugeneware/ffmpeg-static/releases/download/b6.0/ffmpeg-darwin-arm64',
  },
  win32: {
    x64: 'https://github.com/eugeneware/ffmpeg-static/releases/download/b6.0/ffmpeg-win32-x64',
  },
  linux: {
    x64: 'https://github.com/eugeneware/ffmpeg-static/releases/download/b6.0/ffmpeg-linux-x64',
  },
};

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`📥 下载: ${url.split('?')[0]}`);
    
    const file = fs.createWriteStream(dest);
    https.get(url, { redirect: 'follow' }, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`下载失败: HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        const stats = fs.statSync(dest);
        console.log(`✅ 下载完成: ${path.basename(dest)} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
        resolve();
      });
    }).on('error', (err) => {
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
  });
}

function makeExecutable(filePath) {
  if (PLATFORM !== 'win32') {
    fs.chmodSync(filePath, 0o755);
  }
}

async function downloadYtDlp() {
  console.log('\n📦 下载 YT-DLP...');
  
  const platformUrls = YTDLP_URLS[PLATFORM];
  if (!platformUrls) throw new Error(`不支持的平台: ${PLATFORM}`);
  
  const url = platformUrls[ARCH] || platformUrls.x64;
  if (!url) throw new Error(`不支持的架构: ${PLATFORM} ${ARCH}`);
  
  const filename = PLATFORM === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  const destPath = path.join(BINARIES_DIR, filename);
  
  if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
  
  await downloadFile(url, destPath);
  makeExecutable(destPath);
  
  try {
    const version = execSync(`"${destPath}" --version`, { encoding: 'utf8' }).trim();
    console.log(`✅ YT-DLP 版本: ${version}`);
  } catch (e) {
    console.warn('⚠️  无法验证 YT-DLP 版本');
  }
}

async function downloadFfmpeg() {
  console.log('\n📦 下载 FFmpeg（精简版）...');
  
  const platformUrls = FFMPEG_URLS[PLATFORM];
  if (!platformUrls) {
    console.log(`⚠️  跳过 FFmpeg: 不支持的平台 ${PLATFORM}`);
    return;
  }
  
  const url = platformUrls[ARCH] || platformUrls.x64;
  if (!url) {
    console.log(`⚠️  跳过 FFmpeg: 不支持的架构 ${PLATFORM} ${ARCH}`);
    return;
  }
  
  const ffmpegPath = path.join(BINARIES_DIR, PLATFORM === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
  
  try {
    if (fs.existsSync(ffmpegPath)) fs.unlinkSync(ffmpegPath);
    
    await downloadFile(url, ffmpegPath);
    makeExecutable(ffmpegPath);
    
    const version = execSync(`"${ffmpegPath}" -version`, { encoding: 'utf8' }).split('\n')[0];
    console.log(`✅ FFmpeg: ${version}`);
  } catch (e) {
    console.error('❌ FFmpeg 下载失败:', e.message);
  }
}

async function main() {
  console.log('🚀 开始下载二进制文件...');
  console.log(`平台: ${PLATFORM} ${ARCH}`);
  
  try {
    await downloadYtDlp();
    await downloadFfmpeg();
    
    console.log('\n✨ 下载完成！');
    
    const files = fs.readdirSync(BINARIES_DIR);
    let totalSize = 0;
    console.log('\n📋 已下载文件:');
    files.forEach(f => {
      const stats = fs.statSync(path.join(BINARIES_DIR, f));
      const size = stats.size / 1024 / 1024;
      totalSize += size;
      console.log(`   - ${f} (${size.toFixed(1)} MB)`);
    });
    console.log(`\n📦 总大小: ${totalSize.toFixed(1)} MB`);
    
  } catch (error) {
    console.error('\n❌ 下载失败:', error.message);
    process.exit(1);
  }
}

main();
