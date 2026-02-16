export interface Factory<T = any> {
    create(...args: any[]): T | Promise<T>;
}
