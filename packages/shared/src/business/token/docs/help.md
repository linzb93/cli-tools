# Token 解析模块

多策略Token解析工具，支持JWT和Base64等多种Token格式的解析，并提供友好的解析结果展示。

## 功能特性

- **多格式支持**: 自动识别并解析JWT和Base64编码的Token
- **智能解析**: 自动尝试所有可用的解析器，选择最合适的解析方式
- **时间戳处理**: 自动识别并转换时间戳为可读格式
- **格式化输出**: 提供彩色的解析结果展示
- **可扩展架构**: 支持通过工厂模式轻松添加新的解析器
- **错误容错**: 解析失败时提供友好的错误提示

## 使用方法

### 基本解析

```bash
$ mycli token <token_string>
```

### 带选项的解析

```bash
# 保留原始时间戳格式
$ mycli token <token_string> --origin

# 显示完整解析信息（包含JWT header等）
$ mycli token <token_string> --complete

# 同时使用多个选项
$ mycli token <token_string> --origin --complete
```

## 选项说明

### --origin

保留原始数据格式，时间戳不会被解析成标准时间格式。

类型：`boolean`

默认值：`false`

### --complete

显示完整数据，包括JWT的header信息等详细内容。

类型：`boolean`

默认值：`false`

## 解析器类型

### JWT解析器
- 支持标准JWT格式解析
- 自动处理带前缀的Token（如`occ_senior_`）
- 解析payload和header信息

### Base64解析器
- 解析Base64编码的字符串
- 自动尝试JSON解析
- 支持处理不完整的JSON字符串

## 输出格式

解析结果会以彩色格式输出，包含以下信息：
- Token类型识别结果
- 解析后的数据内容
- 时间戳字段（自动转换为可读格式）
- 错误信息（如果解析失败）

## 注意事项

- Token字符串需要用引号包裹，特别是包含特殊字符时
- 如果Token格式无法识别，会尝试所有可用的解析器
- 时间戳默认会自动转换为标准时间格式，使用`--origin`选项可保留原始格式
- JWT解析需要完整的Token格式（包含三个部分，用点号分隔）
- Base64解析器会尝试提取有效的JSON内容，即使字符串不完整