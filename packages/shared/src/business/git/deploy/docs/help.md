# git deploy

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

默认值：`true`。
