import { HasService, type Options as HasOptions } from '@cli-tools/shared/business/npm/has';
import { UninstallService, type Options as UninstallOptions } from '@cli-tools/shared/business/npm/uninstall';
import { SearchService, type Options as SearchOptions } from '@cli-tools/shared/business/npm/search';
interface IOption {
    help?: boolean;
    // 子模块的
    open?: boolean;
    full?: boolean;
    global?: boolean;
}
const search = (args: string[], options: SearchOptions) => {
    return new SearchService().main(args, options);
};

const has = (args: string[], options: HasOptions) => {
    return new HasService().main(args, options);
};

const uninstall = (args: string[], options: UninstallOptions) => {
    return new UninstallService().main(args, options);
};

export const npmCommand = function (subCommand: string, data: string[], options: IOption) {
    const commandMap = {
        has: () => has(data, options),
        search: () => search(data, options),
        uninstall: () => uninstall(data, options),
    };
    if (commandMap[subCommand]) {
        commandMap[subCommand]();
    }
};
