import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import { fork } from 'node:child_process';
import internalIp from 'internal-ip';
import type { Application } from 'express';
import express from 'express';
import { useAI } from '@/utils/ai/implementation';
import { logger } from '@/utils/logger';
import { serverConfig } from '@cli-tools/shared';
import { objectToCmdOptions } from '@/utils/helper';

export interface StartStaticServerOptions {
    cwd: string;
    reqApp?: Application;
}

export const extractPublicPath = async (cwd: string): Promise<string> => {
    let configContent = '';
    let isVueConfig = false;

    // 尝试读取 vue.config.js
    const vueConfigPath = join(cwd, 'vue.config.js');
    if (await fs.pathExists(vueConfigPath)) {
        configContent = await fs.readFile(vueConfigPath, 'utf-8');
        isVueConfig = true;
    } else {
        // 尝试读取 vite.config.js 或 ts
        const viteConfigJsPath = join(cwd, 'vite.config.js');
        const viteConfigTsPath = join(cwd, 'vite.config.ts');
        if (await fs.pathExists(viteConfigJsPath)) {
            configContent = await fs.readFile(viteConfigJsPath, 'utf-8');
        } else if (await fs.pathExists(viteConfigTsPath)) {
            configContent = await fs.readFile(viteConfigTsPath, 'utf-8');
        }
    }

    if (!configContent) {
        return '/';
    }

    // 正则提取尝试
    let match;
    if (isVueConfig) {
        match = configContent.match(/publicPath:\s*(['"`])(.*?)\1/);
    } else {
        match = configContent.match(/base:\s*(['"`])(.*?)\1/);
    }

    if (match && match[2]) {
        // 确保非空并且是简单的字符串提取
        const val = match[2].trim();
        if (!val.includes('${') && !val.includes('process.env')) {
            return val;
        }
    }

    // 提取困难或包含动态变量，使用 AI 辅助
    try {
        const prompt = `请分析以下前端配置文件的内容，提取出静态资源的部署路径（Vue项目的 publicPath 或 Vite项目的 base）。
如果是动态值，请尝试推断其最可能的默认值。如果无法推断或不存在，请返回 '/'。
请直接返回提取到的路径字符串，不要包含任何解释、引号或多余字符。

配置文件内容：
${configContent.substring(0, 2000)}`;

        const { contents } = await useAI([{ role: 'user', content: prompt }]);
        const result = contents.trim().replace(/['"`]/g, '');
        if (result.startsWith('/')) {
            return result;
        } else {
            return `/${result}`;
        }
    } catch (e) {
        logger.warn('AI提取 publicPath 失败，使用默认值 /');
        return '/';
    }
};

export const startStaticServer = async ({ cwd, reqApp }: StartStaticServerOptions): Promise<{ url: string }> => {
    const publicPath = await extractPublicPath(cwd);
    const ip = (await internalIp.v4()) || '127.0.0.1';

    if (!publicPath || publicPath === '/') {
        // 分配新端口启动独立的静态服务
        return new Promise((resolvePromise, reject) => {
            const child = fork(
                resolve(fileURLToPath(import.meta.url), '../vueServer.js'),
                objectToCmdOptions({
                    cwd,
                    publicPath: '/',
                    port: 0, // let detect-port auto-allocate
                }),
                {
                    detached: true,
                    stdio: [null, null, null, 'ipc'],
                },
            );

            child.on('message', async (message: any) => {
                if (message.port) {
                    const url = `http://${ip}:${message.port}/`;
                    child.unref();
                    child.disconnect();
                    resolvePromise({ url });
                }
            });

            child.on('error', (err) => {
                reject(err);
            });
        });
    } else {
        // publicPath 存在且非根目录
        if (reqApp) {
            // 在 Server 环境下，复用主服务
            const distPath = join(cwd, 'dist');
            reqApp.use(publicPath, express.static(distPath));
            const port = serverConfig.port.production || 9527;
            const url = `http://${ip}:${port}${publicPath}`;
            return { url };
        } else {
            // 在 CLI 环境下，调用 Server 接口挂载
            const port = serverConfig.port.production || 9527;
            try {
                const response = await fetch(`http://127.0.0.1:${port}/api/vue/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: cwd }),
                });

                if (response.ok) {
                    const data = (await response.json()) as { success?: boolean; url?: string; error?: string };
                    if (data.success && data.url) {
                        return { url: data.url };
                    }
                }
                throw new Error(`请求失败: ${response.statusText}`);
            } catch (err) {
                logger.warn(`复用主服务失败，降级为启动独立服务: ${err}`);
                // 降级：自己启动一个带有特定 publicPath 的独立服务
                return new Promise((resolvePromise, reject) => {
                    const child = fork(
                        resolve(fileURLToPath(import.meta.url), '../vueServer.js'),
                        objectToCmdOptions({
                            cwd,
                            publicPath,
                            port: 0,
                        }),
                        {
                            detached: true,
                            stdio: [null, null, null, 'ipc'],
                        },
                    );

                    child.on('message', async (message: any) => {
                        if (message.port) {
                            const url = `http://${ip}:${message.port}${publicPath}`;
                            child.unref();
                            child.disconnect();
                            resolvePromise({ url });
                        }
                    });
                });
            }
        }
    }
};
