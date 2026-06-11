/**
 * 重试选项接口
 */
interface RetryOptions {
    /**
     * 最大重试次数
     * @default 10
     */
    maxAttempts?: number;
    /**
     * 失败回调函数
     * @param {number} attempt - 当前重试次数
     * @param {string} error - 错误信息
     */
    onError?: (attempt: number, error: Error) => onErrorReturn | Promise<onErrorReturn>;
}
export type onErrorReturn = {
    /**
     * 是否停止执行后续命令
     * @default false
     */
    shouldStop?: boolean;
};
/**
 * 重试执行异步函数
 * @param {() => Promise<T>} fn - 需要重试的异步函数
 * @param {RetryOptions} options - 重试选项
 * @returns {Promise<T>} 异步函数的返回值
 */
export async function retryAsync<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    const { maxAttempts = 10, onError } = options;
    let attempt = 1;
    let firstFailTime: number = 0;

    while (attempt <= maxAttempts) {
        const now = Date.now();
        try {
            return await fn();
        } catch (error) {
            if (now - firstFailTime < 1000) {
                // 下一次失败与上一次失败间隔小于1秒，直接抛出错误
                throw error instanceof Error ? error : new Error(String(error));
            }
            firstFailTime = now;

            if (typeof onError === 'function') {
                const { shouldStop } = await onError(attempt, error as Error);
                if (shouldStop) {
                    // 抛出和变量error一样的Error类型
                    throw error instanceof Error ? error : new Error(String(error));
                }
            }

            if (attempt === maxAttempts) {
                throw error;
            }

            attempt++;
        }
    }

    throw new Error('Maximum retry attempts reached');
}

/**
 * 按顺序执行异步函数，返回第一个成功的结果
 * @param list
 * @param callback
 * @returns
 */
export const pLocate = async (list: any[], callback: Function): Promise<any> => {
    for (let i = 0; i < list.length; i++) {
        try {
            return await callback(list[i]);
        } catch {
            //
        }
    }
    throw new Error('err');
};
