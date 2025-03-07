# shortcut

`shortcut` 是记录工作中最常用的两个应用（VSCode、Chrome 浏览器）快捷键的命令，根据系统（Windows 系统或 macOS 系统）不同展示不同的内容。

## 使用方法

```bash
$ mycli shortcut [options]
```

查找已记录的快捷键。例如这个是查找已记录的 vscode 快捷键。

```bash
$ mycli shortcut --type=vscode
```

## 选项

### 默认

显示所有已记录的快捷键。

### type

指定要查找的快捷键类型。
类型：`string`。
默认：`all`。
支持的类型如下：

-   all: 所有快捷键
-   vscode: VSCode 快捷键
-   chrome: Chrome 浏览器快捷键
