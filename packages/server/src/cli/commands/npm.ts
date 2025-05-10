import Has, { type Options as HasOptions } from '@/core/npm/has';
import Uninstall, { type Options as UninstallOptions } from '@/core/npm/uninstall';
import Search, { type Options as SearchOptions } from '@/core/npm/search';
interface IOption {
    help?: boolean;
    // 子模块的
    open?: boolean;
    full?: boolean;
    global?: boolean;
}
const search = (args: string[], options: SearchOptions) => {
    new Search().main(args, options);
};
const has = (args: string[], options: HasOptions) => {
    return new Has().main(args, options);
};
const uninstall = (args: string[], options: UninstallOptions) => {
    new Uninstall().main(args, options);
};

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
