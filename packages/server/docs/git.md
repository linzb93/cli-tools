# git

这是本项目所有 git 命令的说明文档。

## git deploy

一键部署 git 项目(包括 push 和 打标签)，支持以下部署方式：

-   从开发分支合并到测试分支并部署
-   从开发分支合并到主分支并部署
-   从主分支部署
-   部署至 Github
-   只推送到当前分支，不部署

部署完成后，支持打开 jenkins 对应的地址，同一个项目可能存在不同的部署站点，支持多个部署站点信息配置。这是公司项目才有的功能。

jenkins 地址配置方法：

-   在项目的`package.json`中添加`jenkins`字段，值有两种，分别是对象和对象数组。
-   对象格式如下：

```json
{
    "name": "店客多", // 项目目录名称，测试站
    "id": "dkd-jysq", // 项目id，测试站
    "type": "wmb", // 项目类型，非必填。
    "onlineId": "dkd-jysq", // 项目id，正式站
    "onlineName": "店客多" // 项目目录名称，正式站
}
```

### 使用方法

```bash
$ mycli git deploy [options]
```

例如，部署到正式站点，tag 的名称是 1.2.3。

```bash
$ mycli git deploy --prod --version=1.2.3
```

### 选项

#### prod

代码合并到 master 分支。如果当前是在开发分支，会有询问是否合并到 master 分支，避免误操作。

类型：`boolean`。

默认值：`false`。

#### version

tag 的版本号。

类型：`string`。

#### open

部署完成后自动打开 jenkins 对应的地址。

类型：`boolean`。

默认值：`false`。

#### type

部署的类型，就是在 tag 版本号前面加上的字符。打开或选择 Jenkins 地址时，会根据`package.json`中的`jenkins`字段来判断。

类型：`string`。

默认值：`v`。

#### commit

必填项。提交的信息，会根据提交信息的内容格式化。

类型：`string`。

#### current

简写：`c`

只推送当前分支，不合并。

#### msg

是否将提交信息复制进剪贴板。

类型：`boolean`。

默认值：`false`。

## git branch

管理当前项目的分支，包括查询、删除等。

### 使用方法

```bash
$ mycli git branch [options]
```

### 选项

#### 默认

查询项目所有分支信息，包括创建时间。

#### delete

删除分支。

简写：`d`

类型：`boolean`

默认值：`false`

## git clone

支持从 github、git 地址或者 npm 网站 clone 项目

### 使用方法

```bash
$ mycli git clone <url> [options]
```

### 参数

-   url: 项目地址

### 选项

-   dir: 选择安装的目录
-   from: 来源
-   open: 在 VSCode 中打开项目

## git push

将本地分支推送到远程仓库。

### 使用方法

```bash
$ mycli git push [options]
```

### 选项

#### force

强制推送并设置上游分支。当设置该选项时，命令会执行 `git push --set-upstream origin {branchName}`，其中 branchName 是当前分支的名称。

简写：`f`

类型：`boolean`

默认值：`false`

## git pull

从远程仓库拉取最新代码并合并到本地分支。

### 使用方法

```bash
$ mycli git pull
```

该命令会自动处理代码合并冲突的情况。

## git commit

提交本地代码，无推送。

### 使用方法

```bash
$ mycli git commit [options]
```

该命令会格式化提交内容。

## git tag

管理 Git 标签，支持添加、删除和同步标签。

### 基本用法（添加标签）

```bash
$ mycli git tag [options]
```

默认情况下，直接执行 `git tag` 命令会创建一个新标签并推送到远程仓库。新标签的版本号将基于当前最新标签自动生成。

例如，如果当前最新标签是 `v4.9.5`，则新标签将为 `v4.9.5.1`。如果再次执行，下一个标签将是 `v4.9.5.2`。

### 选项

#### version

设置具体的版本号。指定版本号时需要使用三段式版本号，且版本号必须大于当前最新版本。

类型：`string`

例如：

```bash
$ mycli git tag --version=4.9.6  # 创建标签 v4.9.6
```

#### type

设置标签类型前缀，默认为 `v`。

类型：`string`

默认值：`v`

例如：

```bash
$ mycli git tag --type=wm  # 如果当前最新标签是 wm1.0.0，将创建标签 wm1.0.0.1
```

#### msg

是否将提交信息复制进剪贴板。

类型：`boolean`。

默认值：`false`。

### 删除标签

```bash
$ mycli git tag delete
```

此命令会列出所有本地标签，允许选择要删除的标签。选择完成后，会删除所选的本地标签，并尝试删除对应的远程标签（如果远程仓库不存在该标签则忽略）。

### 同步标签

```bash
$ mycli git tag sync
```

此命令会删除所有本地标签，然后从远程仓库拉取所有标签，确保本地和远程标签保持同步。

## git merge

合并最近几次的提交。新的提交内容可以自定义，也可以合并之前所有的，用逗号连接。

### 基本用法

```bash
$ mycli git merge [options]
```

#### 选项

#### head

合并的次数，默认合并最近一次提交。

类型：`number`

默认值：`1`

例如：

```bash
$ mycli git merge --head=3
```

## git log

查询最近几次的提交记录，包括提交的分支、提交时间、提交信息和修改的文件。

### 基本用法

```bash
$ mycli git log [options]
```

### 选项

#### head

查询的次数，默认查询最近一次提交。

类型：`number`

默认值：`1`

例如：

```bash
$ mycli git log --head=3
```

#### path

查询的目录，默认查询当前目录。

类型：`string`

默认值：`.`
