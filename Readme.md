# cli

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
-   Vite: 构建工具
-   Commander: 命令行解析
-   Express: web 后端服务器
-   Vue 3: web 前端框架
-   husky: git 钩子，在 commit 时自动格式化代码
