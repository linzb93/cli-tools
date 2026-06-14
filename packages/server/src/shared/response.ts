import { Response } from 'express';
import { HTTP_STATUS, AnyObject } from '@cli-tools/shared';

/**
 * 成功响应
 */
export function success(res: Response, data: AnyObject | null = null): Response {
    return res.send({
        code: HTTP_STATUS.SUCCESS,
        result: data,
    });
}

/**
 * 失败响应
 * @param res Express Response
 * @param message 错误信息
 * @param code HTTP状态码，默认业务异常
 */
export function error(res: Response, message: string, code: number = HTTP_STATUS.BUSINESSERROR): Response {
    return res.send({
        code,
        message,
        result: null,
    });
}

// 向后兼容旧代码，默认导出仍为 success
export default success;
