# Yapi 命令实现规则

## 项目结构

```
src/core/yapi/
├── README.md          # 本文档
├── auth.ts           # 身份验证相关代码
├── api.ts            # API 请求相关代码
├── types.ts          # 类型定义
└── index.ts          # 入口文件
```

## 功能说明

Yapi 命令用于从 Yapi 平台获取 API 文档并保存到本地。支持以下功能：

1. 支持多种 URL 格式解析：

    - 项目所有 API: `/project/:projectId`
    - 分类下的 API: `/project/:projectId/cat_:catId`
    - 单个 API: `/project/:projectId/interface/api/:apiId`

2. 身份验证管理：

    - 支持自动登录获取 token
    - 支持手动输入 token
    - token 过期自动处理

3. 文档存储结构：
    - API 文档存储在 `docs/api/content` 目录
    - 索引文件存储在 `docs/api/index.json`

## 代码规范

### 1. 类型定义规范

-   所有接口和类型定义必须使用 TypeScript，并放在`types.ts`中
-   每个接口必须包含完整的 JSDoc 注释
-   不允许使用`any`类型，使用`unknown`替代
-   示例：

```typescript
/**
 * Yapi接口返回数据结构
 */
interface YapiResponse<T> {
    /**
     * 错误码
     * @default 0
     */
    errcode: number;

    /**
     * 错误信息
     * @default ""
     */
    errmsg: string;

    /**
     * 响应数据
     */
    data: T;
}
```

### 2. 错误处理规范

-   所有可能的错误都需要被捕获并处理
-   错误信息需要清晰明确
-   使用统一的错误码常量
-   示例：

```typescript
const ERROR_CODES = {
    TOKEN_EXPIRED: 40011,
} as const;
```

### 3. API 请求规范

-   使用 axios 进行 HTTP 请求
-   请求 URL 参数使用`qs.stringify`处理
-   并发请求使用`p-map`控制
-   示例：

```typescript
const response = await axios.get(url, {
    params: {
        token: this.token,
        id: projectId,
    },
    paramsSerializer: (params) => qs.stringify(params),
});
```

### 4. 文件存储规范

-   API 文档按项目/分类/接口层级存储
-   文件名使用 API 的 ID
-   索引文件包含完整的目录结构
-   示例结构：

```
docs/api/
├── content/
│   ├── project_123/
│   │   ├── api_456.json
│   │   └── api_789.json
│   └── project_456/
└── index.json
```

### 5. 身份验证规范

-   token 存储在本地数据库中
-   提供自动和手动两种 token 获取方式
-   token 过期需要自动处理

### 6. 日志规范

-   使用统一的 Logger 类
-   区分不同级别的日志
-   包含必要的上下文信息

## 性能优化

1. 并发控制

    - 使用`p-map`控制并发请求数量
    - 默认并发数：5

2. 缓存策略

    - 本地缓存 API 文档
    - 增量更新机制

3. 错误重试
    - 网络请求失败自动重试
    - 最大重试次数：3

## 测试要求

1. 单元测试

    - 覆盖所有核心功能
    - 模拟各种错误场景

2. 集成测试
    - 测试完整的文档获取流程
    - 验证文件存储正确性

## 文档要求

1. 代码注释

    - 使用 JSDoc 格式
    - 包含参数和返回值说明
    - 示例代码（如适用）

2. 接口文档
    - 详细的接口说明
    - 请求/响应示例
    - 错误码说明

## 发布规范

1. 版本控制

    - 遵循语义化版本
    - 记录版本变更

2. 代码审查
    - 提交前进行代码审查
    - 确保符合项目规范
