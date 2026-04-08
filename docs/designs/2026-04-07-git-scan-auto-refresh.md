# 功能: git scan 命令执行后自动刷新

**日期**: 2026-04-07
**状态**: 计划中
**相关命令**: git scan
**业务代码位置**: `packages/cli/src/business/git/scan/`

## 背景 / Context

在 `git scan` 命令的交互式界面中，用户执行如 `/commit`、`/diff` 等命令后，界面不会自动刷新显示最新的项目状态。用户需要手动输入 `/restart` 才能看到更新后的状态，体验不够流畅。

## 需求

- 在执行除了 `/restart` 和 `/exit` 之外的其他命令后
- 延迟 1 秒
- 重新执行 git status 对已列出的项目进行扫描
- 重新显示项目列表表格和命令帮助

### 典型使用场景

1. 用户对项目1执行 `/commit 1 "fix bug"` 提交代码
2. 命令执行完成后，界面自动延迟1秒
3. 自动重新扫描所有项目的 git status
4. 重新显示项目列表表格
5. 重新显示命令帮助信息

### 输入与输出

- **输入**: 用户在交互界面执行的命令（如 `/commit 1 msg`）
- **输出**: 延迟后自动刷新显示的最新项目列表和命令帮助

## 方案对比

### 方案 A: 在 readline.ts 中添加 onComplete 回调

**描述**: 在 `createCommandReadline` 函数中添加可选的 `onComplete` 回调，命令执行完成后触发。

**优点**:
- 通用性强，可复用给其他使用 `createCommandReadline` 的模块
- 修改集中在一个文件（readline.ts）和业务文件（commands.ts）
- 不影响现有 `restart` 命令的逻辑

**缺点**:
- 需要修改底层 readline.ts 封装

**适用场景**: 需要在命令执行后执行统一处理逻辑的场景

### 方案 B: 在每个命令 handler 中单独处理刷新逻辑

**描述**: 在 `commands.ts` 中的每个命令 handler 末尾直接添加延迟+刷新的代码。

**优点**:
- 不需要修改底层 readline.ts

**缺点**:
- 代码重复，每个命令都要添加相同逻辑
- 难以维护，新增命令容易忘记添加刷新逻辑
- 违反 DRY 原则

**适用场景**: 临时方案，不推荐

### 方案 C: 在 handleLine 函数的 finally 块中统一处理

**描述**: 在 finally 块中统一处理刷新，但通过检查命令名排除 restart 和 exit。

**优点**:
- 修改集中
- 不需要新增回调机制

**缺点**:
- 刷新逻辑与 readline.ts 耦合，不够通用
- 其他模块使用 readline.ts 时也会带上这个行为

**适用场景**: 仅 git scan 使用 readline.ts 时可行

## 最终实现方案

- **选定方案**: 方案 A（`onComplete` 回调）
- **CLI 接口设计**: 无 CLI 接口变更，纯内部行为改进
- **行为说明**:
  - 用户在 `git-scan>` 交互界面输入命令（如 `/commit 1 msg`）
  - 命令执行完成后，延迟 1 秒
  - 重新扫描所有已列出的项目，获取最新 git status
  - 重新显示项目列表表格和命令帮助
  - `/restart` 命令保持现有逻辑不变（自带刷新）
  - `/exit` 命令直接退出，不触发刷新
- **与现有命令的兼容性**: 完全兼容，`/restart` 和 `/exit` 行为不变；`onComplete` 回调是可选的，其他使用 `createCommandReadline` 的模块不受影响

## 修改点一览（设计层面）

### 入口层

- `packages/cli/src/utils/readline.ts`
  - 新增 `CommandCompleteContext` 接口和 `CommandCompleteCallback` 类型（第12行后）
  - 扩展 `CommandReadlineOptions` 接口，添加 `onComplete?: CommandCompleteCallback`（第27行）
  - 在 finally 块中调用 `await onComplete?.({ rl, command: cmd.name })`（第191行）

### 业务逻辑层

- `packages/cli/src/business/git/scan/commands.ts`
  - 导入 `CommandCompleteCallback` 类型
  - 在 `startRepl` 函数中实现 `onComplete` 回调：
    - 检测命令是否为 `restart`，是则跳过
    - 延迟 1 秒
    - 使用 `pMap` 并发重新扫描项目状态
    - 原地更新 list 数组
    - 调用 `printResultTable` 重新显示表格
    - 显示命令帮助信息

## 代码分析

### 现有代码结构

**readline.ts 命令执行流程（第184-193行）**:
```typescript
rl.pause();
try {
    await cmd.handler(parsed.args, item);
} catch (err) {
    console.log(chalk.red(`命令执行失败: /${cmd.name}`));
    console.log(String(err));
} finally {
    rl.resume();
    rl.prompt();  // 这里只是重新显示 prompt
}
```

**restart 命令的刷新逻辑（第73-111行）**:
- 使用 `pMap` 并发对 list 中的每个项目执行 `getGitProjectStatus`
- 过滤出需要处理的项目（Uncommitted、Unpushed、NotOnMainBranch）
- 调用 `printResultTable` 重新显示
- 调用 `onRestart()` 回调

### 关键复用点

1. `restart` 命令内部的重扫描逻辑可作为 `onComplete` 回调实现的参考
2. 使用 `pMap` 并发扫描，保持与现有逻辑一致
3. `list.length = 0` + `push` 实现原地更新数组

### 时序流程

```
用户输入 /commit 1 "msg"
    → handleLine() 执行命令
    → finally: rl.prompt() + onComplete({ command: 'commit' })
    → 延迟 1 秒
    → pMap 并发获取所有项目最新状态
    → 原地更新 list
    → printResultTable() 显示表格
    → 显示命令帮助
    → 等待下一次输入
```

## 备注

- `restart` 命令会显示两次表格（handler 一次 + 回调一次），影响很小，属于可接受范围
- 如果希望避免双重显示，可在 restart handler 中设置标志位让回调跳过，但会增加复杂性
- `CommandCompleteCallback` 类型定义在 readline.ts，可供其他模块复用
