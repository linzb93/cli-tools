## 创建目录

```bash
mkdir 目录名
```

创建多级目录：

```bash
mkdir -p a/b/c
```

## 创建文件

```bash
# 空文件
touch 文件名

# 带内容
echo "内容" > 文件名

# 追加内容
echo "内容" >> 文件名

# 多行内容
cat > 文件名 <<EOF
第一行
第二行
EOF
```

## 打开目录

```bash
# 用 Finder 打开当前目录
open .

# 用 Finder 打开指定目录
open 目录路径
```

## 打开文件

```bash
# 用默认程序打开
open 文件名

# 用 VSCode 打开
code 文件名
```

## 在目录中查询文件内的关键词

### grep（推荐）

```bash
# 在当前目录递归搜索
grep -r "关键词" .

# 指定文件类型（需配合 --include）
grep -r "关键词" --include="*.ts" .
grep -r "关键词" --include="*.md" .

# 显示行号
grep -rn "关键词" .

# 忽略大小写
grep -ri "关键词" .

# 只输出匹配的文件名
grep -rl "关键词" .

# 显示匹配行前后文
grep -r -C 3 "关键词" .     # 前后各 3 行
grep -r -A 2 "关键词" .     # 后 2 行
grep -r -B 2 "关键词" .     # 前 2 行

# 使用正则搜索
grep -r "^import " --include="*.ts" .   # 搜索以 import 开头的行

# 反向匹配（不含关键词的行）
grep -rv "关键词" .

# 仅统计匹配次数
grep -rc "关键词" .
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
```
