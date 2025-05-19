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
    public title: string;

    /**
     * API密钥
     */
    public apiKey: string;

    /**
     * API基础URL
     */
    public baseURL: string;

    /**
     * 模型标识符
     */
    public model: string;

    /**
     * 模型类型（text或image）
     */
    public type: string;

    /**
     * 构造函数
     * @param config 模型配置
     */
    constructor(config: ModelConfig) {
        this.title = config.title;
        this.apiKey = config.apiKey;
        this.baseURL = config.baseURL;
        this.model = config.model;
        this.type = config.type;
    }

    /**
     * 错误处理方法
     * @param errorMessage 错误信息
     * @returns 处理后的错误信息
     */
    abstract errorHandler(errorMessage: string): string;
}
