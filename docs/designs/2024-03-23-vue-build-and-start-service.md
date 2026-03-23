# 功能: 新增 vue 打包与静态资源服务启动功能

**日期**: 2024-03-23
**状态**: 计划中
**相关命令**: `vue` 命令
**业务代码位置**: `packages/cli/src/business/vue`

## 背景 / Context

目前用户需要快速打包不同版本的 Vue 项目，并在打包完成后启动静态资源服务。Vue 项目存在 Node.js 版本差异：旧版（存在 `vue.config.js`）需要 Node.js v14 环境，而新版支持 Node.js v20。
由于命令行默认在 Node.js v20 下运行，当遇到旧版 Vue 项目时需要自动通过 `nvm` 切换环境。
此外，用户还需要能够直接在 VSCode 中右键点击 `dist` 目录，通过调用服务端接口直接启动该静态资源服务。

## 需求

-   **CLI 命令扩展**: 通过 `mycli vue --start <dist_path>` (或同等参数) 打包 Vue 项目并启动静态服务。
-   **智能环境切换**: 启动打包服务前，判断项目根目录是否有 `vue.config.js`：
    -   若有，则通过 `nvm use 14` 切换至 Node.js v14 运行相关命令。
    -   若无，则默认使用当前环境（Node.js v20）。
-   **服务端接口实现**: 在 mycli 的 express 服务端实现 VSCode 扩展请求的 `/api/vue/start` 接口，用于接收目录路径并启动服务。
-   **VSCode 扩展更新**: 修改现有 VSCode 扩展中的右键 `dist` 目录的调用路径，由 `/vue/start` 变更为 `/api/vue/start`。

## 最终实现方案

-   **CLI 接口设计**:
    -   在 `mycli vue` 命令中新增 `--start <path>` 参数（或将现有的逻辑适配此需求），通过传入 `path` 识别项目，自动执行打包和启动。
-   **Node 版本切换方案**:
    -   在 `buildProject` 等核心函数执行前，使用 `fs.existsSync` 判断目标目录是否存在 `vue.config.js`。
    -   如果存在，修改 `execa` 执行命令时的 shell 为包含 `nvm use 14 &&` 的脚本。
-   **服务端实现**:
    -   在 `packages/server/src/controllers/vue.ts` 导出路由，包含 `POST /start` 方法，并将其挂载到 `/api/vue` 上。
    -   该接口读取传入的 `path` 并在对应路径使用 `express.static` 及 `detectPort` 分配并启动独立端口的本地静态服务（或重用现有的 `vueServer` 逻辑），返回启动的 url。
-   **VSCode 扩展**:
    -   在 `packages/vscode-extension/src/index.ts` 中，将请求 url 修改为 `http://localhost:9527/api/vue/start`。

## 修改点一览（设计层面）

-   **入口层**：
    -   `packages/cli/src/cli.ts`: 为 `vue` 命令新增 `--start` 参数。
-   **业务逻辑层**：
    -   `packages/cli/src/business/vue/service.ts`: 新增判断 `vue.config.js` 和切换 `nvm` 的逻辑，处理 `--start` 对应的行为。
    -   `packages/server/src/controllers/vue.ts`: 引入 `Router`，新增 `/start` 路由，并实现静态服务启动逻辑（分配端口、返回 URL 等）。
    -   `packages/server/src/index.ts`: 挂载 `vue.ts` 暴露的 Router 到 `/api/vue`。
    -   `packages/vscode-extension/src/index.ts`: 修改 `fetch` 的 URL。

## 代码分析

-   现有的 `vue` 命令已经具备 `buildProject` 和 `startServer` 能力，但 `buildProject` 内部当前可能没有根据文件检测 Node 版本的逻辑。
-   VSCode 扩展中已包含资源管理器右键点击 `dist` 目录的触发器，只需修改 URL 即可。
-   `packages/server/src/index.ts` 现有的 `mountVueProjects` 是在服务启动时加载本地数据库记录，新增的 `/api/vue/start` 则为实时启动接口。
