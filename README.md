# daily-task-app

桌面「**每日任务**」小工具（Electron）：周视图日历、按日管理任务、状态（未开始 / 进行中 / 已完成）、备注与右键菜单；数据保存在本机 **JSON**，可最小化到**系统托盘**，支持**简洁模式**（仅看进行中任务）。

**源码仓库：** <https://github.com/AllenSL/daily-task-app>

---

## 功能概要

| 能力 | 说明 |
|------|------|
| 日历 | 按周切换，点选日期查看当天任务；小点表示当天完成度 |
| 任务 | 添加、编辑、删除、备注；状态可点击切换 |
| 排序 | **拖动任务**调整当日优先级；**已完成**自动排在当天列表**最下方**（简洁模式下不支持拖动） |
| 窗口 | 无边框圆角、置顶；标题栏可拖动；最小化到托盘而非退出（Windows） |
| 简洁模式 | 仅展示「进行中」任务，窗口可缩小 |
| 隐身 | 收缩为 **橙色高亮** 条（圆点 +「每日任务」+ **流光** 动画）；**左侧区域可拖动窗口**，右侧 **⤢ 展开** 或 **Esc** 恢复 |
| 数据 | `tasks.json` 存于系统用户目录（见下文） |

---

## 环境要求

- [Node.js](https://nodejs.org/)（建议 **LTS**，含 **npm**）
- **Windows 便携版**：在 **Windows** 上执行打包命令  
- **macOS 安装包**：在 **macOS** 上打包（或 CI 使用 `macos` 系统）

---

## 克隆与安装依赖

```bash
git clone https://github.com/AllenSL/daily-task-app.git
cd daily-task-app
npm install
```

若安装 `electron` 时出现 **EBUSY / 文件被占用**，请先关闭本应用、其它 Electron 窗口，以及可能锁定 `node_modules` 的软件后再执行 `npm install`。Windows 下可尝试项目里的 **`fix-electron.bat`** 修复不完整安装。

---

## 常用命令（npm scripts）

| 命令 | 说明 |
|------|------|
| `npm start` | 开发启动（内部为 `node run.cjs`） |
| `npm run pack` / `npm run pack:win` | Windows x64 **便携版** `.exe` |
| `npm run pack:mac` | macOS：当前机器架构，产出 **dmg + zip** |
| `npm run pack:mac:x64` | macOS：Intel（x64） |
| `npm run pack:mac:arm64` | macOS：Apple Silicon（arm64） |
| `npm run pack:mac:universal` | macOS：**通用二进制**（体积更大） |

---

## 一键启动脚本（可选）

不先开终端时，可用脚本自动进入项目目录；若无 `node_modules` 会先执行 `npm install`。

| 平台 | 文件 |
|------|------|
| **Windows** | **`启动每日任务-Windows.bat`** 或 **`start.bat`**（英文文件名，避免编码问题） |
| **macOS** | **`启动每日任务-Mac.command`**（双击会在「终端」中运行） |

**macOS 首次使用：**

1. 赋予可执行权限（一般只需一次）：`chmod +x 启动每日任务-Mac.command`
2. 若系统拦截：对脚本 **右键 → 打开**，或在 **系统设置 → 隐私与安全性** 中允许。
3. 若从压缩包解压后无法运行，可去掉隔离属性（路径改成你的项目目录）：  
   `xattr -dr com.apple.quarantine /path/to/daily-task-app`
4. 使用 **nvm** 安装 Node 时，`.command` 脚本会尝试加载 `~/.nvm/nvm.sh`。

---

## 一键打包脚本（点击完成构建）

| 平台 | 文件 | 说明 |
|------|------|------|
| **Windows** | **`一键打包-Windows.bat`** | 调用 `pack.bat` 生成便携版 `.exe`，结束后**暂停窗口**方便查看日志 |
| **macOS** | **`一键打包-Mac.command`** | 在 Mac 上双击运行；含镜像环境变量，执行 **`npm run pack:mac`**（dmg + zip），结束需按回车关闭终端 |

**macOS：** 首次若无法执行：`chmod +x 一键打包-Mac.command`（或与「一键启动」脚本相同的安全提示处理）。

---

## Windows 打包

在 **Windows** 本机、项目根目录执行。

### 推荐（国内网络）

双击 **`一键打包-Windows.bat`**，或直接执行 **`pack.bat`**（已配置 `npmmirror`，减少 electron-builder 依赖下载失败）。

### 手动

```bat
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
npm run pack
```

### 产物

- 目录：**`release/`**
- 文件：**`DailyTaskApp-<版本>-portable.exe`**（x64 便携版，单文件可复制运行）

### 说明

- `package.json` 中 **`build.win.signAndEditExecutable`** 为 `false`，避免部分网络环境无法从 GitHub 拉取签名相关工具；若需把图标写入 exe，可自行调整并配置镜像/网络。
- 打包前请关闭正在运行的本程序，避免占用 `node_modules\electron`。

---

## macOS 打包

在 **macOS** 上（**无法在 Windows 上可靠生成 `.dmg`**）：

- **图形界面**：双击 **`一键打包-Mac.command`**
- **命令行**：进入项目根目录后执行：

```bash
npm install
npm run pack:mac
# 或见上文「常用命令」选用 x64 / arm64 / universal
```

### 产物

- 目录：**`release/`**
- 文件：**`DailyTaskApp-<版本>-mac-<arch>.dmg`** 及对应 **`.zip`**（与 `package.json` 里 `build.mac.artifactName` 一致）

### 说明

- 未做 Apple **公证 / 开发者签名** 时，用户首次打开可能需在「隐私与安全性」中允许，或使用 **右键 → 打开**。
- 正式分发建议配置 Apple Developer 签名与公证（此处不展开）。

---

## 数据存储位置

任务文件均为 **`tasks.json`**，路径由 Electron **`app.getPath('userData')`** 决定（**无单独用户配置文件**；应用名来自 `package.json` 的 `name` / `build.productName`，会影响文件夹名称）。

| 场景 | Windows（常见） | macOS（常见） |
|------|-----------------|---------------|
| **`npm start` 开发** | `%APPDATA%\daily-task-app\tasks.json` | `~/Library/Application Support/daily-task-app/tasks.json` |
| **安装包 / 正式打包运行** | `%APPDATA%` 下以 **`每日任务`** 或 `daily-task-app` 命名的目录（以本机为准） | `~/Library/Application Support/每日任务/tasks.json`（与 `productName` 一致时） |

界面底部会显示当前本机的数据目录提示。**简洁模式**开关记在浏览器 **localStorage**，与 `tasks.json` 分开。

---

## 项目结构（主要文件）

```
daily-task-app/
├── main.js              # 主进程：窗口、托盘、IPC、读写 tasks.json
├── preload.js           # 预加载桥接
├── renderer.js          # 界面逻辑
├── index.html / styles.css
├── run.cjs              # 开发启动入口（调用 Electron）
├── package.json         # 依赖、electron-builder 配置（应用名、appId 等）
├── assets/app-icon.png  # 应用与托盘图标
├── scripts/trim-icon.py # 可选：图标去底、裁剪
├── pack.bat             # Windows 打包（含镜像）
├── 一键打包-Windows.bat / 一键打包-Mac.command  # 各平台一键打包
├── fix-electron.bat     # Windows：修复不完整 electron 安装
├── 启动每日任务-Windows.bat / 启动每日任务-Mac.command / start.bat
└── README.md
```

---

## 图标裁剪（可选）

去灰底、裁边并导出透明 PNG（需 Python + Pillow）：

```bash
python scripts/trim-icon.py
```

会先备份为 `assets/app-icon.png.bak`（若 `.gitignore` 中忽略了 `*.bak` 则不会提交）。

---

## 许可证

若需开源协议，请在仓库中自行补充 `LICENSE` 文件。
