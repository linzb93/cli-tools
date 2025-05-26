import express, { Express, Router } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

/**
 * Express应用实例管理器
 * @description 提供获取和配置Express应用实例的工具函数
 */
class AppManager {
    /**
     * 私有静态实例
     * @private
     */
    private static instance: Express | null = null;

    /**
     * 获取Express应用实例
     * @returns {Express} Express应用实例
     */
    static getApp(): Express {
        if (!this.instance) {
            this.instance = express();

            // 配置基础中间件
            this.instance.use(cors());
            this.instance.use(bodyParser.json());
            this.instance.use(bodyParser.urlencoded({ extended: true }));
        }
        return this.instance;
    }

    /**
     * 在指定基础路径注册路由
     * @param {string} basePath 基础路径，默认为'/api'
     * @param {Router} router 路由实例
     * @param {string} routePath 路由子路径
     */
    static registerRouter(basePath: string = '/api', router: Router, routePath: string): void {
        const app = this.getApp();
        app.use(`${basePath}/${routePath}`, router);
    }
}

export default AppManager;
