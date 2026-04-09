# daily-task-app

桌面「每日任务」小工具：周视图日历、按日任务、状态切换、本地 JSON 存储（Electron）。

## 环境要求

- [Node.js](https://nodejs.org/)（建议 LTS，含 npm）
- **Windows 便携版**：在 **Windows** 上打包  
- **macOS 安装包**：必须在 **macOS** 上打包（或 CI 使用 `macos` 系统）

## 安装依赖

```bash
cd desktop-daily-tasks
npm install
```

若 `electron` 安装报 **EBUSY / 文件被占用**，请先关闭本应用、其它 Electron 窗口及可能占用 `node_modules` 的软件后再执行 `npm install`。

## 开发运行

```bash
npm start
```

（内部为 `node run.cjs` 启动 Electron。）

### 一键启动脚本（可选）

- **Windows**：双击 **`启动每日任务-Windows.bat`**（或英文 **`start.bat`**），会自动 `cd` 到脚本所在目录；若无 `node_modules` 会先执行 `npm install`，再 `npm start`。
- **macOS**：双击 **`启动每日任务-Mac.command`**，会在「终端」里执行同样逻辑（需本机已装 Node.js；若用 **nvm** 安装，脚本会尝试加载 `~/.nvm/nvm.sh`）。

**macOS 首次使用注意：**

1. 在终端执行一次赋予可执行权限（只需一次）：
   ```bash
   chmod +x 启动每日任务-Mac.command
   ```
2. 若提示无法打开：在脚本上 **右键 → 打开**，或在 **系统设置 → 隐私与安全性** 里选择仍要打开。
3. 从网络下载的压缩包可能带「隔离」属性，若双击无反应可执行：  
   `xattr -dr com.apple.quarantine /path/to/daily-task-app`（把路径换成你的项目目录）。

---

## Windows 打包

在 **Windows** 本机执行。

### 方式一（推荐，国内网络）

项目根目录双击或命令行执行 **`pack.bat`**（已设置 `npmmirror` 镜像，减少 electron-builder 下载失败）。

### 方式二

```bat
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
npm run pack
```

### 产物

- 目录：`release/`
- 文件：`DailyTaskApp-<版本>-portable.exe`（x64 便携版，单文件可拷贝运行）

### 说明

- 配置里关闭了 `signAndEditExecutable`，避免在部分网络环境下从 GitHub 拉取签名工具失败；若需安装包图标写入 exe，可自行改 `package.json` 的 `build.win` 并配置网络/镜像。
- 打包前请关闭正在运行的本程序，避免占用 `node_modules\electron` 导致失败。

---

## macOS 打包

在 **macOS** 终端进入项目目录后执行（无法在 Windows 上可靠生成 `.dmg`）。

```bash
npm install
```

按需选择：

| 命令 | 说明 |
|------|------|
| `npm run pack:mac` | 当前 Mac 的 CPU 架构，生成 **dmg + zip** |
| `npm run pack:mac:x64` | Intel（x64） |
| `npm run pack:mac:arm64` | Apple Silicon（arm64） |
| `npm run pack:mac:universal` | 通用二进制（体积更大，Intel + Apple Silicon 各一份合并） |

### 产物

- 目录：`release/`
- 文件：`DailyTaskApp-<版本>-mac-<arch>.dmg` 与同名的 `.zip`（具体以 `package.json` 中 `build.mac.artifactName` 为准）

### 说明

- 未做 Apple 公证/开发者签名时，用户首次打开可能需在「系统设置 → 隐私与安全性」中允许，或使用右键「打开」。
- 若需上架或降低安全提示，需配置 Apple Developer 签名与公证（此处不展开）。

---

## 数据存储位置

应用将任务数据写入系统用户目录下的 `tasks.json`（由 Electron `userData` 决定），例如 Windows 上常见为：

`%APPDATA%\daily-task-app\`（若曾用旧包名，目录名可能不同，以本机为准）。

---

## 图标裁剪（可选）

源图标去灰底、裁边脚本：

```bash
python scripts/trim-icon.py
```

（需本机已安装 Python 与 Pillow；会先备份为 `assets/app-icon.png.bak`。）

---

## 仓库

<https://github.com/AllenSL/daily-task-app>
