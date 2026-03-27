// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use tauri::{Manager, Runtime, State};
use tokio::sync::Mutex;

// 任务状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub url_or_file: String,
    pub task_type: String,
    pub status: String,
    pub progress: f64,
    pub file_name: Option<String>,
    pub options: Option<serde_json::Value>,
    pub error: Option<String>,
}

// 下载选项
#[derive(Debug, Clone, Deserialize)]
pub struct DownloadOptions {
    pub video: bool,
    pub audio: bool,
    pub subtitles: bool,
    pub thumbnail: bool,
    pub format: String,
    pub packaging: String,
    pub include_link_file: bool,
    pub bundle_per_video: bool,
}

// 转码选项
#[derive(Debug, Clone, Deserialize)]
pub struct TranscodeOptions {
    pub format: String,
    pub video_codec: String,
    pub audio_codec: String,
    pub resolution: String,
    pub video_bitrate: String,
}

// 二进制文件状态
#[derive(Debug, Clone, Serialize)]
pub struct BinaryStatus {
    pub yt_dlp: BinaryInfo,
    pub ffmpeg: BinaryInfo,
    pub is_bundled: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct BinaryInfo {
    pub exists: bool,
    pub version: Option<String>,
    pub path: String,
}

// 应用状态
pub struct AppState {
    pub download_path: Mutex<String>,
}

// 获取二进制文件路径 - 这是修复内置组件问题的关键
fn get_binary_path<R: Runtime>(app: &tauri::AppHandle<R>, binary_name: &str) -> PathBuf {
    // 首先检查 resources 目录（打包后的位置）
    if let Ok(resource_path) = app.path_resolver().resource_dir() {
        let binary_path = resource_path.join("binaries").join(binary_name);
        if binary_path.exists() {
            return binary_path;
        }
    }

    // 开发环境：检查项目根目录
    if let Ok(current_dir) = std::env::current_dir() {
        let binary_path = current_dir.join("binaries").join(binary_name);
        if binary_path.exists() {
            return binary_path;
        }
    }

    // 最后尝试从系统 PATH 中查找
    PathBuf::from(binary_name)
}

// 获取平台特定的二进制文件名
fn get_ytdlp_binary_name() -> &'static str {
    #[cfg(target_os = "windows")]
    return "yt-dlp.exe";
    #[cfg(not(target_os = "windows"))]
    return "yt-dlp";
}

fn get_ffmpeg_binary_name() -> &'static str {
    #[cfg(target_os = "windows")]
    return "ffmpeg.exe";
    #[cfg(not(target_os = "windows"))]
    return "ffmpeg";
}

// 验证二进制文件
#[tauri::command]
async fn get_binary_status<R: Runtime>(app: tauri::AppHandle<R>) -> Result<BinaryStatus, String> {
    let yt_dlp_path = get_binary_path(&app, get_ytdlp_binary_name());
    let ffmpeg_path = get_binary_path(&app, get_ffmpeg_binary_name());

    let yt_dlp_exists = yt_dlp_path.exists();
    let ffmpeg_exists = ffmpeg_path.exists();

    // 获取版本信息
    let yt_dlp_version = if yt_dlp_exists {
        Command::new(&yt_dlp_path)
            .arg("--version")
            .output()
            .ok()
            .and_then(|output| String::from_utf8(output.stdout).ok())
            .map(|s| s.trim().to_string())
    } else {
        None
    };

    let ffmpeg_version = if ffmpeg_exists {
        Command::new(&ffmpeg_path)
            .arg("-version")
            .output()
            .ok()
            .and_then(|output| String::from_utf8(output.stdout).ok())
            .map(|s| s.lines().next().unwrap_or("").to_string())
    } else {
        None
    };

    Ok(BinaryStatus {
        yt_dlp: BinaryInfo {
            exists: yt_dlp_exists,
            version: yt_dlp_version,
            path: yt_dlp_path.to_string_lossy().to_string(),
        },
        ffmpeg: BinaryInfo {
            exists: ffmpeg_exists,
            version: ffmpeg_version,
            path: ffmpeg_path.to_string_lossy().to_string(),
        },
        is_bundled: yt_dlp_exists || ffmpeg_exists,
    })
}

// 选择文件夹
#[tauri::command]
async fn select_folder<R: Runtime>(app: tauri::AppHandle<R>) -> Result<Option<String>, String> {
    let dialog = tauri::api::dialog::FileDialogBuilder::new();
    let (tx, rx) = tokio::sync::oneshot::channel();

    dialog.pick_folder(move |path| {
        let _ = tx.send(path.map(|p| p.to_string_lossy().to_string()));
    });

    rx.await
        .map_err(|e| e.to_string())
        .map(|path| Ok(path))
        .unwrap_or_else(|e| Err(e))
}

// 打开文件夹
#[tauri::command]
async fn open_folder(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

// 开始下载
#[tauri::command]
async fn start_download<R: Runtime>(
    app: tauri::AppHandle<R>,
    task: Task,
    download_path: String,
) -> Result<(), String> {
    let yt_dlp_path = get_binary_path(&app, get_ytdlp_binary_name());

    if !yt_dlp_path.exists() {
        return Err("yt-dlp not found. Please reinstall the application.".to_string());
    }

    let mut args = vec![
        "-P".to_string(),
        download_path,
        "-o".to_string(),
        "%(title)s.%(ext)s".to_string(),
    ];

    // 解析选项
    if let Some(options) = &task.options {
        let opts: DownloadOptions = serde_json::from_value(options.clone())
            .map_err(|e| e.to_string())?;

        if opts.video && opts.audio {
            args.push("-f".to_string());
            args.push("bestvideo+bestaudio/best".to_string());
            args.push("--merge-output-format".to_string());
            args.push(opts.format.clone());

            // 使用内置 FFmpeg
            let ffmpeg_path = get_binary_path(&app, get_ffmpeg_binary_name());
            if ffmpeg_path.exists() {
                args.push("--ffmpeg-location".to_string());
                args.push(ffmpeg_path.to_string_lossy().to_string());
            }
        } else if opts.video {
            args.push("-f".to_string());
            args.push("bestvideo".to_string());
        } else if opts.audio {
            args.push("-f".to_string());
            args.push("bestaudio".to_string());
            args.push("--extract-audio".to_string());
            args.push("--audio-format".to_string());
            args.push("mp3".to_string());
        }

        if opts.subtitles {
            args.push("--write-subs".to_string());
            args.push("--write-auto-subs".to_string());
            args.push("--sub-langs".to_string());
            args.push("all".to_string());
        }

        if opts.thumbnail {
            args.push("--write-thumbnail".to_string());
        }
    }

    args.push(task.url_or_file);

    println!("Starting download: {:?} {:?}", yt_dlp_path, args);

    // 启动下载进程
    let task_id = task.id.clone();
    let app_handle = app.clone();

    tokio::spawn(async move {
        let mut child = Command::new(&yt_dlp_path)
            .args(&args)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .expect("Failed to spawn yt-dlp");

        let stdout = child.stdout.take().expect("Failed to capture stdout");
        let reader = std::io::BufReader::new(stdout);
        use std::io::BufRead;

        let mut last_progress = 0.0;

        for line in reader.lines() {
            if let Ok(line) = line {
                println!("[yt-dlp] {}", line);

                // 解析进度
                if let Some(caps) = regex::Regex::new(r"\[download\]\s+([\d\.]+)%")
                    .unwrap()
                    .captures(&line)
                {
                    if let Some(percent) = caps.get(1) {
                        if let Ok(progress) = percent.as_str().parse::<f64>() {
                            last_progress = progress;
                            let _ = app_handle.emit_all(
                                "task-progress",
                                serde_json::json!({
                                    "task_id": task_id,
                                    "progress": progress,
                                    "status": "downloading"
                                }),
                            );
                        }
                    }
                }
            }
        }

        let status = child.wait().expect("Failed to wait on child");

        let final_status = if status.success() {
            "completed"
        } else {
            "error"
        };

        let _ = app_handle.emit_all(
            "task-progress",
            serde_json::json!({
                "task_id": task_id,
                "progress": if status.success() { 100.0 } else { last_progress },
                "status": final_status
            }),
        );
    });

    Ok(())
}

// 开始转码
#[tauri::command]
async fn start_transcode<R: Runtime>(
    app: tauri::AppHandle<R>,
    task: Task,
    output_path: String,
) -> Result<(), String> {
    let ffmpeg_path = get_binary_path(&app, get_ffmpeg_binary_name());

    if !ffmpeg_path.exists() {
        return Err("FFmpeg not found. Please reinstall the application.".to_string());
    }

    let options: TranscodeOptions = if let Some(opts) = &task.options {
        serde_json::from_value(opts.clone()).map_err(|e| e.to_string())?
    } else {
        return Err("No transcode options provided".to_string());
    };

    let input_file = &task.url_or_file;
    let output_file = format!(
        "{}/{}.{}",
        output_path,
        std::path::Path::new(input_file)
            .file_stem()
            .unwrap_or_default()
            .to_string_lossy(),
        options.format
    );

    let mut args = vec!["-i".to_string(), input_file.clone()];

    // 视频编码器
    if options.video_codec == "copy" {
        args.push("-c:v".to_string());
        args.push("copy".to_string());
    } else {
        args.push("-c:v".to_string());
        args.push(options.video_codec.clone());

        // 分辨率
        if options.resolution != "original" {
            let resolution = match options.resolution.as_str() {
                "1080p" => "1920x1080",
                "720p" => "1280x720",
                "480p" => "854x480",
                _ => "1920x1080",
            };
            args.push("-vf".to_string());
            args.push(format!("scale={}", resolution));
        }

        // 码率
        if options.video_bitrate != "auto" {
            args.push("-b:v".to_string());
            args.push(options.video_bitrate.clone());
        }
    }

    // 音频编码器
    if options.audio_codec == "copy" {
        args.push("-c:a".to_string());
        args.push("copy".to_string());
    } else {
        args.push("-c:a".to_string());
        args.push(options.audio_codec.clone());
    }

    args.push("-y".to_string());
    args.push(output_file);

    println!("Starting transcode: {:?} {:?}", ffmpeg_path, args);

    let task_id = task.id.clone();
    let app_handle = app.clone();

    tokio::spawn(async move {
        let output = Command::new(&ffmpeg_path)
            .args(&args)
            .output()
            .expect("Failed to spawn ffmpeg");

        let status = if output.status.success() {
            "completed"
        } else {
            eprintln!("FFmpeg stderr: {}", String::from_utf8_lossy(&output.stderr));
            "error"
        };

        let _ = app_handle.emit_all(
            "task-progress",
            serde_json::json!({
                "task_id": task_id,
                "progress": if output.status.success() { 100.0 } else { 0.0 },
                "status": status
            }),
        );
    });

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            download_path: Mutex::new("~/Downloads/ShadowPro".to_string()),
        })
        .invoke_handler(tauri::generate_handler![
            get_binary_status,
            select_folder,
            open_folder,
            start_download,
            start_transcode,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
