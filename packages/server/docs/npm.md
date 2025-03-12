# npm

npm 模块的命令行工具。

## npm search

查询单个/多个 npm 模块的信息

### 使用方法

```bash
$ mycli npm search <name>
```

使用方法：

-   npm search moduleName --open 查询单个模块，返回信息后，打开模块对应的主页
-   npm search module1 module2 查询多个 npm 模块，以 table 的方式输出`,

## npm has

判断本项目是否有某个模块，如果没有的话会确认是否安装，支持带 scope 的

### 使用方法

```bash
$ mycli npm has <name>
```

### 参数

-d: 如果没有安装，就添加到 devDependencies 中。`,
