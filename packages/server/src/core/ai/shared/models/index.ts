import BaseModel from './base';
import DeepseekModel from './deepseek';
import SiliconflowModel from './siliconflow';
import VolcanoImageModel from './volcano-image';
import VolcanoTextModel from './volcano-text';

/**
 * 获取特定类型的所有可用模型
 * @param type 模型类型 'text' 或 'image'
 * @returns 模型列表
 */
export default async function getModels(type: string): Promise<BaseModel[]> {
    const models: BaseModel[] = [
        new DeepseekModel(),
        new SiliconflowModel(),
        new VolcanoTextModel(),
        new VolcanoImageModel(),
    ];

    return models.filter((model) => model.type === type);
}
