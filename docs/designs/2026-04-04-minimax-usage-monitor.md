# 功能: Minimax 用量实时监控命令

**日期**: 2026-04-04
**状态**: 计划中
**相关命令**: minimax
**业务代码位置**: `packages/cli/src/business/minimax/`

## 背景 / Context

当前没有便捷的方式实时查看 Minimax 账号的编程计划用量。需要开发一个 CLI 命令，用于实时监控当前用量、剩余用量和下次刷新时间，提高开发效率。

## 需求

-   **命令名称**：`minimax`
-   **功能**：实时查看 Minimax 账号的当前用量、剩余用量和下次刷新时间
-   **刷新间隔**：每 3 分钟自动刷新
-   **Token 获取**：`readSecret` 函数获取，路径为 `ai.apiKey.minimax`
-   **显示效果**：进度条显示用量百分比 + 文字显示具体数值
-   **屏幕刷新**：清除旧内容后重新绘制（类似 `watch` 命令效果）
-   **退出方式**：`Ctrl+C`
-   **错误处理**：API 请求失败时报错，继续显示上一次正常数据

## 方案对比

### 方案 A: 纯 CLI 实现，使用内置刷新机制

**描述**：直接使用 Node.js 的 `setInterval` + `console.clear` 实现定时刷新

**优点**：

-   依赖少，无需额外包
-   实现简单直接
-   支持手动刷新指令 `/refresh`，无需依赖外部工具

**缺点**：

-   屏幕清除闪烁感较强
-   进度条需要自行实现或复用现有 `progress.ts`

### 方案 B: 使用 ora/spinner 类库 + 自定义渲染

**描述**：使用 ora 显示 loading 状态，配合自定义 render 函数刷新数据

**优点**：

-   动画效果流畅
-   社区成熟

**缺点**：

-   需要新增依赖
-   与现有 `progress.ts` 风格可能不一致

### 方案 C（推荐）: 复用现有 `progress.ts` + setInterval 刷新

**描述**：复用 `packages/cli/src/utils/progress.ts`，使用 `setInterval` 定时刷新，屏幕清除使用 `console.clear`

**优点**：

-   复用现有工具，保持风格一致
-   实现简单
-   无需新增依赖

**缺点**：

-   进度条样式较为简单

## 最终实现方案

-   **选定方案**: 方案 C
-   **CLI 接口设计**:
    ```
    minimax           # 启动交互式监控（带 /refresh 指令）
    minimax run       # 一次性显示当前用量后退出
    ```
-   **行为说明**:
    1. `minimax` 命令：
        - 启动时从 `secret.json` 读取 `ai.apiKey.minimax`
        - 调用用量 API 获取当前数据
        - 显示：模型名称、当前用量/总量、剩余用量、进度条、下次重置时间
        - 每 3 分钟自动刷新
        - 刷新时清除屏幕重新绘制
        - 支持 `/refresh` 指令手动刷新
        - 按 `Ctrl+C` 退出
        - API 失败时显示错误，继续保留上一次数据
    2. `minimax run` 命令：
        - 直接获取并显示当前用量
        - 显示完成后立即退出进程
-   **与现有命令的兼容性**: 新命令，不影响现有功能

## 修改点一览（设计层面）

### 入口层

-   `packages/cli/src/cli.ts` — 注册 `minimax` 命令
-   `packages/cli/src/commands/minimax.ts` — 命令入口文件（仅做参数接收和命令派发）

### 业务逻辑层

-   `packages/cli/src/business/minimax/index.ts` — 导出入口
-   `packages/cli/src/business/minimax/service.ts` — 核心服务：
    -   `fetchUsage()` — 调用 Minimax API 获取用量
    -   `fetchSubscription()` — 调用 API 获取订阅信息（可选）
    -   `parseUsageData()` — 解析 API 响应为格式化数据
    -   `render()` — 渲染界面（进度条 + 文字）
    -   `startMonitor()` — 启动监控（setInterval 循环）
    -   `stopMonitor()` — 停止监控（清理定时器）
-   `packages/cli/src/business/minimax/types.ts` — 类型定义

### 类型与工具

-   `packages/shared/src/utils/secret.ts` — 在 `Database.ai.apiKey` 中添加 `minimax: string` 字段

## 代码分析

### 现有 progress.ts 分析

`packages/cli/src/utils/progress.ts` 提供的能力：

-   `setTotal(total: number)` — 设置进度条总量
-   `tick()` — 更新进度条

这是一个基础的进度条工具，需要适配用于显示用量百分比。

### API 响应解析

根据文档，`parseUsageData()` 需要计算：

-   **当前用量** = `current_interval_total_count - current_interval_usage_count`
-   **剩余用量** = `current_interval_usage_count`
-   **下次重置时间** = `end_time`（时间戳，需格式化为可读时间）

### 刷新机制

使用 `setInterval` 每 3 分钟（180000ms）调用一次 API，然后 `console.clear()` 清屏后重新渲染。

## 备注

-   Token 不会过期，无需考虑刷新 Token 的逻辑
-   首次运行时会展示数据，后续在后台定时更新
-   进度条宽度使用默认 80 字符（与 progress.ts 保持一致）
