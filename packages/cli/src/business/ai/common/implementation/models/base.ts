/**
 * AI模型接口
 * 定义所有模型共有的属性和方法
 */
export interface AIModel {
    /**
     * 模型标题
     */
    title: string;
    /**
     * API密钥
     */
    apiKey: string;
    /**
     * API基础URL
     */
    baseURL: string;
    /**
     * 模型标识符
     */
    model: string;
    /**
     * 模型类型（text或image）
     */
    type: string;
    /**
     * 错误处理方法
     * @param errorMessage 错误信息
     * @returns 处理后的错误信息
     */
    errorHandler(errorMessage: string): string;
}
