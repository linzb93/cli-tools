/**
 * Minimax API 响应数据类型
 */
export interface ModelRemain {
    /** 当前周期总次数 */
    current_interval_total_count: number;
    /** 当前周期剩余次数 */
    current_interval_usage_count: number;
    /** 当前周期开始时间 */
    start_time: number;
    /** 当前周期结束时间（下次重置时间） */
    end_time: number;
    /** 距离重置的剩余时间（毫秒） */
    remains_time: number;
    /** 每周总次数 */
    current_weekly_total_count: number;
    /** 每周剩余次数 */
    current_weekly_usage_count: number;
    /** 每周剩余时间（毫秒） */
    weekly_remains_time: number;
    /** 模型名称 */
    model_name: string;
}

/**
 * 用量 API 响应结构
 */
export interface UsageResponse {
    model_remains: ModelRemain[];
}

/**
 * 解析后的用量数据结构
 */
export interface ParsedUsageData {
    /** 模型名称 */
    modelName: string;
    /** 当前用量 */
    used: number;
    /** 剩余用量 */
    remaining: number;
    /** 总次数 */
    total: number;
    /** 使用百分比 */
    percentage: number;
    /** 下次重置时间 */
    resetTime: string;
    /** 距离重置的剩余时间（毫秒） */
    remainsTime: number;
}

/**
 * Minimax 服务选项
 */
export interface Options {
    /** 刷新间隔（毫秒），默认 3 分钟 */
    interval?: number;
}
