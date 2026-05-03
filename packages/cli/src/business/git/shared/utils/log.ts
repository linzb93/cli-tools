import { execa } from 'execa';

/**
 * 分割Git日志字符串，将其转换为数组，每个元素为一个提交记录。
 */
export const splitGitLog = async ({
    head,
    cwd = process.cwd(),
    keyword = '',
}: {
    head?: number;
    cwd?: string;
    keyword?: string;
}) => {
    const args = ['log'];
    if (head) args.push(`-${head}`);
    if (keyword) args.push(`--grep=${keyword}`);
    args.push(`--format=%h %ad %s`);
    args.push(`--date=format:%Y-%m-%d %H:%M:%S`);
    const log = await execa('git', args, { cwd });
    const list = log.stdout.split('\n').filter(Boolean);
    let result: {
        id: string;
        date: string;
        message: string;
    }[] = list.map((line) => {
        const splited = line.split(' ');
        const id = splited[0];
        const message = splited.slice(2).join(' ') || '';
        const date = splited.slice(1, 2).join(' ');
        return {
            id,
            date,
            message,
        };
    });
    return result;
};
