# git log

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