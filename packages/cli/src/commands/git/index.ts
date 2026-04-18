/**
 * git 命令入口函数
 * @param {string} subCommand - 子命令名称
 */
export const gitCommand = function (subCommand: string, nextCommand?: string): void {
    // 子命令映射表
    if (subCommand === 'push') {
        import('./push').then((module) => module.pushCommand());
        return;
    }
    if (subCommand === 'pull') {
        import('./pull').then((module) => module.pullCommand());
        return;
    }
    if (subCommand === 'commit') {
        import('./commit').then((module) => module.commitCommand());
        return;
    }
    if (subCommand === 'tag') {
        import('./tag').then((module) => module.tagCommand(nextCommand || ''));
        return;
    }
    if (subCommand === 'deploy') {
        import('./deploy').then((module) => module.deployCommand());
        return;
    }
    if (subCommand === 'branch') {
        import('./branch').then((module) => module.branchCommand([nextCommand || '']));
        return;
    }
    if (subCommand === 'scan') {
        import('./scan').then((module) => module.scanCommand());
        return;
    }
    if (subCommand === 'merge') {
        import('./merge').then((module) => module.mergeCommand());
        return;
    }
    if (subCommand === 'log') {
        import('./log').then((module) => module.logCommand());
        return;
    }
    if (subCommand === 'clone') {
        import('./clone').then((module) => module.cloneCommand());
        return;
    }
    if (subCommand === 'iteration') {
        import('./iteration').then((module) => module.iterationCommand({}));
        return;
    }

    console.log(`未知的 git 子命令: ${subCommand}`);
    console.log(
        `可用的子命令: ${['push', 'pull', 'commit', 'tag', 'deploy', 'branch', 'scan', 'merge', 'log', 'clone', 'iteration'].join(', ')}`,
    );
};
