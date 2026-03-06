import { Router, type Application, Request, Response } from 'express';
import axios from 'axios';
import { omit } from 'lodash-es';
import { sql } from '@cli-tools/shared/utils/sql';
import response from '../shared/response';
const router = Router();

router.post('/list', async (_, res) => {
    try {
        const list = await sql((db) => db.agent);
        response(res, list);
    } catch (error) {
        response(res, { message: error.message });
    }
});

router.post('/save', async (req, res) => {
    const { id, name, prefix, rules } = req.body;
    try {
        await sql((db) => {
            if (!db.agent) {
                db.agent = [{ id, name, prefix, rules }];
                return;
            }
            const match = db.agent.find((item) => item.id === id);
            if (match) {
                match.name = name;
                match.prefix = prefix;
                match.rules = rules;
            } else {
                db.agent.push({ id, name, prefix, rules });
            }
        });
        response(res, {});
    } catch (error) {
        response(res, { message: error.message });
    }
});

router.post('/delete', async (req, res) => {
    const { id } = req.body;
    try {
        await sql((db) => {
            db.agent = db.agent.filter((item) => item.id !== id);
        });
        response(res, {});
    } catch (error) {
        response(res, { message: error.message });
    }
});

router.post('/debug', async (req, res) => {
    const { method, url, body, prefix, headers, id } = req.body;
    try {
        const agent = await sql((db) => db.agent.find((item) => item.id === id));
        if (!agent) {
            return response(res, {
                code: 404,
                message: '未找到匹配的代理配置',
            });
        }
        const { rules } = agent;
        const matchedRule = rules.find((rule) => prefix === rule.from);
        if (!matchedRule) {
            return response(res, {
                code: 404,
                message: '未找到匹配的代理规则',
            });
        }
        const fullUrl = `${matchedRule.to}${url}`;
        const res1 = await axios({
            method,
            url: fullUrl,
            data: body ? JSON.parse(body) : {},
            headers: headers ? JSON.parse(headers) : {},
        });
        response(res, res1.data);
    } catch (err: any) {
        response(res, {
            code: err.response?.status || 500,
            message: err.message,
            data: err.response?.data,
        });
    }
});

export default router;

export const agentCallback = (app: Application) => {
    app.all(/\/agent\/.*/, async (req: Request, res: Response) => {
        try {
            // 1. 获取原始URL路径
            const originalPath = req.originalUrl;

            // 获取/agent/后面的路径
            const pathAfterAgent = originalPath.substring(originalPath.indexOf('/agent/') + '/agent/'.length);

            // 2. 提取prefix (第一个/前的内容)
            const slashIndex = pathAfterAgent.indexOf('/');
            if (slashIndex === -1) {
                return res.status(400).json({ error: '请求格式不正确' });
            }

            const prefix = pathAfterAgent.substring(0, slashIndex);
            const remainingPath = pathAfterAgent.substring(slashIndex);

            // 3. 在数据库中查找匹配的agent
            const agentList = await sql((db) => db.agent);
            const matchedAgent = agentList.find((item) => item.prefix === `/${prefix}`);

            if (!matchedAgent) {
                return res.status(404).json({ error: '未找到匹配的代理配置' });
            }

            // 4. 在rules中查找匹配的规则
            const matchedRule = matchedAgent.rules.find((rule) => remainingPath.startsWith(rule.from));

            if (!matchedRule) {
                return res.status(404).json({ error: '未找到匹配的代理规则' });
            }

            // 5. 构建代理请求URL
            const targetUrl = matchedRule.to + remainingPath.slice(matchedRule.from.length);

            // 6. 使用axios发送代理请求
            const method = req.method.toLowerCase();
            let response;

            // 根据请求方法发送对应的请求
            if (method === 'get') {
                response = await axios.get(targetUrl, {
                    params: req.query,
                    headers: { ...req.headers },
                });
            } else if (method === 'post') {
                response = await axios.post(targetUrl, req.body, {
                    headers: {
                        ...omit(req.headers, 'host', 'connection'),
                    },
                });
            } else {
                // 不支持的请求方法
                return res.status(400).json({ error: '不支持的请求方法' });
            }

            // 返回结果
            res.status(response.status).json(response.data);
        } catch (error: any) {
            if (error.status && error.message) {
                // 处理已知的错误
                res.status(error.status).json({ error: error.message });
            } else {
                // 处理未知错误
                console.error('代理请求失败:', error.message);
                res.status(500).json({ error: '代理请求失败' });
            }
        }
    });
};
