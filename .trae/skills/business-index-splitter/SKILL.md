---
name: 'business-index-splitter'
description: '将业务模块 index.ts 拆分为 service.ts 与 types.ts；当用户说“拆分xx文件”时调用。'
---

# Business Index Splitter

本技能用于**规范业务模块目录结构**：将 `packages/cli/src/business/**/index.ts` 中混合的类型声明与业务实现拆分为：

-   `types.ts`：仅放置类型声明（interface、type、enum 等）
-   `service.ts`：仅放置可执行的业务逻辑（函数、类、常量等）
-   `index.ts`：只做类型与服务的聚合导出

参考已有模块（如 `tree`、`curl`、`token`、`translate` 等）的结构：

```ts
// index.ts
export type { Options } from './types';
export { xxxService } from './service';
```

## 适用场景（何时调用）

-   用户说「重构业务模块结构」「拆分 index.ts」之类需求
-   业务模块下目前只有 `index.ts`，希望与其它命令保持统一结构
-   需要把类型从实现中抽离，方便复用 / 测试 / 文档生成

> 限定范围：仅针对 `packages/cli/src/business` 目录下的业务子模块。

## 目录与命名约定

-   目标目录形如：`packages/cli/src/business/<module>/`
-   最终结构应满足：
    -   `index.ts`：仅 re-export
    -   `service.ts`：导出形如 `xxxService` 的主业务函数（或多个 service）
    -   `types.ts`：导出 `Options`、`Context` 等类型
-   若模块已有 `service.ts` 或 `types.ts`：
    -   优先复用已存在文件
    -   仅在必要时合并或轻微调整，而不是重新创建

## 拆分原则

### 1. 类型归类到 `types.ts`

将以下内容从 `index.ts` 挪到 `types.ts`：

-   `interface` 声明
-   `type` 别名
-   `enum` 枚举
-   仅用于类型的导出（例如 `export interface Options {}`）

要求：

-   保持原有导出名称不变（兼容现有调用方）
-   如需导入外部类型，优先使用 `import type` 形式

### 2. 业务代码归类到 `service.ts`

保留或移动到 `service.ts` 的内容：

-   具体业务函数（例如 `forkService`、`deployService`、`treeService` 等）
-   与业务执行直接相关的常量、工具函数
-   默认导出类或函数（若 index.ts 里存在）

导入规则：

-   运行时依赖（如 `chalk`、`fs-extra`、`execa` 等）在 `service.ts` 中导入
-   来自 `types.ts` 的类型使用相对导入：`import type { Options } from './types';`

### 3. `index.ts` 聚合导出

拆分完成后，`index.ts` 只做“门面”作用，不再包含实际实现或类型定义。

常见模式：

-   若只有一个 Options 类型和一个 service：
    -   `export type { Options } from './types';`
    -   `export { xxxService } from './service';`
-   若有多个类型或多个 service：
    -   按需列出：`export type { Options, Context } from './types';`
    -   `export { fooService, barService } from './service';`

## 标准操作步骤

1. **定位目标模块**

    - 根据用户描述或当前打开文件定位到某个业务模块目录，例如：
        - `/packages/cli/src/business/fork/index.ts`
    - 确认该目录下结构是否已包含 `service.ts` / `types.ts`。

2. **分析现有 `index.ts`**

    - 检查文件中的：
        - 类型声明（interface/type/enum）
        - 导出的业务函数 / 类
        - 现有的导出语句（默认导出 / 命名导出）

3. **创建或更新 `types.ts`**

    - 若不存在 `types.ts`：
        - 新建文件，将所有类型声明移动过去
        - 保持导出方式不变（`export interface` / `export type`）
    - 若已存在：
        - 合并从 `index.ts` 找到的类型声明，避免重复声明
    - 处理类型依赖的导入：
        - 对纯类型依赖，使用 `import type` 形式

4. **创建或更新 `service.ts`**

    - 若不存在 `service.ts`：
        - 新建文件，将业务函数 / 类以及相关常量挪过来
        - 为主业务函数保持与原来一致的导出名称（例如：`forkService`）
    - 若已存在：
        - 将原来写在 `index.ts` 中的实现合并进 `service.ts`
    - 更新导入：
        - 保留对运行时库的导入
        - 从 `./types` 导入所需类型

5. **重写 `index.ts` 为聚合导出**

    - 删除 `index.ts` 中的类型定义与实现代码
    - 仅保留或新增导出语句：
        - 从 `./types` 导出类型
        - 从 `./service` 导出业务函数
    - 保证对外 API 不变：
        - 若之前是 `export const forkService`，则仍然通过 `index.ts` 导出 `forkService`
        - 如有默认导出，根据项目实际约定，决定是否维持默认导出或改为命名导出（优先保持现状）

6. **比照已有模块校对风格**

在完成一个模块的拆分后，对比类似结构的模块（例如 `tree`、`curl`、`token`）：

-   导出名称是否统一（`xxxService` 与 `Options` 等）
-   导入路径是否正确且无循环依赖
-   是否无多余未使用代码

## 特殊情况处理

-   若某业务模块中存在大量杂合逻辑（类型、工具函数、服务混在一起）：
    -   优先保证类型与服务实现分离
    -   如有与服务无关的小工具函数，暂时保留在 `service.ts` 中，必要时再抽离
-   若模块已经有 `service.ts` 或 `types.ts` 且结构合理：
    -   不强制重写，仅在用户明确要求时调整

## 检查清单

在完成一次拆分后，至少确认以下几点：

-   [ ] `index.ts` 中不再包含类型声明或业务实现，只做 re-export
-   [ ] `types.ts` 仅包含类型相关内容，无运行时代码
-   [ ] `service.ts` 引用了 `./types` 中的类型并包含所有业务逻辑
-   [ ] 对外导出的类型名与函数名与重构前保持一致
-   [ ] 与同类业务模块的结构和命名风格保持一致

## 执行约束

-   拆分完成后，不主动在终端输出拆分结果
-   拆分过程中及完成后，不自动执行任何终端命令
