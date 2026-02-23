import fs from 'fs-extra';
import { execaCommand as execa } from 'execa';
import { WebSocket } from 'ws';
import { logger } from './logger';

/**
 * 发送消息到VSCode插件
 * @param path 路由路径
 * @param query参数
 */
export const sendToVSCode = (path: string, query: any = {}) => {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket('ws://localhost:9528');
        ws.on('open', () => {
            ws.send(JSON.stringify({ path, query }));
        });
        ws.on('message', (data) => {
            try {
                const res = JSON.parse(data.toString());
                ws.close();
                resolve(res);
            } catch (e) {
                ws.close();
                reject(e);
            }
        });
        ws.on('error', (e) => {
            reject(e);
        });
    });
};

/**
 * 仅支持vscode,trae和cursor
 */
export class IDE {
    private getCurrentIDECommand() {
        if (!!process.env.CURSOR_TRACE_ID) {
            return 'cursor';
        }
        if (!!process.env.TRAE_TRACE_ID) {
            return 'trae';
        }
        if (process.env.TERM_PROGRAM === 'vscode') {
            return 'vscode';
        }
        throw new Error('本命令不支持在该编辑器使用，请在vscode / trae / cursor中使用');
    }

    /**
     * 在 VSCode 中打开
     * @param {string} project 项目地址
     * @param {object} options
     * @param {boolean} options.isGoto 是否跳转到文件指定位置
     * @param {boolean} options.reuse 是否在当前编辑器打开
     * @returns {Promise<void>}
     */
    async open(
        project: string,
        options?: {
            isGoto?: boolean;
            reuse?: boolean;
        },
    ): Promise<void> {
        const command = this.getCurrentIDECommand();
        try {
            await execa(`${command} ${options?.isGoto ? '-g' : ''} ${project} ${options?.reuse ? '-r' : ''}`);
        } catch (cmdError) {
            try {
                await fs.access(project);
            } catch (accessError) {
                logger.error('项目路径不存在');
                return;
            }
            logger.error('打开失败，未检测到有安装VSCode或Cursor');
        }
    }
}
