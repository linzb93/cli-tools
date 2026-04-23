import dayjs from 'dayjs';
import { execaCommand as execa } from 'execa';

/**
 * 分割Git日志字符串，将其转换为数组，每个元素为一个提交记录。
 */
export const splitGitLog = async (head: number, cwd: string = process.cwd()) => {
    const log = await execa(`git log -${head}`, { cwd });
    const list = log.stdout.split('\n').filter(Boolean);
    let result: {
        id: string;
        author: string;
        date: string;
        message: string;
    }[] = [];
    for (const line of list) {
        if (line.startsWith('commit')) {
            result.slice(-1)[0]?.message.trimEnd();
            result.push({
                id: line.split(' ')[1],
                author: '',
                date: '',
                message: '',
            });
            continue;
        }
        if (line.startsWith('Author:')) {
            result.slice(-1)[0].author = line.replace('Author: ', '').trim();
            continue;
        }
        if (line.startsWith('Merge:')) {
            continue;
        }
        if (line.startsWith('Date:')) {
            result.slice(-1)[0].date = dayjs(line.replace('Date: ', '').trim()).format('YYYY-MM-DD HH:mm:ss');
            continue;
        }
        result.slice(-1)[0].message += line.trim() + '\n';
    }
    if (result.length) {
        result = result.map((item) => ({
            ...item,
            message: item.message.trimEnd().replace(/\n$/, ''),
        }));
    }
    return result;
};
