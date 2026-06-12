import { Router } from 'express';
import { sql } from '@cli-tools/shared';
import type { AiModel } from '@cli-tools/shared';
import response from '../shared/response';
import { Database } from 'bun:sqlite';
import path from 'node:path';
import os from 'node:os';

const ccSwitchDatabase = new Database(path.join(os.homedir(), '.cc-switch', 'cc_switch.db'));

const router = Router();

const getModelList = async (): Promise<AiModel[]> => {
    const data = await sql((db) => db.aiModels);
    return data || [];
};

const saveModelList = async (list: AiModel[]) => {
    await sql((db) => {
        db.aiModels = list;
    });
};

// 生成唯一 ID
const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

// 获取模型列表
router.post('/list', async (_req, res) => {
    try {
        const list = await getModelList();
        response(res, list);
    } catch (error: any) {
        response(res, null);
        console.error('获取AI模型列表失败:', error);
    }
});

// 新增/编辑模型
router.post('/save', async (req, res) => {
    const { id, name, platform, url, mediaType, apiKey, interfaceFormat, weight, oldId } = req.body;

    if (!name) {
        return response(res, { message: '名称不能为空' });
    }
    if (!platform) {
        return response(res, { message: '平台不能为空' });
    }

    try {
        const list = await getModelList();

        // 检查名称重复（排除自身）
        const nameExists = list.some((item) => item.name === name && (!oldId || item.id !== oldId));
        if (nameExists) {
            return response(res, { message: `名称 "${name}" 已存在` });
        }

        if (oldId) {
            // 编辑模式
            const index = list.findIndex((item) => item.id === oldId);
            if (index !== -1) {
                list[index] = {
                    id: oldId,
                    name,
                    platform,
                    url: url || '',
                    mediaType: mediaType || 'text',
                    apiKey: apiKey || '',
                    interfaceFormat: interfaceFormat || [],
                    weight: weight ?? 0,
                };
            } else {
                return response(res, { message: `模型 "${oldId}" 不存在` });
            }
        } else {
            // 新增模式
            list.push({
                id: id || generateId(),
                name,
                platform,
                url: url || '',
                mediaType: mediaType || 'text',
                apiKey: apiKey || '',
                interfaceFormat: interfaceFormat || [],
                weight: weight ?? 0,
            });
        }

        await saveModelList(list);
        response(res, {});
    } catch (error: any) {
        response(res, { message: error.message });
    }
});

// 删除模型
router.post('/delete', async (req, res) => {
    const { id } = req.body;
    if (!id) {
        return response(res, { message: 'ID 不能为空' });
    }

    try {
        const list = await getModelList();
        const newList = list.filter((item) => item.id !== id);
        await saveModelList(newList);
        response(res, {});
    } catch (error: any) {
        response(res, { message: error.message });
    }
});

// 同步cc-switch数据库
router.post('/sync-cc-switch', async (req, res) => {
    try {
        const providers = ccSwitchDatabase.query('SELECT * FROM providers').all();
        const result = providers.map((provider: any) => {
            if (provider.settings_config) {
                const data = JSON.parse(provider.settings_config);
                return data.env && data.env.ANTHROPIC_AUTH_TOKEN
                    ? {
                          token: data.env.ANTHROPIC_AUTH_TOKEN,
                          model: data.env.ANTHROPIC_MODEL,
                          url: data.env.ANTHROPIC_BASE_URL,
                          name: provider.name,
                      }
                    : null;
            }
            return null;
        });
        response(res, result.filter(Boolean));
    } catch (error: any) {
        response(res, null);
        console.error('同步cc-switch数据库失败:', error);
    }
});

export default router;
