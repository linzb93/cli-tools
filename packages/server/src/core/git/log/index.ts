import BaseCommand from '../../BaseCommand';
import { execaCommand as execa } from 'execa';

/**
 * 命令的选项接口
 */
export interface Options {
    head: number;
}

export default class extends BaseCommand {
    async main(options: Options) {
        this.spinner.text = '正在获取Git日志';
        let head = 0;
        if (options.head) {
            head = options.head;
        } else {
            // 获取未推送的提交数量
            const unPushed = await execa('git log --oneline --not --branches');
            head = unPushed.stdout.split('\n').length || 3;
        }
        const log = await execa(`git log -${head}`);
        // 获取某个Commit在哪个分支提交的
        const commit = log.stdout.split('\n').at(-1);
        if (commit) {
            const branch = await execa(`git branch --contains ${commit}`);
            console.log(`该提交在${branch.stdout.split('\n')[0].trim()}分支提交`);
        }
        this.spinner.succeed('Git日志获取成功');
        console.log(log.stdout);
    }
}
