import { pushCommand } from './push';
import { pullCommand } from './pull';

import { deployCommand } from './deploy';
import { branchCommand } from './branch';
import { commitCommand } from './commit';
import { cloneCommand } from './clone';
import { scanCommand } from './scan';
import { mergeCommand } from './merge';
import { logCommand } from './log';
import { tagCommand } from './tag';

/**
 * git 命令入口函数
 * @param {string} subCommand - 子命令名称
 */
export const gitCommand = function (subCommand: string, nextCommand?: string): void {
    // 子命令映射表
    const commandMap: Record<string, (cmd?: string | string[]) => void> = {
        push: pushCommand,
        pull: pullCommand,
        commit: commitCommand,
        tag: tagCommand,
        deploy: deployCommand,
        branch: branchCommand,
        scan: scanCommand,
        merge: mergeCommand,
        log: logCommand,
        clone: cloneCommand,
    };
    // 执行对应的子命令
    if (commandMap[subCommand]) {
        commandMap[subCommand](nextCommand);
    } else {
        console.log(`未知的 git 子命令: ${subCommand}`);
        console.log('可用的子命令: ' + Object.keys(commandMap).join(', '));
    }
};
