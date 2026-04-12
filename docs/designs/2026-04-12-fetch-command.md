# 功能: fetch 命令

**日期**: 2026-04-12
**状态**: 计划中
**相关命令**: fetch
**业务代码位置**: `packages/cli/src/business/fetch/`

## 背景 / Context

项目中已有 `curl` 命令（从剪贴板解析 curl 命令并生成 axios 代码），但缺少一个直接发送 HTTP/IPC 请求的工具。需要一个新的 `fetch` 命令，能够快速发送 HTTP 请求或 IPC 请求，无需编写额外代码。

## 需求

- **命令格式**：`mycli fetch <url> [data] [options]`
- **自动判断类型**：URL 以 `http` 开头为 HTTP 请求，否则为 IPC 请求
- **HTTP 请求**：
  - 默认 POST，支持 `--method get` 改成 GET
  - 使用 axios 实现
  - data 默认作为请求体
  - 如果 data 只包含 `headers` 和 `data` 两个属性，则分别作为请求头和请求体
- **IPC 请求**：
  - 使用 `net` 模块连接 Unix socket
  - data 为请求体，发送 JSON 数据
- **输入方式**：
  - 命令行参数直接传入 data
  - `--clipboard` 选项从剪贴板读取 data
- **输出格式**：JSON 数据（直接打印到控制台）

## 最终实现方案

### CLI 接口设计

```
mycli fetch <url> [data] [options]
```

**位置参数**：
- `url`（必填）：请求地址
  - `http://` 或 `https://` 开头 → HTTP 请求
  - 其他（如 `/var/run/xxx.sock`）→ IPC 请求
- `data`（可选）：请求数据，JSON 字符串

**选项**：
- `--clipboard, -c`：从剪贴板读取请求数据
- `--method, -m`：HTTP 方法，仅支持 `post`（默认）和 `get`

### 行为说明

**HTTP 请求**：
1. 解析 url 获取协议、主机、端口、路径
2. 如果提供了 data：
   - 用 `JSON.parse` 解析
   - 如果解析结果是只包含 `headers` 和 `data` 两个属性的对象，则提取出 `headers` 和 `data` 分别设置
   - 否则直接将 data 作为请求体
3. 使用 axios 发送请求
4. 响应体直接打印为 JSON

**IPC 请求**：
1. 使用 `net` 模块连接 url（作为 Unix socket 路径）
2. data 用 `JSON.parse` 解析后发送
3. 等待响应，响应数据直接打印为 JSON

**错误处理**：
- JSON.parse 失败时打印错误信息
- 网络请求失败时打印错误信息

### 与现有命令的兼容性

- 独立命令，不影响现有命令
- 与 `curl` 命令功能互补，无冲突

## 修改点一览（设计层面）

- **入口层**：
  - `packages/cli/src/commands/fetch.ts` — 命令入口文件，定义命令和参数
  - `packages/cli/src/cli.ts` — 注册 fetch 命令

- **业务逻辑层**：
  - `packages/cli/src/business/fetch/service.ts` — 核心服务，区分 HTTP/IPC 并执行请求
  - `packages/cli/src/business/fetch/http.ts` — HTTP 请求逻辑（使用 axios）
  - `packages/cli/src/business/fetch/ipc.ts` — IPC 请求逻辑（使用 net 模块）
  - `packages/cli/src/business/fetch/types.ts` — 类型定义

- **工具层**：
  - `packages/cli/src/business/fetch/utils.ts` — 工具函数（如解析 data、判断类型等）

## 代码分析

### 现有相关代码参考

1. **`packages/cli/src/utils/http/index.ts`**：axios 封装，可参考
2. **`packages/cli/src/business/fork/service.ts`**：有使用 `net` 模块的潜在代码（被注释），可参考 socket 处理方式
3. **`packages/cli/src/commands/curl.ts`**：命令入口模式，可参考

### 关键实现点

1. **data 解析逻辑**：
   ```typescript
   const parsedData = JSON.parse(data);
   if (isHeadersAndData(parsedData)) {
     headers = parsedData.headers;
     body = parsedData.data;
   } else {
     body = parsedData;
   }
   ```

2. **HTTP/IPC 区分**：
   ```typescript
   const isHttp = url.startsWith('http');
   ```

3. **IPC socket 通信**：需要处理 JSON 序列化/反序列化，以及 socket 结束后的数据收集

## 备注

- IPC 请求的 socket 通信需要处理数据边界问题，确保完整的 JSON 数据被收集后再解析
- 暂不支持超时控制，后续可扩展
- 暂不支持请求前/后的 hook，后续可扩展
