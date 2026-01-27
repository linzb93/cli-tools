import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

export const HTTP_STATUS = {
    /**
     * 请求成功
     */
    SUCCESS: 200,
    /**
     * 请求参数有误
     */
    BAD_REQUEST: 400,
    /**
     * 账号不匹配或权限不足
     */
    AUTH_DENY: 403,
    /**
     * 请求地址不存在
     */
    NOT_FOUND: 404,
    /**
     * 请求方式错误
     */
    METHOD_NOT_ALLOWED: 405,
    /**
     * 请求超时
     */
    REQUEST_TIMEOUT: 408,
    /**
     * 服务器异常
     */
    INTERNAL_SERVER_ERROR: 500,
    /**
     * 网关超时
     */
    GATEWAY_TIMEOUT: 504,
    /**
     * 系统繁忙，请稍后再试
     */
    DEFAULTERROR: 999,
    /**
     * 未找到记录
     */
    NULLDATA: 3000,
    /**
     * 未登录
     */
    NOTLOGIN: 4000,
    /**
     * 异常
     */
    EXCEPTION: 5000,
    /**
     * 数据验证不通过
     */
    DATAISVALID: 5010,
    /**
     * 数据过期
     */
    DATAEXPIRED: 6000,
    /**
     * 业务性异常
     */
    BUSINESSERROR: 7000,
};

export const levelCharacters = {
    border: '|',
    contain: '├',
    line: '─',
    last: '└',
};
/**
 * cli项目根目录
 */
export const root = join(fileURLToPath(import.meta.url), '../../../../');
/**
 * 存放缓存文件的目录
 */
export const cacheRoot = join(root, 'cache');
/**
 * 存放临时文件的目录，每天会清空一次
 */
export const tempPath = join(cacheRoot, 'temp');
/**
 * 是否是Windows系统
 */
export const isWin = process.platform === 'win32';
