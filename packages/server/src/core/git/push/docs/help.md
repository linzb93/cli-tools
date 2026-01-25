# git push

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