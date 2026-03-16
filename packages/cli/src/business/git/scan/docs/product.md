# Git Scan Product Documentation

## 1. 核心价值 (Value Proposition)

在微服务架构或多项目并行的开发环境中，开发者往往需要在多个 Git 仓库之间频繁切换。`git scan` 命令旨在解决**多仓库状态管理混乱**的问题，为开发者提供一个上帝视角，快速识别哪些项目存在“未提交”、“未推送”或“分支异常”的状态，并提供快捷的交互式命令进行批量处理，从而确保代码安全，提高多项目维护效率。

## 2. 用户故事 (User Stories)

-   **每日站会前检查**：作为一名全栈开发者，我需要在晨会前快速确认昨天修改的 5 个微服务仓库是否都已提交代码，以便向团队同步进度。
-   **下班前代码归档**：作为一名极客，我希望在周五下班前一键扫描所有个人项目，找出所有未推送的 commit 并批量 push，防止本地硬盘损坏导致代码丢失。
-   **分支规范治理**：作为一名 Tech Lead，我需要定期检查团队成员是否在非主分支上进行开发，通过扫描快速定位停留在 `feature/*` 分支的废弃仓库。

## 3. 功能特性 (Features)

-   **智能批量扫描**：自动读取数据库中配置的 Git 根目录，递归扫描所有子目录下的 Git 仓库。
-   **精准状态识别**：
    -   🔴 **未提交 (Uncommitted)**：工作区或暂存区有变更。
    -   🟡 **未推送 (Unpushed)**：本地 Commit 落后于远程。
    -   ⚪ **不在主分支 (NotOnMain)**：当前 HEAD 指向非默认分支。
    -   🟢 **正常 (Clean)**：工作区干净且与远程同步。
-   **聚焦异常**：默认仅展示状态异常的仓库，通过 `--full` 参数可查看所有仓库。
-   **交互式 REPL 环境**：扫描结束后自动进入交互模式，无需退出即可对特定仓库执行操作。
    -   `diff`: 查看变更详情（支持自动唤起 VS Code）。
    -   `commit`: 快速提交变更。
    -   `log`: 查看未推送的提交记录。
    -   `push`: 批量或单个推送代码。

## 4. 命令行参数 (Command Arguments)

| 参数 | 类型 | 必选 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `--full` | boolean | 否 | `false` | 是否全量扫描。默认只显示异常仓库，开启后显示所有扫描到的仓库。 |

## 5. 交互设计 (User Experience)

### 5.1 扫描视图
命令执行后，首先展示进度条，随后输出状态表格：

```text
┌──────────────────┬──────────────────────────────────────────┬──────────┬───────────────┐
│ 名称             │ 地址                                     │ 状态     │ 分支          │
├──────────────────┼──────────────────────────────────────────┼──────────┼───────────────┤
│ 1. cli-tools     │ /Users/user/code/cli-tools               │ 未推送   │ feature/scan  │
│ 2. backend-api   │ /Users/user/code/backend-api             │ 未提交   │ main          │
└──────────────────┴──────────────────────────────────────────┴──────────┴───────────────┘
git-scan> 
```

### 5.2 交互命令
进入 `git-scan>` 提示符后，支持以下指令：

-   **查看差异**: `diff 2` (查看第2个项目的修改，行数过多自动打开 VS Code)
-   **提交代码**: `commit 2 fix: update logic` (对第2个项目执行 commit)
-   **查看日志**: `log 1` (查看第1个项目的未推送 commit)
-   **推送代码**: `push` (推送所有未推送项目) 或 `push 1` (推送第1个项目)

## 6. 技术实现 (Technical Implementation)

该模块主要由 `service.ts` 驱动，采用 Pipeline 模式处理数据流，最后接管 `stdin` 进入 REPL 模式。

```mermaid
flowchart TD
    Start([开始]) --> LoadDB[读取 DB Git 目录配置]
    LoadDB --> ExpandDirs[展开子目录]
    ExpandDirs --> ScanLoop{并发扫描}
    
    subgraph ParallelScan ["并发处理 (Concurrency: 4)"]
        ScanLoop -->|Dir| CheckGit[检查 Git 状态]
        CheckGit -->|Status| ReturnItem[返回 ResultItem]
    end
    
    ReturnItem --> Filter{过滤状态}
    Filter -->|"--full=false"| FilterAbnormal[仅保留异常项目]
    Filter -->|"--full=true"| KeepAll[保留所有项目]
    
    FilterAbnormal --> CheckEmpty{列表为空?}
    KeepAll --> CheckEmpty
    
    CheckEmpty -->|Yes| EndSuccess([结束: 无需处理])
    CheckEmpty -->|No| PrintTable[打印状态表格]
    
    PrintTable --> REPL[进入 REPL 交互循环]
    
    REPL --> WaitInput[/等待用户输入/]
    WaitInput --> ParseCmd{解析命令}
    
    ParseCmd -->|diff <x>| CmdDiff[执行 git diff / code]
    ParseCmd -->|commit <x>| CmdCommit[执行 git commit]
    ParseCmd -->|log <x>| CmdLog[执行 git log]
    ParseCmd -->|push [x]| CmdPush[执行 git push]
    ParseCmd -->|exit| End([退出])
    
    CmdDiff --> REPL
    CmdCommit --> REPL
    CmdLog --> REPL
    CmdPush --> REPL
```

### 关键技术点
1.  **并发控制**: 使用 `p-map` 限制并发数为 4，避免同时执行大量 `git` 命令导致系统卡顿。
2.  **REPL 实现**: 封装 `createCommandReadline` 工具，统一处理命令解析、参数验证和帮助信息。
3.  **智能 Diff**: 自动检测 diff 行数，超过 20 行自动调用 `code` 命令打开 VS Code，避免终端刷屏。

## 7. 约束与限制 (Constraints)

-   **环境依赖**: 必须安装 `git` 和 `code` (VS Code CLI) 命令。
-   **配置依赖**: 需预先在 CLI 的数据库中配置 Git 根目录 (`db.gitDirs`)。
-   **性能限制**: 极大量（如 >1000）仓库扫描可能会较慢，建议按需配置根目录。
