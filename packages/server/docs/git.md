# git

这是本项目所有 git 命令的说明文档。

## git deploy

一键部署 git 项目(包括 push 和 打 tag)，支持以下部署方式：

-   从开发分支合并到测试分支并部署
-   从开发分支合并到主分支并部署
-   从主分支部署
-   部署至 Github

部署完成后，支持打开 jenkins 对应的地址，同一个项目可能存在不同的部署站点，支持多个部署站点信息配置。这是公司项目才有的功能。

jenkins 地址配置方法：

-   在项目的`package.json`中添加`jenkins`字段，值有两种，分别是对象和对象数组。
-   对象格式如下：

```json
{
    "name": "店客多", // 项目目录名称
    "id": "dkd-jysq", // 项目id
    "type": "wmb" // 项目类型，非必填。
}
```

### 使用方法

```bash
$ mycli git deploy [options]
```

例如，部署到正式站点，一般对应的是 master 分支，tag 的名称是 1.2.3。

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

部署的类型，就是在 tag 版本号前面加上的字符。默认是`v`。

类型：`string`。

默认值：`v`。

#### commit

提交的信息。会根据提交信息的内容格式化。

类型：`string`。

默认值：`feat:update`。

### current

简写：`c`

推送当前分支，不合并。

## git tag

管理当前项目的 tag，包括读取、创建、删除等。

### 使用方法

```bash
$ mycli git tag [options]
```

### 参数

#### tag

tag 的名称。
类型：`string`。

### 选项

#### delete

简写：`d`

批量删除 tag。

## git branch

管理当前项目的分支，包括读取、删除等。

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
