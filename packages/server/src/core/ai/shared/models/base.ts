/**
 * AI模型基础类
 * 定义所有模型共有的属性和方法
 */
export interface ModelConfig {
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
}

/**
 * AI模型基础类
 */
export default abstract class BaseModel {
    /**
     * 模型标题
     */
    abstract title: string;

    /**
     * API密钥
     */
    apiKey = '';

    /**
     * API基础URL
     */
    abstract baseURL: string;

    /**
     * 模型标识符
     */
    abstract model: string;

    /**
     * 模型类型（text或image）
     */
    abstract type: string;

    /**
     * 错误处理方法
     * @param errorMessage 错误信息
     * @returns 处理后的错误信息
     */
    abstract errorHandler(errorMessage: string): string;
}
