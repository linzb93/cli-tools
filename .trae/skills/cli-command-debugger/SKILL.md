---
name: 'cli-command-debugger'
description: '开启CLI命令调试开发模式。当用户要求开发、调试(debug)或测试(test)某个特定的CLI命令（例如"调试analyse命令"）时调用。'
---

# CLI 命令调试器

这个 skill 用于自动化 CLI 命令的调试开发流程。当用户想要开发或调试某个特定的 CLI 命令时，它会：

1. 从项目根目录下的`./packages/cli/src/bin.ts` 中提取指定的命令代码（包括 import 语句）
2. 将提取的代码复制到项目根目录下的 `./packages/cli/src/bin-test.ts`
3. 清除 bin-test.ts 中之前其他命令的代码
4. 运行 `npm run dev` 启动调试模式，**之后结束对话，不需要再完成任何事**。

## 使用方法

当用户说：

-   "开发 xxx 命令"
-   "调试 xxx 命令"

其中 xxx 是命令名称（如 ai, git, beauty 等）。

## 处理流程

1. 解析用户请求中的命令名称
2. 在 bin.ts 中搜索对应的命令定义和 import 语句
3. 更新 bin-test.ts 文件，只保留目标命令的代码
4. 执行 npm run dev 启动调试，**之后结束对话，不需要再完成任何事**。

## 注意事项

-   确保正确处理 import 语句的依赖关系
-   保持 bin-test.ts 的基本结构（program 初始化、hook 设置等）
-   只替换 `//**** 请在这里替换需要调试的代码 ****` 注释之间的内容
