import { resolve } from 'node:path';
import del from 'del';
import globalNpm from 'global-modules';
import readPkg, { NormalizedPackageJson } from 'read-pkg';
import { BaseService } from '@cli-tools/shared/src/base/BaseService';
import npm from '../shared';

export interface Options {
    global?: boolean;
}
interface SimilarOption {
    name: string;
}
export class UninstallService extends BaseService {
    async main(args: string[], options: Options) {
        const name = args[0];
        if (options.global) {
            await this.delGlobal(name);
            this.logger.success('删除成功');
            return;
        }
        const listRet = await npm.getList(name);
        if (!listRet.list.length) {
            this.logger.error('没找到，无法删除');
            return;
        }
        if (listRet.list.length === 1) {
            await del(`node_modules/${listRet.list[0]}`);
            this.logger.success('删除成功');
            return;
        }
        const ans = await this.inquirer.prompt([
            {
                message: '发现有多个符合条件的依赖，请选择其中需要删除的',
                type: 'checkbox',
                name: 'ret',
                choices: listRet.list.map((item) => ({
                    name: npm.getVersion(item),
                    value: item,
                })),
            },
        ]);
        try {
            for (const pkg of ans.ret) {
                await del(`node_modules/${pkg}`);
            }
        } catch (error) {
            this.logger.error((error as Error).message);
            return;
        }
        this.logger.success('删除成功');
    }
    // 除了删除全局的文件，还要删除全局命令
    private async delGlobal(name: string) {
        let pkg = {} as NormalizedPackageJson;
        try {
            pkg = await readPkg({
                cwd: resolve(globalNpm, 'node_modules', name),
            });
        } catch (error) {
            const similarNpm = await this.getSimilar(name);
            if ((similarNpm as SimilarOption).name) {
                const { action } = await this.inquirer.prompt([
                    {
                        type: 'confirm',
                        message: `${name}不存在，你想删除的是${(similarNpm as SimilarOption).name}吗？`,
                        default: true,
                        name: 'action',
                    },
                ]);
                if (action) {
                    pkg = await readPkg({
                        cwd: resolve(globalNpm, 'node_modules', (similarNpm as SimilarOption).name),
                    });
                    const cmds = pkg.bin ? Object.keys(pkg.bin) : [];
                    await del((similarNpm as SimilarOption).name, {
                        cwd: resolve(globalNpm, 'node_modules'),
                    });
                    for (const cmd of cmds) {
                        await del([cmd, `${cmd}.cmd`, `${cmd}.ps1`], {
                            cwd: globalNpm,
                        });
                    }
                }
            } else {
                this.logger.error('模块不存在');
                process.exit(1);
            }
        }
        const cmds = pkg.bin ? Object.keys(pkg.bin) : [];
        await del(name, {
            cwd: resolve(globalNpm, 'node_modules'),
        });
        for (const cmd of cmds) {
            await del([cmd, `${cmd}.cmd`, `${cmd}.ps1`], {
                cwd: globalNpm,
            });
        }
    }
    private async getSimilar(name: string): Promise<SimilarOption | Boolean> {
        const similarNpm = `@${name.replace('-', '/')}`;
        if (similarNpm === `@${name}`) {
            return false;
        }
        try {
            await readPkg({
                cwd: resolve(globalNpm, 'node_modules', similarNpm),
            });
            return {
                name: similarNpm,
            };
        } catch (error) {
            return false;
        }
    }
}
