# 功能: 将 version 命令重构为 iteration 命令

**日期**: 2026-03-22
**状态**: 计划中
**相关命令**: iteration (原 version)
**业务代码位置**: `packages/cli/src/business/version` -> `packages/cli/src/business/iteration`

## 背景 / Context

原先的 `version` 命令仅支持简单的 `patch` 版本号自增，难以适应目前日益复杂的研发协同工作流。新的需求需要根据不同类型的项目（GitHub 项目、公司 Monorepo 项目、公司普通业务项目）提供差异化的版本升级策略（二级迭代 vs 三级修复），并需要支持 Monorepo 工作区中所有关联包的版本统一更新，同时规范化分支的切换、提交与推送流程。因此计划将其重构为功能更强大的 `iteration` 命令。

## 需求

- **重命名命令**：将 CLI 命令入口从 `version` 改为 `iteration`。
- **项目类型识别**：
  - 通过 `git remote -v` 是否包含 `github.com` 识别 **GitHub项目**。
  - 通过项目根目录是否存在 `packages` 目录识别 **Monorepo项目**。
- **差异化升级策略**：
  - **GitHub项目** 或 **公司Monorepo项目**：默认进行**二级版本迭代** (minor 自增)；若传入 `--fix` 参数，则进行**三级版本修复** (patch 自增)。
  - **公司普通业务项目**（非 GitHub 且非 Monorepo）：强制进行**三级版本自增** (patch 自增)。
- **手动指定版本**：支持传入 `--version <指定版本号>`，直接使用该版本号，跳过上述自动计算逻辑。
- **Monorepo 统一更新**：若判定为 Monorepo 项目，除了更新根目录的 `package.json` 外，还需同步更新所有 `packages/*/package.json` 中的 `version` 字段为新版本号（公司非monorepo项目同样更新自身 package.json 的 version）。
- **Git 工作流规范**：
  1. **前置检查与主干切换**：如果当前不在 `master` 或 `main` 分支，需要检查当前分支是否有未提交的代码。如果有，先将其提交，然后再切换到 `master` 或 `main` 分支并拉取最新代码。
  2. **开发分支策略**：
     - 若传入 `--fix` 参数：**不需要**切换到开发分支（直接在当前所处的 master/main 分支操作）。
     - 若未传入 `--fix` 参数（正常迭代）：
       - **公司普通业务项目**（非 monorepo）：基于主干新建并切换到 `dev-{newVersion}` 分支。
       - **其他项目**（GitHub项目、公司monorepo项目）：基于主干切换到 `dev` 分支。
  3. **版本更新与提交推送**：
     - 切换到目标分支后，执行 `package.json` 的版本号修改。
     - 修改完成后，将代码提交 (commit)。
     - 将当前分支 push 到远端。其中，对于**公司项目**的 push 操作，需要参考 `packages/cli/src/business/git/push/service.ts` 中的逻辑。

## 方案对比

- 方案 A: 仅在原 `version` 命令基础上增加判断。优点是改动小；缺点是命令语义不符（原意为单纯管理version，现包含复杂的迭代策略），代码可能变得臃肿。
- 方案 B: 新增 `iteration` 命令，将原来的 `version` 命令相关逻辑进行迁移重构，梳理类型判断与版本更新的职责。优点是职责清晰，符合长远发展；缺点是重构成本稍高。（**选定**）

## 最终实现方案

- **选定方案**: 方案 B
- **CLI 接口设计**:
  - `mycli iteration`：执行默认迭代逻辑。
  - `mycli iteration --fix`：执行修复（Patch）逻辑。
  - `mycli iteration --version 1.2.0`：手动指定版本。
- **行为说明**:
  1. 检查当前环境是否有效（是否存在 `package.json`）。
  2. 检测项目类型（GitHub、Monorepo）。
  3. 根据参数和项目类型计算新版本号 `newVersion`。
  4. 检查当前所处 Git 分支：若不在 `master` / `main`，检查是否有未提交更改。若有则先执行 commit（可使用默认 message 或提示输入），然后 checkout 到 `master` / `main` 并 pull。
  5. 分支路由：
     - 如果是 `--fix`，保留在当前主干分支。
     - 否则，如果是公司非 Monorepo 项目，执行 `git checkout -b dev-{newVersion}`（若存在则提示重新输入版本号或直接切换）。如果是其他项目，执行 `git checkout dev`。
  6. 更新版本号：
     - 写入根目录 `package.json`。
     - 若为 Monorepo，遍历 `packages/` 目录下所有第一层子目录，若存在 `package.json` 则同步写入。
  7. 提交与推送：执行 `git add .`、`git commit -m "chore: bump version to {newVersion}"`，然后执行推送。公司项目调用/参考 `push/service.ts` 的相关逻辑。
- **与现有命令的兼容性**:
  - 移除原 `version` 命令入口，相关业务逻辑目录 `business/version` 变更为 `business/iteration`。

## 修改点一览（设计层面）

- **入口层**：
  - `/packages/cli/src/cli.ts`：将 `.command('version [newVersion]')` 改为 `.command('iteration')`，并注册相应的 `.option('--fix', '三级修复版本')` 和 `.option('--version <version>', '指定版本号')`。
- **业务逻辑层**：
  - `/packages/cli/src/business/version` 目录重命名为 `/packages/cli/src/business/iteration`。
  - `/packages/cli/src/business/iteration/service.ts`：
    - 更新参数接口类型定义（增加 `fix`, `version` 等）。
    - 引入并调用项目类型检测方法（`isGithubProject`, `isMonorepo`）。
    - 引入 Git 分支检查、未提交更改检查逻辑。
    - 根据项目类型和参数调整分支切换逻辑（`dev-{newVersion}` vs `dev` vs 留主干）。
    - 增加版本写入后 commit 和 push 的逻辑，结合 `push/service.ts`。
- **类型与工具**：
  - `/packages/cli/src/business/git/shared/utils/index.ts`：从 `baseDeploy.ts` 提取 `isGithubProject` 函数。
  - `/packages/cli/src/business/git/deploy/baseDeploy.ts`：更新对 `isGithubProject` 的导入路径。
  - 新增 `isMonorepo` 工具函数：可放在 `/packages/cli/src/business/iteration/utils.ts` 或共用 utils 中。

## 代码分析

- 分支操作逻辑比原来更复杂，需要仔细处理 `git checkout` 之前的工作区状态。
- `push/service.ts` 中可能包含针对公司内部工具（如 code review, jenkins 等）的特定 push 逻辑，因此“公司项目”推送时需复用该模块或参考其实现。
- 提取 `isGithubProject` 将减少代码重复。

## 备注

- 如果当前分支有未提交代码，自动 commit 时的 commit message 可以默认为 `chore: save uncommitted changes before iteration`，或者交互式让用户输入。
- 在更新 Monorepo 中子包的 `package.json` 时，只更新 `version` 字段，暂不处理内部依赖版本的连锁更新。
