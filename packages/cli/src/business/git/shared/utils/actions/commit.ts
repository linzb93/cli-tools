import { closestMatch } from 'closest-match';

/**
 * 预定义的前缀列表
 */
const prefixes: {
    value: string;
    key?: string | string[];
}[] = [
    {
        value: 'revert',
        key: ['回滚', '撤销'],
    },
    {
        value: 'docs',
        key: ['文档', '注释', 'readme'],
    },
    {
        value: 'style',
        key: ['样式', '格式', 'prettier', 'eslint'],
    },
    {
        value: 'perf',
        key: ['性能', '速度'],
    },
    {
        value: 'test',
        key: ['测试', '用例'],
    },
    {
        value: 'build',
        key: ['构建', '依赖', 'build', 'npm', 'pnpm', 'webpack', 'vite'],
    },
    {
        value: 'chore',
        key: ['杂项', '工具', '配置', 'chore', 'tool', 'config'],
    },
    {
        value: 'refactor',
        key: ['重构', '优化', '简化', '迁移', '拆分'],
    },
    {
        value: 'fix',
        key: ['修复', 'bug', 'fix', '解决', '问题', 'issue'],
    },
    {
        value: 'feat',
        key: ['新增', '功能', '添加', 'implement'],
    },
    {
        value: 'merge',
        key: ['合并'],
    },
];

/**
 * 当提交信息包含空格时，添加引号
 * @param {string} message - 提交信息
 * @returns {string} 处理后的提交信息
 */
function addQuoteWhenBlankExist(message: string): string {
    if (message.includes(' ') && !message.startsWith('"')) {
        return `"${message}"`;
    }
    return message;
}

/**
 * 格式化提交信息，确保提交信息符合规范
 * @param {string} rawCommit - 原始提交信息
 * @returns {Promise<{ commit: string, suggestedPrefix: string }>} 返回格式化后的提交信息和建议的前缀
 */
export function formatCommitMessage(rawCommit: string): string {
    let commit = rawCommit.trim();
    if (!commit) {
        return 'feat:update';
    }

    // 1. 检查是否已有标准前缀 (如 feat:、fix: 等)
    const hasStandardPrefix = prefixes.find((item) => commit.startsWith(`${item.value}:`));
    if (hasStandardPrefix) {
        return commit;
    }

    // 移除用户输入的双引号包裹，后续 addQuoteWhenBlankExist 会统一添加
    if (commit.startsWith('"') && commit.endsWith('"')) {
        commit = commit.slice(1, -1);
    }

    // 2. 提取用户输入的前缀（冒号前面的部分）
    const colonIndex = commit.indexOf(':');
    if (colonIndex > 0) {
        const userPrefix = commit.substring(0, colonIndex);
        const prefixValues = prefixes.map((item) => item.value);

        // 检查前缀是否在预定义列表中
        if (!prefixValues.includes(userPrefix)) {
            // 使用 closest-match 找到最接近的前缀
            const closestPrefix = closestMatch(userPrefix, prefixValues) as string;
            return `${closestPrefix}:${commit.substring(colonIndex + 1).trim()}`;
        }
    }

    // 3. 通过关键字匹配推断应使用的前缀
    const inferredPrefix = prefixes.find((item) => {
        if (!item.key) {
            return false;
        }
        if (Array.isArray(item.key)) {
            return item.key.some((text) => commit.includes(text));
        }
        return commit.includes(item.key);
    });

    // 4. 无匹配时默认使用 feat 前缀
    if (!inferredPrefix) {
        return `feat:${commit}`;
    }
    return `${addQuoteWhenBlankExist(`${inferredPrefix.value}:${commit}`)}`;
}
