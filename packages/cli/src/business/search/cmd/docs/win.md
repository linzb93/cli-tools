## 创建目录

```bash
mkdir 目录名
# 或
md 目录名
```

创建多级目录：

```bash
mkdir -p a/b/c
```

## 创建文件

```bash
# 空文件
type nul > 文件名

# 带内容
echo 内容 > 文件名

# 追加内容
echo 内容 >> 文件名

# 多行内容
(
echo 第一行
echo 第二行
) > 文件名
```

## 打开目录

```bash
# 用资源管理器打开当前目录
start .

# 用资源管理器打开指定目录
start 目录路径
```

## 打开文件

```bash
# 用默认程序打开
start 文件名

# 用记事本打开
notepad 文件名

# 用 VSCode 打开
code 文件名
```

## 在目录中查询文件内的关键词

### ripgrep (rg) — 推荐

```bash
# 在当前目录递归搜索（默认递归）
rg "关键词"

# 指定文件类型
rg "关键词" -t ts
rg "关键词" -t md

# 显示行号（默认已显示）
rg -n "关键词"

# 忽略大小写
rg -i "关键词"

# 只输出匹配的文件名
rg -l "关键词"

# 显示匹配行前后文
rg -C 3 "关键词"      # 前后各 3 行
rg -A 2 "关键词"      # 后 2 行
rg -B 2 "关键词"      # 前 2 行

# 使用正则搜索
rg "^import " -t ts   # 搜索以 import 开头的行

# 反向匹配（不含关键词的行）
rg -v "关键词"

# 仅统计匹配次数
rg -c "关键词"
```

## less

```bash
# 分页查看文件
less 文件名

# 退出 less
q
```

## bat

```bash
# 查看文件（带语法高亮、行号）
bat 文件名

# 查看 bat 文件
bat 文件名.bat
```
