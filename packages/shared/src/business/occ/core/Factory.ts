import AbstractApp from './AbstractApp';
import {
    Mtjysq,
    Mtzxsq,
    Mtpjsq,
    Mtimsq,
    Mtdjds,
    Mtaibdsq,
    Elejysq,
    Chain,
    Spbj,
    Wmb,
    Kdb,
    DkdMiniProgram,
    Zdb,
} from '../implementations/index';

type AppCtor = new () => AbstractApp;

/**
 * 应用工厂类
 * 负责按需创建应用实例，优化内存使用
 */
export class Factory {
    private static appClasses: Map<string, AppCtor> = new Map();

    /**
     * 初始化应用类映射表
     */
    private static initializeAppClasses(): void {
        if (this.appClasses.size === 0) {
            this.appClasses.set('jysq', Mtjysq);
            this.appClasses.set('zx', Mtzxsq);
            this.appClasses.set('pj', Mtpjsq);
            this.appClasses.set('im', Mtimsq);
            this.appClasses.set('dj', Mtdjds);
            this.appClasses.set('ai', Mtaibdsq);
            this.appClasses.set('ele', Elejysq);
            this.appClasses.set('chain', Chain);
            this.appClasses.set('spbj', Spbj);
            this.appClasses.set('wmb', Wmb);
            this.appClasses.set('kdb', Kdb);
            this.appClasses.set('minip', DkdMiniProgram);
            this.appClasses.set('zdb', Zdb);
        }
    }

    /**
     * 根据应用名称创建应用实例
     * @param appName 应用名称（缩写）
     * @returns 应用实例
     */
    static createApp(appName: string): AbstractApp {
        this.initializeAppClasses();

        const appClass = this.appClasses.get(appName);
        if (!appClass) {
            throw new Error(`未找到应用: ${appName}`);
        }

        return new appClass();
    }

    /**
     * 获取所有可用的应用名称
     * @returns 应用名称数组
     */
    static getAvailableAppNames(): string[] {
        this.initializeAppClasses();
        return Array.from(this.appClasses.keys());
    }

    /**
     * 检查应用名称是否存在
     * @param appName 应用名称
     * @returns 是否存在
     */
    static hasApp(appName: string): boolean {
        this.initializeAppClasses();
        return this.appClasses.has(appName);
    }

    /**
     * 获取默认应用实例
     * @returns 默认应用实例
     */
    static getDefaultApp(): AbstractApp {
        return new Mtjysq(); // jysq 作为默认应用
    }

    /**
     * 获取默认应用名称
     * @returns 默认应用名称
     */
    static getDefaultAppName(): string {
        return 'jysq';
    }
}
