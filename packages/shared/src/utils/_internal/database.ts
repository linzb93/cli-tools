import { join } from 'node:path';
import { Low, JSONFile } from 'lowdb';
import { cacheRoot } from '../constant';

/**
 * 通用的JSON数据库操作工具函数
 * 用于读取和操作本地的JSON文件数据库
 * 
 * @template T 数据库结构类型
 * @template R 返回值类型
 * @param filename 数据库文件名（不含路径）
 * @param callback 操作数据库的回调函数
 * @returns 回调函数的返回值
 */
export async function operateJsonDatabase<T, R>(
    filename: string,
    callback: (data: T, db?: Low<unknown>) => R
): Promise<R> {
    const dbPath = join(cacheRoot, filename);
    const db = new Low(new JSONFile(dbPath));
    await db.read();
    const data = db.data as unknown as T;
    
    let result: any;
    if (typeof callback === 'function') {
        result = await callback(data, db);
    }
    
    // 如果返回值为null或undefined，则写入数据
    if (result === null || result === undefined) {
        await db.write();
    }
    
    return result;
}