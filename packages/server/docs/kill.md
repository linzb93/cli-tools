# kill

根据进程 id 或者端口号来杀死进程的命令。

## 使用方法

```bash
$ mycli kill [type] [id]
```

例如，这是关闭 id 为`12345`的进程。

```bash
$ mycli kill pid 12345
```

## 参数

### type

指定要查找的进程类型。
类型：`string`。
默认：`pid`。
支持的类型如下：

-   pid: 进程 id
-   port: 端口号

### value

要查找的进程 id 或者端口号。当 type 为 pid 时，value 为进程 id；当 type 为 port 时，value 为端口号。
类型：`number`。
