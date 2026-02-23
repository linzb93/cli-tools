# 功能: eng 命令增强 - 剪贴板与 URL 翻译

**日期**: 2026-02-23
**状态**: 计划中
**相关命令**: `eng`
**业务代码位置**: `/packages/cli/src/business/translate`

## 背景 / Context

目前的 `eng` 命令主要用于翻译简单的单词或短语，输入方式仅限于命令行参数。用户希望扩展输入源，支持从剪贴板读取内容以及直接翻译 URL 对应的网页内容，以提升使用效率。

## 需求

1.  **剪贴板交互**：当 `eng` 命令未提供参数时，询问是否读取剪贴板。
    -   同意后，显示剪贴板内容前 100 字预览。
    -   再次询问是否翻译。
2.  **剪贴板直译**：支持通过 `eng -c` 或 `eng --clipboard` 选项直接读取剪贴板内容并调用 AI 翻译，无需确认。
3.  **URL 翻译**：自动识别输入内容是否为 URL。
    -   如果是 URL，直接将 URL 传递给 AI 进行翻译（由 AI 处理内容获取或摘要）。

## 方案对比

### 方案 A：修改 `engCommand` 入口逻辑 (推荐)

在命令入口处处理输入源（参数、剪贴板选项），获取到最终文本后，再调用翻译服务。

-   **优点**：逻辑清晰，输入处理与翻译服务解耦。
-   **缺点**：`engCommand` 会包含一些交互逻辑。

## 最终实现方案

选择 **方案 A**。

### CLI 接口设计

-   `eng` (无参): 进入交互模式。
-   `eng <text>`: 翻译文本（自动检测 URL）。
-   `eng -c, --clipboard`: 读取剪贴板并翻译（忽略参数中的 text）。

### 行为说明

1.  **无参调用**:

    -   检查 `process.argv` 及选项。
    -   若无内容且无 `-c` 选项：
        -   `inquirer` 提示 "检测到未输入内容，是否读取剪贴板？(Y/n)"。
        -   读取剪贴板 (`clipboardy`)。
        -   显示预览: `内容预览: "..."` (前 100 字 + 省略号)。
        -   `inquirer` 提示 "是否翻译？(Y/n)"。
        -   调用 `translateByAI`。

2.  **`eng -c`**:

    -   直接读取剪贴板。
    -   调用 `translateByAI`。

3.  **URL 识别**:
    -   如果 `text` 是 URL，直接传递给 `translateService` 或 `translateByAI`。
    -   注意：需确认 `translateService` 内部逻辑是否能处理 URL（当前是直接传给 AI，所以没问题）。

### 依赖库

-   `clipboardy`: 读取剪贴板。
-   `inquirer`: 交互提示。

## 修改点一览（设计层面）

### 入口层 (`packages/cli/src/commands/eng.ts`)

-   修改 `engCommand` 函数签名，接收 `options`。
-   增加对 `-c` 选项的处理。
-   增加无参时的交互逻辑。
-   引入 `inquirer`。

### 业务逻辑层 (`packages/cli/src/business/translate`)

-   **utils.ts (新增)**:
    -   `getClipboardContent()`: 封装 `clipboardy` 读取。
-   **service.ts**:
    -   保持不变（AI 负责处理 URL）。

## 代码分析

现有 `engCommand` 定义：

```typescript
program
    .command('eng [text]')
    .option('-e,--example', '显示范例')
    .action((text, options) => {
        engCommand(text, options);
    });
```

需要增加 `.option('-c, --clipboard', '读取剪贴板内容')`。
`engCommand` 实现需要更新以处理新逻辑。

## 备注

-   URL 翻译完全依赖 AI 模型的能力。
