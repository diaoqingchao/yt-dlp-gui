# 推送到 GitHub 指南

## 步骤 1：在 GitHub 上创建仓库

1. 访问 https://github.com/new
2. 仓库名称填写：`yt-dlp-gui`
3. 选择 **Public** 或 **Private**
4. 不要勾选 "Initialize this repository with a README"
5. 点击 **Create repository**

## 步骤 2：推送代码

创建仓库后，运行以下命令：

```bash
git remote remove origin 2>/dev/null
git remote add origin https://github.com/diaoqingchao/yt-dlp-gui.git
git push -u origin main
```

## 步骤 3：触发自动构建

推送成功后，GitHub Actions 会自动开始构建：

1. 访问 https://github.com/diaoqingchao/yt-dlp-gui/actions
2. 等待构建完成（约 5-10 分钟）
3. 下载对应平台的应用包

## 下载构建好的应用

构建完成后，在 Actions 页面点击最新的工作流运行记录，然后在页面底部找到 **Artifacts** 部分下载应用：

- `macos-app` - macOS 版本 (.dmg)
- `windows-app` - Windows 版本 (.exe)
- `linux-app` - Linux 版本 (.AppImage)

## 注意事项

- 首次推送可能需要输入 GitHub 用户名和个人访问令牌
- 如果启用了双因素认证，需要使用个人访问令牌代替密码
- 构建产物可以在 Actions 页面的 Artifacts 部分下载
