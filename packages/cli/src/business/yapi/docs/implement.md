# Yapi 命令实现规则

## 项目结构

```
src/core/yapi/
├── README.md          # 本文档
├── auth.ts           # 身份验证相关代码
├── api.ts            # API 请求相关代码
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
    - token 过期自动获取新 token，无需中断任务。

3. 生成文档存储结构：
    - API 文档存储在 `docs/api/content` 目录
        - origin.json 原始 JSON 数据
        - api.md 由 AI 解析的阅读性高的文档
    - 索引文件存储在 `docs/api/index.json`
