import { hasService, type Options as HasOptions } from '@/business/npm/has';
import { uninstallService, type Options as UninstallOptions } from '@/business/npm/uninstall';
import { searchService, type Options as SearchOptions } from '@/business/npm/search';
import { scanService } from '@/business/npm/scan';

interface IOption {
    help?: boolean;
    // 子模块的
    open?: boolean;
    full?: boolean;
    global?: boolean;
    // scan 选项
    package?: string;
    version?: string;
}

export const npmCommand = function (subCommand: string, data: string[], options: IOption) {
    const commandMap: Record<string, () => Promise<any> | void> = {
        has: () => hasService(data, options),
        search: () => searchService(data, options),
        uninstall: () => uninstallService(data, options),
        scan: () => {
            scanService(options.package || '', options.version);
        },
    };
    if (commandMap[subCommand]) {
        commandMap[subCommand]();
    }
};
