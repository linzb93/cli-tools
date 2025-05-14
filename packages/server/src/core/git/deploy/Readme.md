# Git Deploy 命令实现计划

## 功能概述

`git deploy` 命令用于一次性完成 git 代码提交、拉取、推送等功能，简化开发流程。该命令会根据项目类型（公司项目或 GitHub 项目）和所在分支执行不同的任务流程。

## 架构设计

采用面向对象和多态设计模式实现，具体结构如下：

1. `BaseDeployCommand`(抽象基类): 定义通用方法和抽象方法

    - 共用方法：`executeBaseCommands`, `mergeToBranch`等
    - 抽象方法：`handleProjectDeploy`

2. `CompanyDeployCommand`(具体实现类): 处理公司项目相关逻辑

    - 实现分支处理方法：`handleMasterBranch`, `handleReleaseBranch`, `handleOtherBranch`

3. `GithubDeployCommand`(具体实现类): 处理 GitHub 项目相关逻辑

    - 实现分支处理方法：`handleMainBranch`, `handleOtherBranch`

4. `DeployCommandFactory`(工厂类): 根据项目类型创建对应的命令实例

5. 主入口类: 接收命令参数，使用工厂创建命令实例并执行

## 基础命令

所有项目类型都会执行的基础命令：

1. `git add .` - 将所有已修改代码添加到暂存区
2. `git commit -m <message>` - 提交代码（提交信息会根据内容自动添加前缀）
3. `git pull` - 拉取远端代码
4. `git push` - 推送代码到远端仓库

## 项目类型判断

-   通过检查远程仓库 URL 是否包含"github.com"来判断是否为 GitHub 项目
-   非 GitHub 项目则视为公司项目

## 公司项目流程

### master 分支

-   若指定`--prod`选项：执行基础命令 + 打 tag + 复制项目名称和 tag 到剪贴板
-   若指定`--current`选项：仅执行基础命令
-   若未指定以上选项：询问是否发布项目，根据选择走对应流程

### release 分支

-   执行基础命令
-   若未指定`--open=false`：打开项目的 Jenkins 主页

### 其他分支

-   若指定`--prod`选项：执行基础命令 + 打 tag + 复制项目名称和 tag 到剪贴板
-   若指定`--current`选项：仅执行基础命令
-   若未指定以上选项：执行基础命令 + 合并到 release 分支 + 打开 Jenkins 主页 + 切回原分支

## GitHub 项目流程

### 主分支（main/master）

-   仅执行基础命令

### 其他分支

-   执行基础命令
-   若指定`--prod`选项：合并到主分支并推送

## 命令选项

-   `--prod`: 是否发布到 master/main 分支
-   `--type <type>`: 项目类型，用于标记 tag
-   `--version <version>`: 项目版本号，用于标记 tag
-   `--open`: 是否打开项目对应的 Jenkins 主页
-   `--commit <message>`: git commit 提交信息（必填）
-   `-c, --current`: 仅完成基础命令后结束任务

## 错误处理

-   代码冲突：暂停任务，询问用户是否已解决冲突
    -   若已解决：执行`git add .`和`git commit -m conflict-fixed`，继续任务
    -   若未解决：结束任务

## 多态设计的优点

1. **代码组织更清晰**：将不同项目类型的处理逻辑分离到各自的类中
2. **遵循单一职责原则**：每个类只负责一种类型项目的部署流程
3. **易于扩展**：若需要支持新的项目类型，只需添加新的实现类
4. **逻辑封装**：共用功能在基类中实现，特定功能在子类中实现
5. **依赖抽象而非具体实现**：主程序依赖于抽象基类，而非具体实现
