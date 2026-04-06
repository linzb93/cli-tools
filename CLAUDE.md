# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

个人工作用的命令行工具集，monorepo 结构，包含 CLI、Web 前端和后端服务。

## 环境要求

-   Node.js v14+ (主要运行环境)
-   Node.js v20+ (AI 相关功能)
-   Python v3.12.3 (处理 Node.js 解决不了的功能)

## 常用命令

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev                    # 开发 CLI
pnpm dev:ui                 # 开发 Vue 前端
pnpm dev:web                # 开发 Express 后端

# 构建
**系统不需要运行构建命令。**

# 类型检查
pnpm check                  # CLI 类型检查
```

## 项目结构

```
packages/
├── cli/                    # 命令行入口
│   ├── src/
│   │   ├── entry.ts        # CLI 入口文件
│   │   ├── cli.ts          # Commander 程序主文件
│   │   ├── bootstrap/      # 生命周期钩子
│   │   ├── commands/       # 命令定义 (每个文件一个命令)
│   │   │   ├── git/       # git 子命令 (push, pull, commit, etc.)
│   │   │   └── *.ts       # 顶层命令
│   │   ├── business/       # 业务逻辑
│   │   ├── utils/         # 工具函数
│   │   └── constant/      # 常量
├── server/                 # Express 后端
│   └── src/
│       ├── controllers/    # 路由控制器
│       ├── shared/        # 工具函数
│       └── index.ts       # 入口文件
├── shared/                 # 共享包 (CLI 和 Server 共用)
│   └── src/
│       ├── constant/      # 全局常量 (HTTP 状态码、路径等)
│       ├── utils/         # 纯工具函数 (pythonUtils, sql, secret)
│       └── types/         # 全局类型定义
└── ui/                    # Vue 3 前端
    └── src/
        ├── views/        # 页面组件
        ├── components/   # 公共组件
        ├── hooks/        # Vue hooks
        └── store.ts      # Pinia 状态管理
```

## 架构模式

### CLI 命令组织

-   顶层命令在 `commands/` 目录，如 `git.ts`、`ai.ts`
-   子命令在对应子目录，如 `commands/git/` 下 `push.ts`、`pull.ts`

### Business 业务逻辑 (Factory 模式)

-   `business/` 目录下按功能领域划分模块
-   复杂模块使用 Factory 模式：`core/Factory.ts` + `implementations/` 多态实现
-   简单模块直接 `service.ts` 导出

## 路径别名

在 `packages/cli/tsconfig.json` 中配置：

-   `@/*` → `packages/cli/src/*`
-   `@cli-tools/shared/*` → `packages/shared/src/*`

## 重要配置

-   `config.json`: 包含服务器端口、前缀等配置
-   `package.json` 中的 `MODE` 环境变量控制构建模式 (`cli` | `cliTest` | `report`)
