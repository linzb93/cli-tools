# 功能: cd 目录跳转与记录命令

**日期**: 2026-03-23
**状态**: 计划中
**相关命令**: `cd`
**业务代码位置**: `packages/cli/src/business/cd`

## 背景 / Context

由于用户需要在终端频繁跳转到特定的绝对或相对路径，且希望能自动记录这些路径，便于后续通过“使用频率从高到低”快速选择。
由于 Node.js 命令行工具（子进程）无法直接更改终端（父进程）的工作目录，我们需要设计一个配合外部 Shell 脚本（如 alias / function）使用的 `cd` 命令，通过 CLI 的输出来驱动外层 Shell 执行真正的 `cd` 操作。

## 需求

-   支持接收绝对路径或相对路径参数，如果带有参数，则解析出绝对路径，并将其记录到本地数据库 `app.json` 中，频率计数 `+1`，同时向标准输出打印目标绝对路径。
-   如果不带参数执行命令，从数据库中读取历史跳转记录，根据频率从高到低排序，截取前 10 条展示为交互式列表。
-   用户在列表中选择后，将选中的路径频率计数 `+1`，并向标准输出打印该绝对路径。
-   **数据存储**：在 `packages/shared/src/utils/sql.ts` 中的 `Database` 接口新增 `cdHistory: { path: string, count: number }[]` 字段。
-   **交互规范**：交互列表强制使用现有的 `packages/cli/src/utils/inquirer.ts` 实现。

## 方案对比

-   方案 A (标准交互式方案 - **选定**): 无参数时使用 inquirer 提供列表选择界面，用户体验好，外层 Shell 只需要执行 `cd $(cli cd)`（示例）。
-   方案 B (极简非交互方案): 无参数时打印列表，用户二次输入序号跳转。体验相对繁琐。

## 最终实现方案

-   选定方案: 方案 A
-   CLI 接口设计:
    -   命令: `cd [path]`
    -   参数 `[path]`: 可选，目标跳转目录。
-   行为说明:
    -   正常流程：若指定了有效路径，记录并输出；若无参数，显示历史 top 10，选择后记录并输出。
    -   错误处理：如果指定的路径不存在或不是一个目录，在 stderr 输出错误提示并以非 0 状态码退出。如果是交互模式但暂无历史记录，则提示当前无历史记录。
-   与现有命令的兼容性: 这是一个新命令，不存在破坏性更新。

## 修改点一览（设计层面）

-   入口层：
    -   `packages/cli/src/commands/cd.ts` (新增)：注册 `cd` 命令及接收 `[path]` 参数。
    -   `packages/cli/src/bin.ts` (修改)：引入并注册 `cd` 命令。
-   业务逻辑层：
    -   `packages/cli/src/business/cd/index.ts` (新增)：处理无参数列表选择及有参数记录的核心逻辑。调用 `packages/cli/src/utils/inquirer.ts` 处理交互。
-   类型与工具：
    -   `packages/shared/src/utils/sql.ts` (修改)：`Database` 接口中增加 `cdHistory: { path: string, count: number }[]`。

## 代码分析

目前工具已经具有完善的 `sql.ts` 基于 lowdb 的 JSON 数据存储支持。我们需要做的是在现有的 `Database` 接口中扩展字段，并在 `business/cd` 模块中实现相应的业务逻辑。交互功能由于已经明确规定使用 `inquirer.ts`，我们将直接引入该工具函数以保持代码风格统一。

## 备注

为了使用户能够真正实现终端目录跳转，可以在命令首次执行或文档中，向用户展示类似以下的 Shell 配置方法（假设全局命令名为 `trae`）：

```bash
# ~/.bashrc 或 ~/.zshrc
function mycd() {
  local target=$(trae cd "$@")
  if [ -n "$target" ] && [ -d "$target" ]; then
    cd "$target"
  fi
}
```

对于 PowerShell：

```powershell
function mycd {
    $target = trae cd $args
    if ($target -and (Test-Path -Path $target -PathType Container)) {
        Set-Location $target
    }
}
```
