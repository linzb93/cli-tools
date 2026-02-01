export abstract class BaseFactory<T = any> {
    protected readonly items: T[] = [];
    /**
     * 初始化应用
     */
    abstract initialApps(): void;
    /**
     * 验证应用是否符合要求
     * @returns {boolean} 是否符合要求
     */
    abstract validate(): boolean;
}
