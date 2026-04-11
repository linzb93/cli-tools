import fs from 'fs-extra';
import { join } from 'node:path';

export interface LogRecord {
    createAt: Date;
    content: string;
}

/**
 * 解析单个日志文件
 * @param filePath 日志文件路径
 * @returns 日志记录数组，包含创建时间和内容
 */
const parseSingleLogFile = async (filePath: string): Promise<LogRecord[]> => {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n').filter((line) => line.trim() !== '');
    const records: LogRecord[] = [];

    for (const line of lines) {
        const match = line.match(/^\[(.*?)\]\s+(.*)$/);
        if (match) {
            records.push({
                createAt: new Date(match[1]),
                content: match[2],
            });
        }
    }

    return records;
};

/**
 * 解析目录下所有日志文件
 * @param dirPath 目录路径
 * @returns 合并后的日志记录数组
 */
export const parseLogDir = async (dirPath: string): Promise<LogRecord[]> => {
    const files = (await fs.readdir(dirPath)).filter((file) => file.endsWith('.log')).sort();
    const records: LogRecord[] = [];

    for (const file of files) {
        const fileRecords = await parseSingleLogFile(join(dirPath, file));
        records.push(...fileRecords);
    }

    return records;
};
