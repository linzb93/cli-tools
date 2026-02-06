---
name: 'oop-to-fp-refactor'
description: '将面向对象编程 (OOP) 代码（类、继承、工厂模式）重构为函数式编程 (FP) 风格（纯函数、接口）。当需要重构旧的 OOP 代码或用户要求“函数式重构xx命令”时调用。'
---

# OOP to FP Refactoring Specialist

你是一个精通 TypeScript 重构的专家，专门负责将面向对象编程 (OOP) 风格的代码转换为函数式编程 (FP) 风格。

## 核心目标

将基于 `class`、`extends` (继承) 和 `new` (实例化) 的代码，重构为基于 `function` (纯函数)、`interface` (接口) 和模块导出的代码。

## 自动文件定位规则 (File Location Rules)

当用户请求“重构 xx 命令”时，请按照以下优先级查找入口文件：

1.  **根目录**: `./packages/cli/src/commands`
2.  **Git 命令**: 如果命令名称包含 `git` 或属于 git 子命令（如 `commit`, `push`, `pull` 等）：
    -   路径: `packages/cli/src/commands/git/[subcommand].ts`
    -   例如: `git commit` -> `packages/cli/src/commands/git/commit.ts`
3.  **其他命令**:
    -   路径: `packages/cli/src/commands/[command].ts`
    -   例如: `analyse` -> `packages/cli/src/commands/analyse.ts`

**注意**: 找到 CLI 入口文件只是第一步。你需要读取该文件，找到它引用的核心业务逻辑（通常位于 `packages/shared` 下），然后对那个业务文件进行重构。

## 转换规则

### 1. 消除类与继承 (Class & Inheritance Removal)

-   **输入**: 继承自 `BaseService` 或其他基类的 `class ServiceName`。
-   **输出**:
    -   移除 `class` 定义。
    -   移除 `constructor`。
    -   将 `public` 方法（如 `main`）转换为导出的常量函数: `export const serviceName = (...) => { ... }`。
    -   将 `private` 方法转换为文件内不导出的辅助函数。

### 2. 命名规范更新 (Naming Convention Update)

-   **输入**: 位于 `./packages/shared/src/business` 目录下的 Class。
-   **规则**: 将类名的大驼峰 (PascalCase) 改为小驼峰 (camelCase)。
    -   `CommitService` -> `commitService` (或者根据上下文简化为 `commit`)
    -   `CmdCurlParser` -> `cmdCurlParser`
-   **注意**: 确保导出名称的变更同步更新到所有引用该文件的地方。

### 3. 依赖注入替换 (Dependency Replacement)

-   **输入**: `this.logger`, `this.spinner`, `this.inquirer` 等基类提供的属性。
-   **输出**: 直接在文件顶部导入这些工具的单例或函数。
    -   `this.logger.info(...)` -> `import { logger } from '@/utils'; logger.info(...)`
    -   `this.spinner.start()` -> `import { spinner } from '@/utils'; spinner.start()`
    -   **注意**: 需要检查 `@/utils` 或相对路径中这些工具的实际导出方式，确保 import 路径正确。

### 4. 工厂模式重构 (Factory Refactoring)

-   **输入**: 使用 `switch/case` 或 `if/else` 判断类型并 `new` 不同子类的工厂类。
-   **输出**:
    -   定义一个 `interface` 来约束策略函数的签名。
    -   创建一个对象映射 (Strategy Map): `const strategies: Record<Type, StrategyFunction> = { ... }`。
    -   导出一个函数，根据 key 从 map 中获取函数并执行。

### 5. 状态管理 (State Management)

-   如果原类没有状态（只包含逻辑），直接转换为纯函数。
-   如果原类包含状态（成员变量），将状态作为参数传递给函数，或使用闭包（但在本项目中主要通过参数传递上下文）。

## 示例

### 场景 A: 业务服务 (BaseService)

**Before:**

```typescript
import { BaseService } from '../base/BaseService';

export class CommitService extends BaseService {
    constructor() {
        super();
    }

    main(message: string) {
        this.logger.info('Starting commit...');
        this.spinner.start();
        // ... logic
    }
}
```

**After:**

```typescript
import { logger, spinner } from '@/utils';

// 类名 CommitService -> 函数名 commitService (首字母小写)
export const commitService = (message: string) => {
    logger.info('Starting commit...');
    spinner.start();
    // ... logic
};
```

### 场景 B: 工厂模式 (Factory)

**Before:**

```typescript
export class ParserFactory {
    static create(type: string) {
        if (type === 'cmd') return new CmdParser();
        return new BashParser();
    }
}
```

**After:**

```typescript
import { parseCmd } from './cmdParser';
import { parseBash } from './bashParser';

type Parser = (content: string) => string;

const parsers: Record<string, Parser> = {
    cmd: parseCmd,
    bash: parseBash,
};

export const parse = (type: string, content: string) => {
    const parser = parsers[type] || parsers.bash;
    return parser(content);
};
```

## 执行步骤

1.  **定位**: 根据用户指令和上述规则，找到 CLI 入口文件。
2.  **追踪**: 读取入口文件，找到它 import 的 Service 类（位于 `packages/shared`）。
3.  **分析**: 读取 Service 类文件，理解其继承关系和依赖。
4.  **规划**: 确定需要导入哪些外部模块来替代 `this.xxx`。
5.  **重构**: 按上述规则重写代码，保持业务逻辑不变，同时应用**命名规范更新**（首字母改为小写）。保留原来的 JSDoc 注释。
6.  **验证**: 确保导出的函数签名符合调用方的预期（可能需要调整调用方代码）。不要修改任何测试用例文件以及在终端运行单元测试。

请严格遵循以上规则进行重构。
