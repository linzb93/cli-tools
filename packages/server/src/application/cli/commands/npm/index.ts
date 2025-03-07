import has from './has';
import search from './search';
import uninstall from './uninstall';

interface IOption {
    help?: boolean;
    // 子模块的
    open?: boolean;
    full?: boolean;
    global?: boolean;
}

export default function (subCommand: string, data: string[], options: IOption) {
    const commandMap = {
        has: () => has(data, options),
        search: () => search(data, options),
        uninstall: () => uninstall(data, options),
    };
    if (commandMap[subCommand]) {
        commandMap[subCommand]();
    }
}
