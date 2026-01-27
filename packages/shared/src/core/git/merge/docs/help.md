# git merge

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