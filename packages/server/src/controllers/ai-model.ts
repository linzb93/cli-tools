import { Router } from 'express';
import { sql } from '@cli-tools/shared/node';
import type { AppDbSchema } from './types';
import type { AiModel } from '@cli-tools/shared';
import { HTTP_STATUS, handleAIError } from '@cli-tools/shared';
import { success, error as responseError } from '../shared/response';
import Database from 'better-sqlite3';
import path from 'node:path';
import os from 'node:os';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

const ccSwitchDatabase = new Database(path.join(os.homedir(), '.cc-switch', 'cc-switch.db'));

const router = Router();

const getModelList = async (): Promise<AiModel[]> => {
    const data = await sql<AppDbSchema['aiModels'], AppDbSchema>((db) => db.aiModels);
    return data || [];
};

const saveModelList = async (list: AiModel[]) => {
    await sql<void, AppDbSchema>((db) => {
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
        success(res, list);
    } catch (error: any) {
        console.error('获取AI模型列表失败:', error);
        error(res, error.message || '获取AI模型列表失败', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});

// 新增/编辑模型
router.post('/save', async (req, res) => {
    const { id, name, model, platform, url, mediaType, apiKey, interfaceFormat, weight, oldId } = req.body;

    if (!name) {
        responseError(res, '名称不能为空', HTTP_STATUS.DATAISVALID);
        return;
    }
    if (!platform) {
        responseError(res, '平台不能为空', HTTP_STATUS.DATAISVALID);
        return;
    }

    try {
        const list = await getModelList();

        // 检查名称重复（排除自身）
        const nameExists = list.some((item) => item.name === name && (!oldId || item.id !== oldId));
        if (nameExists) {
            responseError(res, `名称 "${name}" 已存在`, HTTP_STATUS.BUSINESSERROR);
            return;
        }

        if (oldId) {
            // 编辑模式
            const index = list.findIndex((item) => item.id === oldId);
            if (index !== -1) {
                list[index] = {
                    id: oldId,
                    name,
                    model: model || '',
                    platform,
                    url: url || '',
                    mediaType: mediaType || 'text',
                    apiKey: apiKey || '',
                    interfaceFormat: interfaceFormat || '',
                    weight: weight ?? 0,
                };
            } else {
                responseError(res, `模型 "${oldId}" 不存在`, HTTP_STATUS.NULLDATA);
                return;
            }
        } else {
            // 新增模式
            list.push({
                id: id || generateId(),
                name,
                model: model || '',
                platform,
                url: url || '',
                mediaType: mediaType || 'text',
                apiKey: apiKey || '',
                interfaceFormat: interfaceFormat || '',
                weight: weight ?? 0,
            });
        }

        await saveModelList(list);
        success(res, {});
    } catch (error: any) {
        error(res, error.message || '保存失败', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});

// 删除模型
router.post('/delete', async (req, res) => {
    const { id } = req.body;
    if (!id) {
        responseError(res, 'ID 不能为空', HTTP_STATUS.DATAISVALID);
        return;
    }

    try {
        const list = await getModelList();
        const newList = list.filter((item) => item.id !== id);
        await saveModelList(newList);
        success(res, {});
    } catch (error: any) {
        error(res, error.message || '删除失败', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});

// 同步cc-switch数据库
router.post('/sync-cc-switch', async (req, res) => {
    try {
        const providers = ccSwitchDatabase.prepare('SELECT * FROM providers').all();
        const ccSwitchList = providers.map((provider: any) => {
            if (provider.settings_config) {
                const data = JSON.parse(provider.settings_config);
                return data.env && data.env.ANTHROPIC_AUTH_TOKEN
                    ? {
                          apiKey: data.env.ANTHROPIC_AUTH_TOKEN,
                          model: data.env.ANTHROPIC_MODEL,
                          url: data.env.ANTHROPIC_BASE_URL,
                          platform: provider.name,
                          name: provider.notes,
                      }
                    : null;
            }
            return null;
        });
        const filteredList = ccSwitchList.filter((item): item is NonNullable<typeof item> => item !== null);

        // 获取现有模型列表，对比 apiKey 判断是否需要插入
        const existingList = await getModelList();
        const existingApiKeys = new Set(existingList.map((item) => item.apiKey).filter(Boolean));

        const newItems: AiModel[] = [];
        for (const item of filteredList) {
            if (!existingApiKeys.has(item.apiKey)) {
                newItems.push({
                    id: generateId(),
                    model: (item as any).model || '',
                    platform: item.platform || 'cc-switch',
                    name: item.name || '',
                    url: item.url || '',
                    mediaType: 'text',
                    apiKey: item.apiKey,
                    interfaceFormat: 'anthropic',
                    weight: 0,
                });
            }
        }

        if (newItems.length > 0) {
            await saveModelList([...existingList, ...newItems]);
        }

        success(res, null);
    } catch (error: any) {
        console.error('同步cc-switch数据库失败:', error);
        error(res, error.message || '同步cc-switch数据库失败', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});

// 验证模型接口有效性
router.post('/validate', async (req, res) => {
    const { model: modelName, url, apiKey, interfaceFormat } = req.body;

    if (!modelName || !url || !apiKey || !interfaceFormat) {
        responseError(res, '模型、URL、API Key 和接口格式不能为空', HTTP_STATUS.DATAISVALID);
        return;
    }

    try {
        if (interfaceFormat === 'openai') {
            const provider = createOpenAI({ apiKey, baseURL: url });
            const model = provider.chat(modelName);
            await generateText({
                model,
                prompt: 'Hi',
                maxOutputTokens: 1,
            });
        } else if (interfaceFormat === 'anthropic') {
            const provider = createAnthropic({ apiKey, baseURL: url });
            const model = provider(modelName);
            await generateText({
                model,
                prompt: 'Hi',
                maxOutputTokens: 1,
            });
        } else {
            responseError(res, `不支持的接口格式: ${interfaceFormat}`, HTTP_STATUS.BUSINESSERROR);
            return;
        }

        success(res, { message: '接口验证有效' });
    } catch (error: any) {
        responseError(res, handleAIError(error.message || '接口验证失败'), HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
});

export default router;
