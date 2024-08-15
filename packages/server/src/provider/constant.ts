import { fileURLToPath } from "node:url";
import path from "node:path";

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

export const root = path.join(fileURLToPath(import.meta.url), "../../");
export const tempPath = path.join(root, ".temp");
