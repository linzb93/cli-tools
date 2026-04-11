---
name: 'cli-doc-generator'
description: '为CLI命令生成说明文档，包括产品文档(product.md)和帮助文档(help.md)。当用户要求生成文档时调用。'
---

# CLI Document Generator

此技能用于为 CLI 命令模块生成规范的文档。它可以根据需求生成两种类型的文档：

1.  **产品文档 (Product Doc)**:

    -   **目标读者**: AI 助手、开发者。
    -   **内容**: 包含设计思路、核心价值、用户故事、Mermaid 流程图等。
    -   **文件名**: `product.md`。

2.  **帮助文档 (Help Doc)**:
    -   **目标读者**: 最终用户。
    -   **内容**: 包含使用说明、参数列表、配置项等。
    -   **文件名**: `help.md`。

## 使用场景

-   当用户要求生成“产品文档”、“AI说明文档”或“product.md”时，使用产品文档生成逻辑。
-   当用户要求生成“帮助文档”、“使用文档”或“help.md”时，使用帮助文档生成逻辑。
-   如果用户未指定类型，或者要求生成所有文档，则同时生成两者。

## 执行逻辑

### 1. 确定生成类型

根据用户指令判断需要生成的文档类型。

### 2. 定位模块

根据用户输入的模块名称，在 `packages/cli/src/business` 下找到对应的目录。

### 3. 加载并执行生成规范

#### 生成 Product Doc

请读取并遵循 [product-doc.md](./references/product-doc.md) 中的详细步骤。

-   **核心任务**: 读取 `service.ts` 和 `index.ts`，绘制 Mermaid 流程图，编写核心价值和用户故事。
-   **输出路径**: `<module_path>/docs/product.md`

#### 生成 Help Doc

请读取并遵循 [help-doc.md](./references/help-doc.md) 中的详细步骤。

-   **核心任务**: 提取命令行参数和选项定义，编写使用示例。
-   **输出路径**: `<module_path>/docs/help.md`

## 参考文件

-   [product-doc.md](./references/product-doc.md)
-   [help-doc.md](./references/help-doc.md)
