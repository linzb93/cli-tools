import { AIModel } from './base';
import { createDeepseekModel } from './deepseek';
import { createSiliconflowModel } from './siliconflow';
import { createVolcanoImageModel } from './volcano-image';
import { createVolcanoTextModel } from './volcano-text';

/**
 * 获取特定类型的所有可用模型
 * @param type 模型类型 'text' 或 'image'
 * @returns 模型列表
 */
export default async function getModels(type: string): Promise<AIModel[]> {
    // 并行创建所有模型实例
    const models = await Promise.all([
        createDeepseekModel(),
        createSiliconflowModel(),
        createVolcanoTextModel(),
        createVolcanoImageModel(),
    ]);

    return models.filter((model) => model.type === type);
}
