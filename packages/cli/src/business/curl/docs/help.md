# curl 模块

该模块用于将 `curl` 命令转换为 Node.js `axios` 请求代码。它自动从系统剪贴板读取 `curl` 命令，解析并生成对应的 JavaScript 代码，然后将结果写回剪贴板。

## 功能特性

-   **剪贴板读取**：直接从系统剪贴板获取输入，无需手动粘贴。
-   **多平台支持**：自动识别并支持 Bash、CMD (Windows Command Prompt) 和 PowerShell 格式的 curl 命令。
-   **代码生成**：生成基于 `axios` 的完整请求代码，处理 URL、Method、Headers 和 Body。
-   **智能解析**：支持 JSON 数据、表单数据 (`application/x-www-form-urlencoded`) 等多种请求体格式。

## 使用方法

首先，复制一段 `curl` 命令到剪贴板。

然后运行以下命令：

```bash
$ mycli curl [options]
```

执行成功后，生成的代码将自动复制到您的剪贴板中。

## 选项说明

### --full

是否包含所有 Header 字段。默认情况下，为了代码简洁，可能会过滤掉一些非必要的 Header（只保留 `content-type`, `cookie`, `token`, `referer`, `user-agent`）。

类型：`boolean`
默认值：`false`

### --extra

指定需要额外保留的 Header 字段，多个字段用逗号分隔。

类型：`string`
示例：`--extra="Authorization,x-custom-header"`

## 注意事项

-   确保剪贴板中包含有效的 `curl` 命令（以 `curl` 或 `Invoke-WebRequest` 开头）。
-   生成的代码依赖 `axios` 库，如果涉及表单上传可能依赖 `form-data` 库。
-   PowerShell 格式支持 `Invoke-WebRequest` 和 `New-Object Microsoft.PowerShell`。
