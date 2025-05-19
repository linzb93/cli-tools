import axios from 'axios';
import { stringify } from 'node:querystring';
import { yapiAuth } from './auth';

/**
 * Yapi接口返回的项目接口列表项
 */
export interface YapiInterfaceListItem {
    /**
     * 接口唯一标识
     */
    _id: string;

    /**
     * 接口标题
     */
    title: string;

    /**
     * 接口路径
     */
    path: string;

    /**
     * 接口请求方法
     */
    method: string;

    /**
     * 接口最后更新时间
     */
    up_time: number;

    /**
     * 所属项目ID
     */
    project_id: string;
}

/**
 * Yapi接口详情
 */
export interface YapiInterfaceDetail extends YapiInterfaceListItem {
    /**
     * 请求参数查询字段
     */
    req_query: Array<{
        name: string;
        required: string;
        example: string;
        desc: string;
    }>;

    /**
     * 响应体
     */
    res_body: string;
}

/**
 * Yapi接口错误码常量
 */
export const YAPI_ERROR_CODES = {
    /**
     * Token失效错误码
     */
    TOKEN_EXPIRED: 40011,
};

/**
 * 处理token过期的通用方法
 * @param origin Yapi域名
 * @param requestFn 原始请求方法
 * @returns 请求结果
 */
async function handleTokenExpired<T>(requestFn: (cookie: string) => Promise<T>): Promise<T | null> {
    try {
        // 获取初始cookie
        let cookie = await yapiAuth.getYapiCookie();

        // 第一次请求
        const result = await requestFn(cookie);

        // 如果返回null，可能是token问题
        if (result === null) {
            // 尝试获取新的token
            const newCookie = await yapiAuth.manualInputCookie();

            if (!newCookie) {
                return null;
            }

            // 使用新token重新请求
            return await requestFn(newCookie);
        }

        return result;
    } catch (error) {
        return null;
    }
}

/**
 * 获取接口总数
 * @param origin Yapi域名
 * @param cookie 登录cookie
 * @param projectId 项目ID
 * @param catId 分类ID（可选）
 * @returns 接口总数
 */
export async function getYapiInterfaceTotal(obj: {
    origin: string;
    cookie: string;
    projectId: string;
    catId?: string;
}) {
    const { origin, cookie, projectId, catId } = obj;
    const requestFn = async (currentCookie: string) => {
        try {
            const url = catId ? `${origin}/api/interface/list_cat` : `${origin}/api/interface/list`;

            const params = catId ? { page: 1, limit: 1, catid: catId } : { page: 1, limit: 1, project_id: projectId };

            const response = await axios.get(url, {
                headers: { Cookie: currentCookie },
                params,
                paramsSerializer: (params) => stringify(params),
            });

            if (response.data.errcode === YAPI_ERROR_CODES.TOKEN_EXPIRED) {
                return null;
            }

            if (response.data.errcode !== 0) {
                return null;
            }

            return response.data.data.count;
        } catch (error) {
            return null;
        }
    };

    return handleTokenExpired(requestFn);
}

/**
 * 获取接口列表
 * @param origin Yapi域名
 * @param cookie 登录cookie
 * @param projectId 项目ID
 * @param total 接口总数
 * @param catId 分类ID（可选）
 * @returns 接口列表
 */
export async function getYapiInterfaceList(obj: {
    origin: string;
    cookie: string;
    projectId: string;
    total: number;
    catId?: string;
}) {
    const { origin, cookie, projectId, total, catId } = obj;
    const requestFn = async (currentCookie: string) => {
        try {
            const url = catId ? `${origin}/api/interface/list_cat` : `${origin}/api/interface/list`;

            const params = catId
                ? { page: 1, limit: total, catid: catId }
                : { page: 1, limit: total, project_id: projectId };

            const response = await axios.get(url, {
                headers: { Cookie: currentCookie },
                params,
                paramsSerializer: (params) => stringify(params),
            });

            if (response.data.errcode === YAPI_ERROR_CODES.TOKEN_EXPIRED) {
                return null;
            }

            if (response.data.errcode !== 0) {
                return null;
            }

            return response.data.data.list;
        } catch (error) {
            return null;
        }
    };

    return handleTokenExpired(requestFn);
}

/**
 * 获取单个接口详情
 * @param origin Yapi域名
 * @param cookie 登录cookie
 * @param interfaceId 接口ID
 * @returns 接口详情
 */
export async function getYapiInterfaceDetail(
    origin: string,
    cookie: string,
    interfaceId: string
): Promise<YapiInterfaceDetail | null> {
    const requestFn = async (currentCookie: string) => {
        try {
            const url = `${origin}/api/interface/get`;
            const params = { id: interfaceId };

            const response = await axios.get(url, {
                headers: { Cookie: currentCookie },
                params,
                paramsSerializer: (params) => stringify(params),
            });

            if (response.data.errcode === YAPI_ERROR_CODES.TOKEN_EXPIRED) {
                return null;
            }

            if (response.data.errcode !== 0) {
                return null;
            }

            return response.data.data;
        } catch (error) {
            return null;
        }
    };

    return handleTokenExpired(requestFn);
}
