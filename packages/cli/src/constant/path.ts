import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

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
