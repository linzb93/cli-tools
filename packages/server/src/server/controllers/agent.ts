import { Router, type Application, Request, Response } from 'express';
import axios from 'axios';
import sql from '@/utils/sql';
import response from '../shared/response';
const router = Router();

router.post('/list', (req, res) => {
    sql((db) => db.agent).then((list) => {
        response(res, list);
    });
});

router.post('/save', (req, res) => {
    const { id, name, prefix, rules } = req.body;
    sql((db) => {
        const match = db.agent.find((item) => item.id === id);
        if (match) {
            match.name = name;
            match.prefix = prefix;
            match.rules = rules;
        } else {
            db.agent.push({ id, name, prefix, rules });
        }
    }).then(() => {
        response(res, {});
    });
});

router.post('/delete', (req, res) => {
    const { id } = req.body;
    sql((db) => {
        db.agent = db.agent.filter((item) => item.id !== id);
    }).then(() => {
        response(res, {});
    });
});

export default router;

export const agentCallback = (app: Application) => {
    app.all('/agent/**', (req: Request, res: Response) => {
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
        sql((db) => db.agent)
            .then((agentList) => {
                const matchedAgent = agentList.find((item) => item.prefix === prefix);

                if (!matchedAgent) {
                    return Promise.reject({ status: 404, message: '未找到匹配的代理配置' });
                }

                // 4. 在rules中查找匹配的规则
                const matchedRule = matchedAgent.rules.find((rule) => remainingPath.startsWith(rule.from));

                if (!matchedRule) {
                    return Promise.reject({ status: 404, message: '未找到匹配的代理规则' });
                }

                // 5. 构建代理请求URL
                const targetUrl = matchedRule.to + remainingPath;

                // 6. 使用axios发送代理请求
                const method = req.method.toLowerCase();

                // 根据请求方法发送对应的请求
                if (method === 'get') {
                    return axios.get(targetUrl, {
                        params: req.query,
                        headers: { ...req.headers },
                    });
                }

                if (method === 'post') {
                    return axios.post(targetUrl, req.body, {
                        headers: { ...req.headers },
                    });
                }

                // 不支持的请求方法
                return Promise.reject({ status: 400, message: '不支持的请求方法' });
            })
            .then((response) => {
                // 返回结果
                res.status(response.status).json(response.data);
            })
            .catch((error) => {
                if (error.status && error.message) {
                    // 处理已知的错误
                    res.status(error.status).json({ error: error.message });
                } else {
                    // 处理未知错误
                    console.error('代理请求失败:', error);
                    res.status(500).json({ error: '代理请求失败' });
                }
            });
    });
};
