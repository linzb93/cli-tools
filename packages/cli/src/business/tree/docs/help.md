# 目录树显示

以树形结构展示目录和文件层级关系，支持自定义层级深度、忽略规则和输出格式。

## 功能特性

- 以树形结构显示目录层级
- 支持自定义遍历层级深度
- 可忽略指定目录（如 node_modules、.git 等）
- 支持中文文件名长度计算
- 可选复制结果到剪贴板
- 支持添加文件/目录注释
- 美观的层级连接线显示

## 使用方法

```bash
$ mycli tree [directory] [options]
```

### 示例

```bash
# 显示当前目录的树形结构
$ mycli tree

# 显示指定目录的树形结构
$ mycli tree ./src

# 显示2层深度的目录结构
$ mycli tree --level=2

# 忽略 node_modules 和 dist 目录
$ mycli tree --ignore=node_modules,dist

# 复制结果到剪贴板
$ mycli tree --copy

# 显示带注释的树形结构
$ mycli tree --comment

# 组合使用多个选项
$ mycli tree ./src --level=3 --ignore=node_modules --copy --comment
```

## 选项说明

### --level

设置遍历的层级深度，不指定则遍历全部层级。

类型：`number`

默认值：`1`

### --ignore

指定要忽略的目录名称，多个目录用逗号分隔。

类型：`string`

默认值：`node_modules,.git,.DS_Store`

### --copy

是否将生成的树形文本复制到剪贴板。

类型：`boolean`

默认值：`false`

### --comment

是否在每行末尾添加文件/目录类型注释。

类型：`boolean`

默认值：`false`

## 输出格式

### 标准输出

```
project/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   └── Input.tsx
│   └── utils/
│       └── helper.ts
├── package.json
└── README.md
```

### 带注释输出

```
project/                    # 目录
├── src/                    # 目录
│   ├── components/         # 目录
│   │   ├── Button.tsx    # 文件
│   │   └── Input.tsx     # 文件
│   └── utils/              # 目录
│       └── helper.ts       # 文件
├── package.json          # 文件
└── README.md             # 文件
```

## 使用场景

- 快速了解项目目录结构
- 生成文档中的目录树示例
- 检查文件组织情况
- 分享项目结构给他人
- 代码审查时的结构参考

## 注意事项

- 默认忽略 `node_modules`、`.git`、`.DS_Store` 等常见目录
- 支持中文文件名和路径的正确显示
- 层级连接线使用 Unicode 字符，确保终端支持
- 大目录扫描可能需要一些时间
- 复制功能需要系统支持剪贴板访问