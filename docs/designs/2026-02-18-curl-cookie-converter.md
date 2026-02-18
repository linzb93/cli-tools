# 功能: curl 命令 Cookie 转换与代码注入功能

**日期**: 2026-02-18
**状态**: 已完成

## 描述

增强 `curl` 命令生成的代码逻辑。当解析到 Cookie 时，不再直接生成硬编码的 Cookie 字符串，而是将 Cookie 解析为对象，并在生成的代码中注入一个辅助函数 `stringifyCookie`，用于动态将对象转换为 Cookie 字符串。这样生成的代码更易于阅读和修改 Cookie 值。

## 需求

1.  **Cookie 序列化函数**:

    -   创建一个函数 `stringifyCookie`，输入为一个 Object（键值对）。
    -   输出为符合 HTTP Cookie 格式的字符串（例如 `key1=value1; key2=value2`）。

2.  **代码生成增强**:
    -   在 `curl` 命令处理逻辑中，检测 Header 是否包含 Cookie。
    -   如果包含 Cookie：
        -   将 Cookie 字符串解析为 JSON 对象。
        -   在生成的 JavaScript 代码中，注入 `stringifyCookie` 函数的定义。
        -   在生成的 JavaScript 代码中，定义 `const cookieObj = { ... }` 变量。
        -   在 `axios` 请求配置的 `headers` 中，使用 `Cookie: stringifyCookie(cookieObj)` 替代原始字符串。

## 实现细节

-   **文件**: `packages/cli/src/business/cookie/service.ts`
    -   新增 `stringifyCookie` 函数并导出。
-   **文件**: `packages/cli/src/business/curl/service.ts`
    -   引入 `parseCookie`。
    -   在 `curlService` 函数中增加 Cookie 处理逻辑。
    -   使用模板字符串注入函数定义和对象定义。

## 备注

该功能使得从 Chrome 复制 curl 命令后生成的代码，在调试和修改 Cookie 参数时更加灵活。
