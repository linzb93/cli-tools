# cli-tools

自己工作用的命令行工具，旨在提高工作效率。项目分为命令行部分和 web 前端部分。代码分层，便于复用。

项目于 2019 年创建，根据公司和业务进行增减。

## 运行环境

-   NodeJS v14 - 主要运行环境
-   NodeJS v20 - 运行 ai 相关的功能
-   Python v3.12.3 - 处理 NodeJS 解决不了的功能

## 技术栈

-   monorepo: 项目架构，package 分成 server 和 web 前端两个，server 包括 cli 和 web 后端部分。
-   pnpm: 包管理
-   TypeScript 5
-   Vite 5: 构建工具
-   Commander: 命令行解析
-   Express: web 后端服务器
-   Vue 3: web 前端框架
-   husky: git 钩子，在 commit 时自动格式化代码

# 目录结构

```

├ packages/                        # 项目包
|     ├ cli/                       # 命令行
|     |   ├ src/
|     |   |   ├ bin-test.ts        # 开发版入口文件
|     |   |   ├ bin.ts             # 正式版入口文件
|     |   |   ├ commands/          # 命令模块列表
|     |   |   |     └ module.ts    # 模块入口文件
|     |   |   ├ hooks/             # 生命周期钩子函数
|     |   |   └ utils/             # 工具函数
|     ├ server/                    # 服务器
|     |    ├ src/
|     |    |   ├ controllers/      # 控制器
|     |    |   |       └ module.ts # 控制器模块
|     |    |   ├ index.ts          # 入口文件
|     |    |   ├ shared/           # 工具函数
|     |    |   └ types/            # 类型定义
|     ├ shared/                                # 共享项目
|     |    ├ src/
|     |    |  ├ constants/                     # 全局常量（如状态码、错误码）
|     |    |  ├ utils/                         # 纯工具函数（不含业务逻辑，如 date, string 处理）
|     |    |  ├ base/                          # 顶层抽象基类（核心架构）
|     |    |  |   ├ BaseService.ts             # 所有业务执行文件的基类
|     |    |  |   └ BaseFactory.ts             # 抽象工厂基类
|     |    |  ├ business/                       # 业务代码核心（按功能领域划分）
|     |    |  |   ├ module-a/                  # 简单模块
|     |    |  |   |    ├ index.ts              # 统一出口
|     |    |  |   |    ├ Service.ts            # 业务实现
|     |    |  |   |    └ types.ts              # 模块专用类型
|     |    |  |   ├ module-b/                  # 复杂模块（工厂模式）
|     |    |  |   |    ├ core/                 # 模块内部抽象与工厂
|     |    |  |   |    |   ├ AbstractWorker.ts # 模块级抽象执行类
|     |    |  |   |    |   └ Factory.ts        # 继承自 BaseFactory
|     |    |  |   |    ├ implementations/      # 多态实现类
|     |    |  |   |            ├ WorkerA.ts
|     |    |  |   |            └ WorkerB.ts
|     |    |  |   |    ├ types.ts
|     |    |  |   |    └ index.ts
|     |    |  |   ├ parent-module/             # 父子模块结构
|     |    |  |   |      ├ common/             # 父模块内子模块复用的代码
|     |    |  |   |      ├ sub-module-1/
|     |    |  |   |      └ sub-module-2/
│     |    |  └ types/                         # 全局公用类型（跨模块的 DTO、通用接口）
|     ├ ui/                        # 前端项目
|     |  ├ src/
|     |  |   ├ App.vue             # 组件入口文件
|     |  |   ├ components/         # 组件目录
|     |  |   ├ helpers/            # 工具函数目录
|     |  |   ├ hooks/              # 钩子目录
|     |  |   ├ main.ts             # 入口文件
|     |  |   ├ router.ts           # 路由文件
|     |  |   ├ store.ts            # 全局状态管理文件
|     |  |   ├ styles/             # 样式目录
|     |  |   ├ views/              # 页面列表目录
|     |  |   |    └ module/        # 页面目录
```
