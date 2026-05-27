import readline from 'node:readline';
import chalk from 'chalk';
import { getCurrentBranchName } from '@/business/git/shared/utils/';
import chokidar from 'chokidar';
import os from 'node:os';
import { root } from '@cli-tools/shared';
import { join } from 'node:path';

export const uiService = async () => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const branchName = await getCurrentBranchName();
    console.log(
        `${chalk.blue(process.cwd().replace(os.homedir(), '~'))} ${chalk.green(`git:(${chalk.magenta(branchName)})`)}`,
    );
    // 监听文件变化
    const watcher = chokidar.watch(join(root, 'packages', 'cli', 'dist-test'), {
        persistent: true,
        ignoreInitial: true,
    });
    watcher.on('change', () => {
        console.log(chalk.red(`检测到变化，正在关闭。`));
        watcher.close();
        rl.close();
    });
    watcher.on('error', (err) => {
        console.log(chalk.red(`watcher error: ${err}`));
    });
};
