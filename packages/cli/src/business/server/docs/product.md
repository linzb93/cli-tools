# Server 命令产品文档

## 核心价值 (Value Proposition)
提供一键式本地 Web 服务的启动、停止及页面访问管理能力。开发者无需手动管理后台进程，即可快速拉起后台服务并自动在浏览器中打开指定的静态页面或特定菜单，极大提升了本地开发与预览的效率。

## 用户故事 (User Stories)
- **作为一名开发者**，我希望能够快速启动本地后台服务，以便我能够立刻预览和调试应用。
- **作为一名测试人员**，我希望服务启动后能自动在浏览器中打开特定的功能菜单，而不需要我手动输入 URL 和 Hash。
- **作为一名用户**，我希望能够通过简单的命令停止正在后台运行的本地服务，释放端口占用。
- **作为一名用户**，当服务已经在后台运行时，我希望再次执行启动命令时能够直接帮我打开浏览器，而不是重复启动报错。

## 功能特性 (Features)
- **后台服务管理**：支持以分离 (detached) 模式拉起 Node.js 后台服务，并在控制台显示带时间戳的启动日志。
- **端口检测机制**：启动前自动检测端口占用情况，若服务已在运行，则直接进入页面打开流程。
- **服务停止能力**：支持根据端口精准杀死后台服务进程。
- **智能页面导航**：
  - 支持直接打开系统默认的静态首页。
  - 支持通过交互式命令行选择特定的菜单直接跳转。
  - 支持通过参数直接指定要跳转的菜单 Hash。
- **进程生命周期控制**：服务拉起成功后可配置是否自动退出当前 CLI 进程，保持终端整洁。

## 命令行参数 (Command Arguments)
| 参数/选项 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `command` | `string` | `undefined` | 唯一支持的值为 `'stop'`，用于停止后台运行的服务。如果不传，则为启动服务。 |
| `--open` | `boolean` | `false` | 是否在服务启动后（或检测到已启动时）自动打开浏览器访问首页。 |
| `--menu` | `boolean \| string` | `false` | 若为 `true`，通过交互式列表让用户选择要打开的菜单；若为 `string`，直接打开对应 Hash 的菜单。 |
| `--exit` | `boolean` | `false` | 服务启动并打开页面后，是否立即结束当前 CLI 进程。 |

## 交互设计 (User Experience)
- **服务状态提示**：若端口已被占用，输出 `服务已启动，无需重新打开`，并自动执行打开页面的逻辑。
- **日志输出**：服务启动成功时，输出格式化时间戳的黄色日志信息：`[YYYY-MM-DD HH:mm:ss] 服务在XXX端口启动。`
- **菜单选择交互**：当 `--menu` 设置为 `true` 且数据库中存在菜单数据时，使用 `inquirer` 弹出列表供用户使用上下键选择目标菜单。

## 技术实现 (Technical Implementation)

### 1. 主流程分发逻辑 (Main Dispatch Flow)
负责判断用户的命令意图（启动或停止服务）以及服务当前的运行状态。

```mermaid
graph TD
    A["开始执行 server()"] --> B{"command == 'stop'?"}
    B -- "是" --> C["调用 killService() 杀死对应端口进程"]
    C --> D["结束"]
    B -- "否" --> E["检测目标端口是否被占用"]
    E --> F{"端口已被占用?"}
    F -- "是" --> G["输出提示信息"]
    G --> H["调用 openPage()"]
    H --> D
    F -- "否" --> I["使用 fork() 拉起分离的 child_process"]
    I --> J["监听 child 进程 message 和 error 事件"]
    J --> K["等待服务启动完成"]
```

### 2. 子进程通信与页面打开逻辑 (Sub-Flow: Child Process & Open Page)
负责处理服务实际启动后的消息通信，以及如何根据参数打开特定页面。

```mermaid
graph TD
    A["监听 Child Process"] --> B{"收到事件类型?"}
    B -- "error" --> C["打印错误信息"]
    C --> D["退出当前进程 (exit 1)"]
    B -- "message (type: message)" --> E["直接打印业务日志"]
    B -- "message (type: server-start)" --> F["打印服务启动成功日志"]
    F --> G["调用 openPage(options)"]
    
    G --> H{"options.open == true?"}
    H -- "是" --> I["使用 open() 打开静态首页"]
    H -- "否" --> J{"options.menu 存在?"}
    
    J -- "是" --> K{"options.menu == true 且有数据?"}
    K -- "是" --> L["通过 inquirer 提示用户选择菜单"]
    L --> M["拼接目标 Hash"]
    K -- "否" --> N["直接将 options.menu 作为目标 Hash"]
    N --> M
    M --> O["使用 open() 打开带 Hash 的菜单页"]
    
    J -- "否" --> P["不打开页面"]
    I --> P
    O --> P
    
    P --> Q["解除子进程引用 (unref) 并断开 IPC (disconnect)"]
    Q --> R{"options.exit == true?"}
    R -- "是" --> S["退出当前进程 (exit 0)"]
    R -- "否" --> T["Resolve Promise 继续执行"]
```

## 约束与限制 (Constraints)
- **端口依赖**：强烈依赖 `globalConfig.port.production` 和 `globalConfig.prefix.static` 的配置，修改配置可能导致打开的 URL 错误或端口检测失败。
- **跨平台兼容**：底层使用了 `node:child_process` 的 `fork` 以及 `open` 包，在不同操作系统下的浏览器拉起行为和后台进程管理表现可能存在微小差异。
- **数据库依赖**：菜单列表的获取依赖于 `@cli-tools/shared/utils/sql`，需要确保本地 SQLite 数据库中 `menus` 表的正确初始化。