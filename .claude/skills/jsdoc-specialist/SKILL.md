---
name: 'jsdoc-specialist'
description: '为函数/方法生成和完善JSDoc注释与示例；当用户要求补充JSDoc或对代码进行注释规范化时调用。'
---

# JSDoc Specialist

本技能用于在项目中统一为函数、对象/类方法补充与规范化 JSDoc 注释。

## 适用场景

- 用户要求为代码生成或完善 JSDoc 注释
- 开发新增函数/方法需要补齐注释
- 代码评审发现注释不规范需要修正

## 规则约定（必须遵循）

- 默认仅为函数、对象/类方法添加注释；变量不添加，除非用户明确要求
- 参数与返回：
    - 有参数/有返回的必须标注
    - 同步函数且无返回不写 `@returns`
    - 异步函数即使无返回也写 `@returns`（例如 `Promise<void>`）
- 纯函数必须添加 `@example` 展示输入与输出，非纯函数不需要添加

## 使用指引

- 保持项目既有代码风格与类型习惯（TS/JS）
- 参数类型优先使用可推断类型或项目已有类型定义
- 异步函数 `@returns` 用 `Promise<类型>` 或 `Promise<void>`
- 识别纯函数：无副作用、输出仅依赖输入

## 模板示例

### 同步函数（有返回）

```js
/**
 * 计算两数之和
 * @param {number} a - 加数A
 * @param {number} b - 加数B
 * @returns {number} 和
 * @example
 * const out = add(1, 2);
 * // out === 3
 */
function add(a, b) {
    return a + b;
}
```

### 同步函数（无返回）

```js
/**
 * 在控制台打印消息
 * @param {string} msg - 消息内容
 */
function logMsg(msg) {
    console.log(msg);
}
```

### 异步函数（无显式返回值）

```js
/**
 * 等待指定毫秒
 * @param {number} ms - 毫秒数
 * @returns {Promise<void>} 完成后不返回值
 */
async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
```

### 类方法（TS类型示例）

```ts
class Counter {
    private value = 0;

    /**
     * 自增计数并返回当前值
     * @returns {number} 当前计数值
     * @example
     * const c = new Counter();
     * c.inc(); // 1
     * c.inc(); // 2
     */
    inc(): number {
        this.value += 1;
        return this.value;
    }
}
```

## 检查清单

- 注释仅覆盖函数/方法，变量不写除非用户要求
- 每个参数都有说明与类型
- 返回值遵循同步/异步差异；异步总写 `@returns`
- 纯函数包含 `@example` 展示输入与输出，非纯函数不需要添加
- 语言与术语与代码保持一致；简洁准确
