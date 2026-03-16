# Product Doc Generator

这是一个专门用于生成产品文档的技能。

## 用途

当用户想要为某个命令或模块（如 `cookie`, `git/branch`）生成产品文档时，请调用此技能。

## 执行步骤

1. **定位模块**
   根据用户输入的模块名称，在 `packages/cli/src/business` 下找到对应的目录。

2. **收集信息**
   读取该模块目录下的以下文件（如果存在）：

    - `docs/help.md`
    - `docs/implement.md` (如果存在，需读取其内容用于合并)
    - `service.ts`（核心逻辑）
    - `index.ts`（命令入口）

3. **参考模板**
   **严格遵循** `packages/cli/src/business/analyse/cli/docs/product.md` 的文档结构和写作风格。
   请参考该文件中的：

    - 核心价值 (Value Proposition)
    - 用户故事 (User Stories)
    - 功能特性 (Features)
    - 命令行参数 (Command Arguments)
    - 交互设计 (User Experience)
    - 技术实现 (Technical Implementation) - _必须包含 Mermaid 流程图_
    - 约束与限制 (Constraints)

4. **生成文档**
   基于收集到的代码和文档信息，编写 `product.md`。

    - **核心价值**：提炼该命令解决的问题。
    - **用户故事**：模拟用户场景。
    - **技术实现**：根据 `service.ts` 的逻辑绘制 Mermaid 流程图（**必须使用中文**描述节点和流程）。
    - **CRITICAL / 强制要求**：在绘制 Mermaid 流程图之前，**必须**先分析代码结构是否存在“分流逻辑”（如根据配置、项目类型、输入参数调用不同的处理函数或类）。
        - **如果存在分流逻辑**（例如 `if (isGithub) A() else B()`），**严禁**将所有逻辑绘制在一个巨大的流程图中。
        - **必须**拆分为多个独立的流程图：
            1. **总入口分流图 (Main Dispatch Flow)**：仅展示入口判断逻辑和分发目标。
            2. **具体执行图 (Sub-Flows)**：为每个独立的处理分支（如 `GithubDeploy`, `CompanyDeploy`）分别绘制详细的内部执行流程图。
    - **CRITICAL / 语法检查**：生成 Mermaid 流程图代码后，**必须**自我检查语法是否正确。
        - **特殊字符转义**：如果节点文本中包含特殊字符（如 `?`, `:`, `(`, `)`, `[`, `]`, `{`, `}` 等），**必须**使用双引号包裹文本（例如 `A["Is valid?"]` 而不是 `A[Is valid?]`）。
        - **避免渲染错误**：确保生成的代码可以在标准 Mermaid 渲染器中正常显示。
    - **内容合并**：如果存在 `implement.md`，将其中的技术细节、设计思路等有价值内容整合进 `product.md` 的相应章节。
    - **命令行参数**：从代码中分析参数定义。

5. **输出结果**

    - 使用 `Write` 工具将生成的文档保存到该模块的 `docs/product.md` 路径下（如果 `docs` 目录不存在需先创建）。

6. **清理旧文件 (CRITICAL / 必须执行)**
    - 如果步骤 2 中读取了 `docs/implement.md`，在 `product.md` 生成并保存成功后，**必须立即删除** `docs/implement.md` 文件，避免冗余。
    - **不要跳过此步骤**。
