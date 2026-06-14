/**
 * AI模型错误码 → 友好提示映射
 * 按优先级排序，先匹配到的优先返回
 */
const ERROR_PATTERNS: { pattern: RegExp; message: string }[] = [
    // ======================== API Key 相关 ========================
    { pattern: /Authorization Required/i, message: '无效的 API Key' },
    { pattern: /Invalid API key/i, message: '无效的 API Key' },
    { pattern: /Incorrect API key/i, message: '无效的 API Key' },
    { pattern: /API key not valid/i, message: '无效的 API Key' },
    { pattern: /invalid.*api.?key/i, message: '无效的 API Key' },
    { pattern: /Unauthorized/i, message: '无效的 API Key' },
    { pattern: /Forbidden/i, message: 'API Key 无访问权限' },
    { pattern: /Access denied/i, message: 'API Key 无访问权限' },
    { pattern: /permission/i, message: 'API Key 无访问权限' },

    // ======================== 余额/配额相关 ========================
    { pattern: /Insufficient Balance/i, message: '账户余额不足' },
    { pattern: /insufficient_quota/i, message: '账户配额不足' },
    { pattern: /exceeded your current quota/i, message: '已超出当前配额限制' },
    { pattern: /billing/i, message: '账户余额不足' },
    { pattern: /Ran out of credits/i, message: '账户余额不足' },
    { pattern: /out of credits/i, message: '账户余额不足' },
    { pattern: /Insufficient account balance/i, message: '账户余额不足' },
    { pattern: /Account balance is insufficient/i, message: '账户余额不足' },

    // ======================== 频率限制 ========================
    { pattern: /rate.?limit/i, message: '请求频率过高，请稍后重试' },
    { pattern: /Too many requests/i, message: '请求频率过高，请稍后重试' },
    { pattern: /Rate limit exceeded/i, message: '请求频率过高，请稍后重试' },

    // ======================== 模型相关 ========================
    { pattern: /model.*not.?found/i, message: '模型不存在' },
    { pattern: /The model `.*` does not exist/i, message: '模型不存在' },
    { pattern: /invalid.*model/i, message: '无效的模型名称' },

    // ======================== Token 相关 ========================
    { pattern: /context.?length|token.*limit/i, message: '输入内容超出 Token 限制' },
    { pattern: /max.*tokens/i, message: '输入内容超出 Token 限制' },

    // ======================== 服务端错误 ========================
    { pattern: /server.?error/i, message: '服务端错误，请稍后重试' },
    { pattern: /Internal server error/i, message: '服务端错误，请稍后重试' },
    { pattern: /Service Unavailable/i, message: '服务暂时不可用，请稍后重试' },
    { pattern: /Bad Gateway/i, message: '服务暂时不可用，请稍后重试' },

    // ======================== 超时/连接 ========================
    { pattern: /timeout|timed.?out/i, message: '请求超时，请检查网络后重试' },
    { pattern: /ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i, message: '网络连接失败，请检查网络设置' },
    { pattern: /connect/i, message: '网络连接失败，请检查 URL 和网络' },
    { pattern: /fetch failed/i, message: '网络请求失败，请检查 URL 是否正确' },

    // ======================== 内容安全 ========================
    { pattern: /content.?filter|content.?policy|safety/i, message: '内容被安全策略拦截' },
    { pattern: /moderation/i, message: '内容被安全策略拦截' },
];

/**
 * 将 AI 模型返回的原始错误信息转换为用户友好的中文提示
 * @param errorMessage 原始错误信息
 * @param platform 平台名称（可选，用于日志或未来扩展）
 * @returns 用户友好的错误提示
 */
export function handleAIError(errorMessage: string, platform?: string): string {
    if (!errorMessage) return '未知错误';

    const prefix = platform ? `[${platform}] ` : '';

    for (const { pattern, message } of ERROR_PATTERNS) {
        if (pattern.test(errorMessage)) {
            return prefix + message;
        }
    }

    // 未匹配到的返回原始错误信息
    return prefix + errorMessage;
}
