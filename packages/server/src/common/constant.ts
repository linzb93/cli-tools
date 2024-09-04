import { fileURLToPath } from "node:url";
import { join } from "node:path";
import internalIp from "internal-ip";
import ls from "./ls";

export const HTTP_STATUS = {
  SUCCESS: 200, // 请求成功
  BAD_REQUEST: 400, // 请求参数有误
  NOT_FOUND: 404, // 请求地址不存在
  AUTH_DENY: 403, // 账号不匹配或权限不足
  METHOD_NOT_ALLOWED: 405, // 请求方式错误
  REQUEST_TIMEOUT: 408, // 请求超时
  INTERNAL_SERVER_ERROR: 500, // 服务器异常
  GATEWAY_TIMEOUT: 504, // 网关超时
  DEFAULTERROR: 999, // 系统繁忙，请稍后再试
  NULLDATA: 3000, // 未找到记录
  NOTLOGIN: 4000, // 未登录
  EXCEPTION: 5000, // 异常
  DATAISVALID: 5010, // 数据验证不通过
  DATAEXPIRED: 6000, // 数据过期
  BUSINESSERROR: 7000, // 业务性异常
};
/**
 * cli项目根目录
 */
export const root = join(fileURLToPath(import.meta.url), "../../../../");
/**
 * 存放缓存文件的目录
 */
export const cacheRoot = join(root, "cache");
/**
 * 存放临时文件的目录，每天会清空一次
 */
export const tempPath = join(cacheRoot, ".temp");
/**
 * 是否是Windows系统
 */
export const isWin = process.platform === "win32";

/**
 * 是否是在公司电脑上运行
 */
export const isInWorkEnv = (async () => {
  return await internalIp.v4() === ls.get('ip.internal')
})()